import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
    </div>
);

const DashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ patients: 0, highRisk: 0, completed: 0 });
    const [recentDiagnoses, setRecentDiagnoses] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await api.get('/stats');
                setStats(statsRes.data);
                if (statsRes.data.recent) {
                    setRecentDiagnoses(statsRes.data.recent);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, []);


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, {user?.full_name || 'Doctor'}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Screened"
                    value={stats.patients}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="High Risk Cases"
                    value={stats.highRisk}
                    icon={AlertTriangle}
                    color="text-red-500"
                    bg="bg-red-50"
                />
                <StatCard
                    title="Diagnoses Today"
                    value={stats.completed}
                    icon={Activity}
                    color="text-teal-600"
                    bg="bg-teal-50"
                />
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent AI Diagnoses</h3>
                            <Link to="/dashboard/patients" className="text-medical-600 text-sm font-medium hover:underline">View All Patients</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentDiagnoses.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No diagnoses recorded yet.</div>
                            ) : (
                                recentDiagnoses.map(d => (
                                    <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs
                                                ${d.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                                                    d.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'}`}>
                                                {d.risk_level}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{d.patient_name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(d.timestamp).toLocaleDateString()} • Conf: {Math.round(d.confidence * 100)}%
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/dashboard/patients/${d.patient_id || ''}`}
                                            className="px-3 py-1.5 text-xs font-medium text-medical-600 bg-medical-50 rounded-lg hover:bg-medical-100"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>


                <div>
                    <div className="bg-gradient-to-br from-medical-500 to-medical-700 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">New TB Diagnosis</h3>
                        <p className="text-medical-100 text-sm mb-6">Start a new multimodal assessment session using AI tools.</p>
                        <Link to="/dashboard/patients/new" className="block w-full bg-white text-medical-600 text-center font-bold py-3 rounded-lg hover:bg-medical-50 transition-colors">
                            Start Assessment
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
