import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    AlertTriangle, CheckCircle, FileText, Activity,
    User, Thermometer, Brain, Shield, ArrowLeft, Clock
} from 'lucide-react';

const ResultsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // SAFE access (prevents white screen)
    const result = location.state?.result;
    const patient = location.state?.patient;

    // Reactively handle missing state
    React.useEffect(() => {
        if (!result || !patient) {
            console.warn("Missing diagnosis result or patient data. Redirecting...");
            const timer = setTimeout(() => navigate('/dashboard'), 3000);
            return () => clearTimeout(timer);
        }
    }, [result, patient, navigate]);

    // Guard: if page opened incorrectly
    if (!result || !patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 text-center max-w-md rounded-2xl shadow-xl border border-slate-100">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-800">Session Data Missing</h2>
                    <p className="text-slate-500 mt-2 mb-6 leading-relaxed">
                        We couldn't find the assessment results. This can happen if the page is refreshed or accessed directly.
                    </p>
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-6 font-mono">
                        Error: State Context Lost
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" /> Go to Dashboard
                    </button>
                    <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Redirecting in 3 seconds...</p>
                </div>
            </div>
        );
    }

    // Determine Theme safely
    const finalRiskLevel = result?.final_risk?.level || result?.risk_level || 'Low';
    const isHighRisk = finalRiskLevel === 'High';
    const isMediumRisk = finalRiskLevel === 'Medium';

    const themeParams = isHighRisk
        ? { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, badge: 'bg-red-100 text-red-800' }
        : isMediumRisk
            ? { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, badge: 'bg-yellow-100 text-yellow-800' }
            : { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, badge: 'bg-green-100 text-green-800' };

    // Extract structured data from the new pipeline
    const clinical = result.clinical_analysis || {};
    const radiology = result.radiology_analysis || {};
    const fusion = result.fusion_analysis || {};
    const finalRisk = result.final_risk || {};
    const recommendations = result.recommended_actions || [];

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">

            {/* 1. Header & Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TB Diagnostic Support Report</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <Clock className="h-3 w-3" /> System ID: {result.diagnosis_id} • Analysis Date: {new Date(result.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">Print Report</button>
                    <Link to="/dashboard/diagnose" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">New Assessment</Link>
                </div>
            </div>

            {/* 2. Top-Level Decision Support Card */}
            <div className={`border-l-8 ${themeParams.border} ${themeParams.bg} rounded-xl shadow-md p-8`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className={`h-6 w-6 ${themeParams.color}`} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Multimodal Decision result</span>
                        </div>
                        <h2 className={`text-5xl font-black ${themeParams.color} mb-3 uppercase`}>
                            {finalRisk.level} TB PROBABILITY
                        </h2>
                        <p className="text-lg text-slate-700 font-medium leading-relaxed max-w-2xl">
                            {result.confidence_explanation}
                        </p>
                    </div>

                    {/* Final Probability Score Gauge */}
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner border border-slate-100">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                                <circle className={`${themeParams.color} transition-all duration-1000 ease-out`} strokeWidth="10" strokeDasharray={351.8} strokeDashoffset={351.8 * (1 - (finalRisk.probability || 0))} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                            </svg>
                            <span className={`absolute text-2xl font-black ${themeParams.color}`}>
                                {Math.round((finalRisk.probability || 0) * 100)}%
                            </span>
                        </div>
                        <p className="mt-4 text-[10px] font-bold uppercase text-slate-400">Integrated Probability</p>
                    </div>
                </div>
            </div>

            {/* 3. Evidence Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 3A. Clinical Stream */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-blue-500">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <h3 className="font-bold text-slate-800">Clinical Stream Analysis</h3>
                            </div>
                            <span className="text-xl font-black text-blue-600">{Math.round((clinical.probability || 0) * 100)}%</span>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50/50 p-4 rounded-lg">
                                <h4 className="text-[10px] font-bold uppercase text-blue-700 mb-2">Primary Symptom Indicators</h4>
                                <div className="flex flex-wrap gap-2">
                                    {clinical.findings?.map((f, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-blue-200 text-blue-800 text-xs font-semibold rounded-full shadow-sm">
                                            {f}
                                        </span>
                                    ))}
                                    {(!clinical.findings || clinical.findings.length === 0) && <span className="text-xs text-slate-400 italic">No significant symptoms reported</span>}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                                <span className="text-slate-500">Clinical Confidence</span>
                                <span className="font-bold text-slate-800">{Math.round((clinical.confidence || 0) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3B. Radiology Stream */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-purple-500">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-purple-600">
                                <Activity className="h-5 w-5" />
                                <h3 className="font-bold text-slate-800">Rad-IA Inference Engine</h3>
                            </div>
                            <span className="text-xl font-black text-purple-600">{Math.round((radiology.probability || 0) * 100)}%</span>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-purple-50/50 p-4 rounded-lg">
                                <h4 className="text-[10px] font-bold uppercase text-purple-700 mb-2">Radiological Features Extracted</h4>
                                <ul className="space-y-2">
                                    {radiology.findings?.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0"></div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Feature Indices */}
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(radiology.segments || {}).map(([key, val]) => (
                                    <div key={key} className="bg-white border border-slate-100 p-2 rounded text-center shadow-sm">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-sm font-black text-slate-700">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 4A. Actionable Protocol */}
                <div className="lg:col-span-8 bg-slate-900 text-white rounded-xl overflow-hidden shadow-lg border border-slate-800">
                    <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-400" />
                            <h3 className="font-bold">Mandatory Clinical Protocol</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded">WHO ALIGNED</span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((action, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center font-black text-blue-300 text-sm">
                                        {i + 1}
                                    </div>
                                    <span className="font-semibold text-sm">{action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4B. Logic Verification */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Inference Agreement</h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-500">Conflict Matrix Score</span>
                                <span className="text-slate-900">{Math.round((fusion.agreement_score || 0) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${fusion.agreement_score > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${(fusion.agreement_score || 0) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">fusion Strategy</span>
                            </div>
                            <p className="text-xs text-slate-600 italic">
                                "Combined weighted average with inter-model consensus tempering (0.4 Clinical : 0.6 Radiology)"
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                    {patient.full_name?.charAt(0)}
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-slate-900">{patient.full_name}</p>
                                    <p className="text-slate-500">{patient.age}Y • {patient.gender}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-[10px] text-slate-400 max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-bold">
                    Medical Disclaimer: This AI-driven clinical decision support system is designed for academic evaluation.
                    All outputs are derived from fused feature extraction and multimodal Bayesian modeling.
                    Final diagnosis remains the legal responsibility of the attending registered medical practitioner.
                </p>
            </div>
        </div>
    );
};

export default ResultsPage;
