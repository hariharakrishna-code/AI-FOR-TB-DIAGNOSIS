import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    AlertTriangle, CheckCircle, FileText, Activity,
    User, Thermometer, Brain, Shield, ArrowLeft, Clock,
    ClipboardList, Info, Pill, Microscope
} from 'lucide-react';
import RecentDiagnoses from '../../components/RecentDiagnoses';

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
                        We couldn't find the assessment results.
                    </p>
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
    const finalRisk = result?.final_risk || {};
    const finalRiskLevel = finalRisk.level || 'Low';
    const confidenceScore = finalRisk.probability || finalRisk.confidence || 0;

    const isHighRisk = finalRiskLevel === 'High';
    const isMediumRisk = finalRiskLevel === 'Medium';

    const themeParams = isHighRisk
        ? { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, accent: 'bg-red-600' }
        : isMediumRisk
            ? { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, accent: 'bg-amber-500' }
            : { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, accent: 'bg-emerald-500' };

    const reasoning = result.clinical_reasoning || result.confidence_explanation || "Clinical assessment complete.";
    const recommendations = result.recommended_actions || [];
    const findings = result.findings || [];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">TB Diagnostic Support Report</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Report ID: {result.diagnosis_id} • {new Date(result.timestamp).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="bg-white border-2 border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Print Results
                    </button>
                    <Link to="/dashboard/diagnose" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:ring-4 hover:ring-slate-100 transition-all font-bold text-sm">
                        New Assessment
                    </Link>
                </div>
            </div>

            {/* Main Result Card */}
            <div className={`overflow-hidden rounded-3xl border-2 ${themeParams.border} ${themeParams.bg} shadow-xl`}>
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left: Score Display */}
                    <div className={`lg:col-span-4 p-8 flex flex-col items-center justify-center text-center ${themeParams.accent} text-white`}>
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle className="opacity-20" strokeWidth="12" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                                <circle className="transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={439.8} strokeDashoffset={439.8 * (1 - (confidenceScore / 100))} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black">{confidenceScore}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Confidence</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Final Risk Level</span>
                            <h2 className="text-4xl font-black uppercase tracking-tight">{finalRiskLevel}</h2>
                        </div>
                    </div>

                    {/* Right: Reasoning & Findings */}
                    <div className="lg:col-span-8 p-8 bg-white/60 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className={`h-5 w-5 ${themeParams.color}`} />
                            <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Clinical Decision Logic</h3>
                        </div>

                        <p className="text-lg text-slate-700 leading-relaxed font-medium mb-8">
                            {reasoning}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Key Indicators Identified */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                                    <ClipboardList className="h-3 w-3" /> Positive Indicators
                                </h4>
                                <div className="space-y-2">
                                    {findings.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                            <div className={`w-2 h-2 rounded-full ${themeParams.accent} animate-pulse`} />
                                            <span className="text-xs font-bold text-slate-700">{f}</span>
                                        </div>
                                    ))}
                                    {findings.length === 0 && (
                                        <p className="text-xs text-slate-400 italic italic px-1">Minimal indicators detected.</p>
                                    )}
                                </div>
                            </div>

                            {/* Scoring Breakdown */}
                            <div className="p-6 bg-slate-900 rounded-2xl text-white">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Numerical Risk Engine</h4>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-4xl font-black">{finalRisk.score || 0}</span>
                                    <span className="text-xl text-slate-500 font-bold">/ {finalRisk.max_score || 13}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className={`h-full ${themeParams.accent}`}
                                        style={{ width: `${((finalRisk.score || 0) / (finalRisk.max_score || 13)) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold">Rule-Based Deterministic Scoring</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Microscope className="h-6 w-6 text-slate-900" />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinical Action Protocol</h3>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 ${themeParams.border} ${themeParams.color}`}>
                            {finalRiskLevel} Priority
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all">
                                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <span className="text-sm font-bold text-slate-700 leading-snug">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Patient / System Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between h-[180px]">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-xl">
                                {patient.full_name?.charAt(0)}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assessment For</p>
                                <p className="text-lg font-black">{patient.full_name}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{patient.age}Y • {patient.gender}</span>
                            <Link to={`/dashboard/patients/${patient.id}`} className="text-xs font-bold text-blue-400 hover:text-blue-300">Profile</Link>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-8">
                        <div className="flex items-center gap-2 mb-2 text-blue-700">
                            <Info className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Medical Disclaimer</span>
                        </div>
                        <p className="text-[10px] text-blue-900/60 leading-relaxed font-bold uppercase tracking-tight">
                            THIS IS A CLINICAL DECISION SUPPORT SYSTEM (CDSS). THE ANALYSIS IS BASED ON DETERMINISTIC SCORING OF CLINICAL INDICATORS. FINAL DIAGNOSTIC RESPONSIBILITY LIES WITH THE HEALTHCARE PROVIDER.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent History & Comparison */}
            <RecentDiagnoses refreshTrigger={result.diagnosis_id} />

        </div>
    );
};

export default ResultsPage;
