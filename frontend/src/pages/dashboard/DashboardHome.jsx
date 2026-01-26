import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';
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
    const [stats, setStats] = useState({ patients: 0, highRisk: 0, completed: 0 });
    const [recentPatients, setRecentPatients] = useState([]);

    useEffect(() => {
        // Fetch real stats
        const fetchData = async () => {
            try {
                const { data } = await api.get('/patients?limit=5');
                setRecentPatients(data);
                // Mock stats for demo (or calculate from full list if API supports)
                setStats({ patients: data.length + 12, highRisk: 3, completed: data.length });
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
                <p className="text-slate-500">Welcome back, Dr. Smith</p>
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
                            <h3 className="font-bold text-slate-900">Recent Patients</h3>
                            <Link to="/dashboard/patients" className="text-medical-600 text-sm font-medium hover:underline">View All</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentPatients.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No patients found. Add one to get started.</div>
                            ) : (
                                recentPatients.map(p => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {p.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{p.full_name}</p>
                                                <p className="text-xs text-slate-500">ID: #{p.id} • {p.age} yrs • {p.gender}</p>
                                            </div>
                                        </div>
                                        <Link to={`/dashboard/patients/${p.id}`} className="p-2 text-slate-400 hover:text-medical-600">
                                            <ArrowRight className="h-5 w-5" />
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
