import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, FileText, Settings, LogOut,
    Activity, PlusCircle, Search
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${active
                ? 'bg-medical-50 text-medical-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </Link>
);

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-medical-600 text-white p-2 rounded-lg">
                        <Activity className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-900">TB-Guard</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-4">
                        Clinical
                    </div>
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        path="/dashboard"
                        active={location.pathname === '/dashboard'}
                    />
                    <SidebarItem
                        icon={Users}
                        label="Patients"
                        path="/dashboard/patients"
                        active={location.pathname.startsWith('/dashboard/patients')}
                    />
                    <SidebarItem
                        icon={PlusCircle}
                        label="New Diagnosis"
                        path="/dashboard/diagnose"
                        active={location.pathname === '/dashboard/diagnose'}
                    />

                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-8">
                        System
                    </div>
                    <SidebarItem icon={FileText} label="Reports" path="/dashboard/reports" />
                    <SidebarItem icon={Settings} label="Settings" path="/dashboard/settings" />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                            {user?.full_name?.charAt(0) || 'D'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
