import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Activity } from 'lucide-react';
import api from '../../services/api';

const PatientList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/patients')
            .then(res => setPatients(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.id).includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Patient Registry</h1>
                    <p className="text-slate-500">Manage patient records and diagnoses.</p>
                </div>
                <Link to="/dashboard/patients/new" className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Patient
                </Link>
            </div>

            <div className="card">
                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        className="input-field pl-10"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="p-4">ID</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Age / Gender</th>
                                <th className="p-4">Registered</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center">Loading patients...</td></tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No patients found.</td></tr>
                            ) : (
                                filteredPatients.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-slate-500">#{p.id}</td>
                                        <td className="p-4 font-medium text-slate-900">{p.full_name}</td>
                                        <td className="p-4 text-slate-600">{p.age} / {p.gender}</td>
                                        <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 flex justify-end gap-2">
                                            <Link to={`/dashboard/diagnose`} state={{ patient: p }} className="text-medical-600 hover:bg-medical-50 p-2 rounded-lg" title="Diagnose">
                                                <Activity className="h-4 w-4" />
                                            </Link>
                                            <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg" title="View Details">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PatientList;
