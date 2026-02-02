import React, { useState, useEffect } from 'react';
import {
    Clock, Activity, AlertTriangle, CheckCircle, FileText,
    Thermometer, User, BarChart2, X, Microscope, Eye
} from 'lucide-react';
import api from '../services/api';

const RecentDiagnoses = ({ refreshTrigger }) => {
    const [diagnoses, setDiagnoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const res = await api.get('/diagnoses/recent?limit=10');
                setDiagnoses(res.data);
            } catch (err) {
                console.error("Failed to fetch recent diagnoses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, [refreshTrigger]); // Re-fetch if parent triggers

    // Analytics
    const highRiskCount = diagnoses.filter(d => d.risk_level === 'High').length;
    const mediumRiskCount = diagnoses.filter(d => d.risk_level === 'Medium').length;
    const lowRiskCount = diagnoses.filter(d => d.risk_level === 'Low').length;

    // Selection Logic
    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            if (selectedIds.length >= 3) {
                alert("You can compare up to 3 cases at a time.");
                return;
            }
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Helper to get theme by risk
    const getTheme = (level) => {
        switch (level) {
            case 'High': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-800' };
            case 'Medium': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' };
            default: return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' };
        }
    };

    // Modal Content
    const selectedCases = diagnoses.filter(d => selectedIds.includes(d.id));

    return (
        <div className="space-y-6 mt-12 border-t border-slate-200 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Header & Analytics */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Recent Diagnostic Comparison</h2>
                    </div>
                    <p className="text-sm text-slate-500 font-medium max-w-2xl">
                        Audit trail of the last 10 automated assessments. Use the checkboxes to compare algorithmic consistency across different inputs.
                    </p>
                </div>

                {/* Mini Visuals */}
                <div className="flex items-center gap-1 h-3 bg-slate-100 rounded-full overflow-hidden w-full md:w-64 border border-slate-200">
                    <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(highRiskCount / 10) * 100}%` }} title="High Risk" />
                    <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${(mediumRiskCount / 10) * 100}%` }} title="Medium Risk" />
                    <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${(lowRiskCount / 10) * 100}%` }} title="Low Risk" />
                </div>
            </div>

            {/* Controls */}
            {selectedIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <Eye className="h-4 w-4" /> {selectedIds.length} Cases Selected for Comparison
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5">Clear</button>
                        <button
                            onClick={() => setShowCompareModal(true)}
                            className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Compare Analysis
                        </button>
                    </div>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-bold">Loading Comparison Data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {diagnoses.map((d) => {
                        const theme = getTheme(d.risk_level);
                        const isSelected = selectedIds.includes(d.id);

                        return (
                            <div
                                key={d.id}
                                className={`relative group p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
                                    ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}
                                `}
                                onClick={() => toggleSelection(d.id)}
                            >
                                {/* Selection Checkbox */}
                                <div className={`absolute top-4 right-4 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-300'}
                                `}>
                                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    {/* ID, Date, Type */}
                                    <div className="flex justify-between items-start">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            #{d.id} • {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${d.has_xray ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {d.has_xray ? 'Hybrid' : 'Clinical'}
                                        </span>
                                    </div>

                                    {/* Patient */}
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm truncate">{d.patient.full_name}</p>
                                        <p className="text-xs text-slate-500">{d.patient.age}Y • {d.patient.gender}</p>
                                    </div>

                                    {/* Badge */}
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${theme.badge} w-full justify-center`}>
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="text-[10px] font-black uppercase">{d.risk_level}</span>
                                        <span className="text-[10px] opacity-70 ml-1">{(d.confidence_score * 100).toFixed(0)}%</span>
                                    </div>

                                    {/* Indicators Info */}
                                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        {/* Symptoms */}
                                        <div className={`p-1.5 rounded-md ${d.clinical_breakdown.findings?.length > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-300'}`} title="Symptoms Reported">
                                            <FileText className="h-3 w-3" />
                                        </div>
                                        {/* Vitals */}
                                        <div className={`p-1.5 rounded-md ${Object.keys(d.vitals).length > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-300'}`} title="Vitals Analyzed">
                                            <Thermometer className="h-3 w-3" />
                                        </div>
                                        {/* Xray */}
                                        <div className={`p-1.5 rounded-md ${d.has_xray ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-300'}`} title="X-Ray Provided">
                                            <Microscope className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Comparison Modal */}
            {showCompareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Comparative Analysis</h3>
                                <p className="text-sm text-slate-500">Side-by-side verification of deterministic scoring logic.</p>
                            </div>
                            <button onClick={() => setShowCompareModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="h-6 w-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-4 w-1/4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Metric</th>
                                        {selectedCases.map(c => {
                                            const theme = getTheme(c.risk_level);
                                            return (
                                                <th key={c.id} className="p-4 border-b border-slate-200 align-top bg-white border-r last:border-r-0 border-l border-l-slate-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600">{c.patient.full_name.charAt(0)}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900">{c.patient.full_name}</div>
                                                            <div className="text-xs text-slate-400">ID #{c.id}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase ${theme.badge}`}>
                                                        {c.risk_level} Risk
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {/* Row: Score */}
                                    <tr>
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Calculated Score</td>
                                        {selectedCases.map(c => (
                                            <td key={c.id} className="p-4 border-b border-r bg-white font-mono font-bold text-slate-900">
                                                {c.clinical_breakdown.risk_score || c.clinical_breakdown.calculated_score || 'N/A'}/13
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Row: Confidence */}
                                    <tr>
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Model Confidence</td>
                                        {selectedCases.map(c => (
                                            <td key={c.id} className="p-4 border-b border-r bg-white font-mono text-slate-600">
                                                {(c.confidence_score * 100).toFixed(1)}%
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Row: Main Indicators */}
                                    <tr>
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/50 align-top">Key Findings</td>
                                        {selectedCases.map(c => (
                                            <td key={c.id} className="p-4 border-b border-r bg-white align-top">
                                                <ul className="space-y-1">
                                                    {c.clinical_breakdown.findings?.map((f, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                                            <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                                            {f}
                                                        </li>
                                                    )) || <span className="text-slate-400 italic text-xs">No significant findings</span>}
                                                </ul>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Row: X-Ray */}
                                    <tr>
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Imaging Status</td>
                                        {selectedCases.map(c => (
                                            <td key={c.id} className="p-4 border-b border-r bg-white text-xs">
                                                {c.has_xray ? (
                                                    <span className="flex items-center gap-2 text-purple-700 font-bold">
                                                        <Microscope className="h-4 w-4" /> Uploaded & Analyzed
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">No imaging provided</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Row: Engine Logic */}
                                    <tr>
                                        <td className="p-4 font-bold text-slate-700 bg-slate-50/50 align-top">AI Reasoning</td>
                                        {selectedCases.map(c => (
                                            <td key={c.id} className="p-4 border-b border-r bg-white text-xs text-slate-600 italic leading-relaxed align-top">
                                                "{c.ai_analysis}"
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                            <button onClick={() => setShowCompareModal(false)} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">Close Comparison</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentDiagnoses;
