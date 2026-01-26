import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Brain, UserCheck } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-50 to-white">
            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2 text-medical-600 font-bold text-xl">
                    <Activity className="h-8 w-8" />
                    <span>TB-Guard AI</span>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="text-slate-600 hover:text-medical-600 font-medium px-4 py-2">Login</Link>
                    <Link to="/register" className="bg-medical-500 text-white px-6 py-2 rounded-full hover:bg-medical-600 transition-colors shadow-lg shadow-medical-500/30 font-medium">
                        Doctor Sign Up
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold mb-6 border border-teal-100">
                        <ShieldCheck className="h-4 w-4" />
                        AI-Powered Early Diagnosis
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
                        Advanced Tuberculosis Screening for <span className="text-medical-500">Rural Healthcare</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Empowering frontline workers with Multimodal AI. Analyze symptoms, vitals, and X-rays instantly to detect TB risk early.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/login" className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors font-medium text-lg">
                            Start Diagnosis
                        </Link>
                        <button className="text-medical-600 font-medium px-8 py-3 hover:bg-medical-50 rounded-xl transition-colors">
                            Read Research
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-medical-500/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="h-12 w-12 bg-medical-100 text-medical-600 rounded-lg flex items-center justify-center">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Analysis Result</h3>
                                <p className="text-sm text-slate-500">Multimodal Assessment</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Risk Probability</span>
                                <span className="font-bold text-danger-500">High Risk (89%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-danger-500 w-[89%]"></div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed">
                                <p><strong>Primary Indicators:</strong> Persistent cough (&gt;3 weeks), low SpO2 (94%), and upper lobe opacity detected in X-ray.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Disclaimer */}
            <footer className="text-center p-6 text-slate-400 text-sm mt-12 bg-slate-50">
                <p className="max-w-2xl mx-auto">
                    <strong>Medical Disclaimer:</strong> This system is a decision support tool and does not replace professional medical diagnosis.
                    All results must be verified by a qualified physician.
                </p>
            </footer>
        </div>
    );
};

export default Landing;
