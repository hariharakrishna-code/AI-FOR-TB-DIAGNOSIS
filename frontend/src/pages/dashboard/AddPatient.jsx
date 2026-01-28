import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const AddPatient = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        gender: 'Male',
        contact_number: '',
        medical_history: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate & Transform Payload
            const payload = {
                ...formData,
                age: parseInt(formData.age),
                contact_number: formData.contact_number.trim() || null,
                medical_history: formData.medical_history.trim() || null
            };

            console.log("Submitting Patient Data:", payload);

            const { data } = await api.post('/patients', payload);
            console.log("Patient Created Successfully:", data);

            // Redirect to diagnosis immediately with the new patient ID
            navigate('/dashboard/diagnose', { state: { patient: data } });
        } catch (err) {
            console.error("Patient Creation Error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.detail || 'Failed to add patient. Please try again.';
            alert(`Error: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Register New Patient</h1>
                    <p className="text-slate-500">Create a profile to start monitoring and diagnosis.</p>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                required
                                className="input-field"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                            <input
                                required
                                type="number"
                                className="input-field"
                                placeholder="45"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                            <select
                                className="input-field"
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                            <input
                                className="input-field"
                                placeholder="+91 98765 43210"
                                value={formData.contact_number}
                                onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medical History / Risk Factors</label>
                        <textarea
                            className="input-field h-32 resize-none"
                            placeholder="Smoker, Diabetes, HIV Status, etc."
                            value={formData.medical_history}
                            onChange={e => setFormData({ ...formData, medical_history: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save & Continue to Diagnosis
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatient;
