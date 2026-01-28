import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Activity, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const PatientDetails = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [pRes, hRes] = await Promise.all([
                    api.get(`/patients/${id}`),
                    api.get(`/patients/${id}/history`)
                ]);
                setPatient(pRes.data);
                setHistory(hRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div>Loading patient details...</div>;
    if (!patient) return <div>Patient not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/patients" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="card md:col-span-1 h-fit">
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 mb-4">
                            {patient.full_name.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold">{patient.full_name}</h2>
                        <p className="text-slate-500">ID: #{patient.id}</p>

                        <div className="mt-6 w-full space-y-3 text-left">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Age</span>
                                <span className="font-medium">{patient.age}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Gender</span>
                                <span className="font-medium">{patient.gender}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Contact</span>
                                <span className="font-medium">{patient.contact_number || 'N/A'}</span>
                            </div>
                        </div>

                        <Link
                            to="/dashboard/diagnose"
                            state={{ patient }}
                            className="btn-primary w-full mt-6 justify-center"
                        >
                            Start New Diagnosis
                        </Link>
                    </div>
                </div>

                {/* History */}
                <div className="md:col-span-2 space-y-6">
                    <h3 className="font-bold text-lg text-slate-800">Diagnosis History</h3>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-slate-500 italic">No previous diagnoses recorded.</p>
                        ) : (
                            history.map(record => (
                                <div key={record.id} className="card p-4 border hover:border-medical-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                ${record.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                                                    record.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'}`}>
                                                {record.risk_level} Risk
                                            </span>
                                            <span className="text-slate-400 text-sm ml-3">
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold text-medical-600">
                                            {Math.round((record.confidence_score || 0) * 100)}% Conf.
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-3">{record.ai_analysis}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;
