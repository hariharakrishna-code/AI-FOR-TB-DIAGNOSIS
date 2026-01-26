import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileText, ArrowRight } from 'lucide-react';

const ResultsPage = () => {
    const location = useLocation();
    const { result, patient } = location.state || {}; // Expects { result: { risk_level, confidence, analysis }, patient: {} }

    if (!result) return <div className="p-8 text-center">No results found. Please start a new diagnosis.</div>;

    const isHighRisk = result.risk_level === 'High';
    const isMediumRisk = result.risk_level === 'Medium';

    // Theme logic
    const themeParams = isHighRisk
        ? { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', title: 'High Risk Detected' }
        : isMediumRisk
            ? { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'Medium Risk' }
            : { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', title: 'Low Risk' };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-900">Assessment Results</h1>

            {/* Top Alert Card */}
            <div className={`p-6 rounded-xl border ${themeParams.bg} ${themeParams.border} flex items-start gap-4`}>
                <div className={`p-3 bg-white rounded-full shadow-sm ${themeParams.color}`}>
                    <AlertCircle className="h-8 w-8" />
                </div>
                <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${themeParams.color}`}>{themeParams.title}</h2>
                    <p className="text-slate-700 mt-1">Based on multimodal analysis of symptoms, vitals, and chest X-ray.</p>
                </div>
                <div className="text-right">
                    <span className="block text-sm text-slate-500 uppercase tracking-wide font-semibold">Confidence</span>
                    <span className="text-3xl font-bold text-slate-900">{(result.confidence_score * 100) || 85}%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Analysis */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-medical-500" />
                        AI Analysis Report
                    </h3>
                    <div className="prose prose-sm prose-slate bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-96 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{result.analysis}</p>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="card space-y-6">
                    <h3 className="font-bold text-lg">Recommendations</h3>

                    <ul className="space-y-4">
                        {isHighRisk && (
                            <li className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <strong className="block text-red-700">Immediate Isolation & Referral</strong>
                                    <span className="text-sm text-red-600">Refer patient to District Hospital for CBNAAT confirmation.</span>
                                </div>
                            </li>
                        )}
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5" />
                            <span className="text-slate-700">Schedule follow-up sputum smear microscopy.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-teal-500 mt-0.5" />
                            <span className="text-slate-700">Monitor SpO2 levels daily.</span>
                        </li>
                    </ul>

                    <div className="pt-6 border-t border-slate-100 mt-auto">
                        <Link to="/dashboard" className="btn-primary block text-center w-full">
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
