import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-slate-100 rounded-lg">
                        <SettingsIcon className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Application Configuration</h3>
                        <p className="text-sm text-slate-500">Manage your preferences and system defaults.</p>
                    </div>
                </div>

                <div className="space-y-4 max-w-md">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <span className="font-medium text-slate-700">Dark Mode</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <span className="font-medium text-slate-700">Notifications</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
