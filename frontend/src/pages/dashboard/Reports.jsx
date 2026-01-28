import React from 'react';
import { FileText } from 'lucide-react';

const Reports = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Medical Reports</h1>
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No Reports generated yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    Detailed PDF reports and aggregation metrics will appear here in future updates.
                </p>
            </div>
        </div>
    );
};

export default Reports;
