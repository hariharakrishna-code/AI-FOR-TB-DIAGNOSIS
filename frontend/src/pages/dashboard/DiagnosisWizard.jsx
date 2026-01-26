import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Thermometer, UploadCloud, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const StepIndicator = ({ step, label, currentStep }) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;

    return (
        <div className={`flex items-center gap-2 ${isActive ? 'text-medical-600' : isCompleted ? 'text-teal-500' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 
                ${isActive ? 'border-medical-600 bg-medical-50' : isCompleted ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'}`}>
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            <span className="font-medium hidden md:block">{label}</span>
        </div>
    );
};

const DiagnosisWizard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // State
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
    const [symptoms, setSymptoms] = useState({
        cough: false, coughDuration: 0, hemoptysis: false, fever: false, nightSweats: false, weightLoss: false, fatigue: false
    });
    const [vitals, setVitals] = useState({ temp: 98.6, spo2: 98, heartRate: 72, bp: '120/80' });
    const [xrayFile, setXrayFile] = useState(null);
    const [xrayPreview, setXrayPreview] = useState(null);

    // Fetch patients for selection if not pre-selected
    useEffect(() => {
        if (!selectedPatient) {
            api.get('/patients').then(res => setPatients(res.data)).catch(console.error);
        }
    }, [selectedPatient]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setXrayFile(file);
            setXrayPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('patient_id', selectedPatient.id);
        formData.append('symptoms', JSON.stringify(symptoms));
        formData.append('vitals', JSON.stringify(vitals));
        if (xrayFile) formData.append('file', xrayFile);

        try {
            const { data } = await api.post('/diagnose', formData);
            // Navigate to results page with the response data
            navigate('/dashboard/results', { state: { result: data, patient: selectedPatient } });
        } catch (error) {
            console.error("Diagnosis failed", error);
            alert("Analysis failed. Please try again.");
            setLoading(false);
        }
    };

    // --- RENDER STEPS ---

    const renderStep1_Patient = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Select Patient</h3>
            {selectedPatient ? (
                <div className="bg-medical-50 border border-medical-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="font-bold text-medical-900">{selectedPatient.full_name}</p>
                        <p className="text-sm text-medical-700">ID: #{selectedPatient.id} • {selectedPatient.age} yrs • {selectedPatient.gender}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="text-sm text-medical-600 hover:underline">Change</button>
                </div>
            ) : (
                <div className="border rounded-xl p-4 max-h-96 overflow-y-auto space-y-2">
                    {patients.map(p => (
                        <div key={p.id}
                            onClick={() => setSelectedPatient(p)}
                            className="p-3 hover:bg-slate-50 border rounded-lg cursor-pointer flex justify-between items-center">
                            <span className="font-medium">{p.full_name}</span>
                            <span className="text-slate-500 text-sm">{p.contact_number}</span>
                        </div>
                    ))}
                    {patients.length === 0 && <p className="text-center text-slate-500">No patients found.</p>}
                </div>
            )}
            <div className="flex justify-between pt-4">
                <div></div>
                <button disabled={!selectedPatient} onClick={() => setStep(2)} className="btn-primary disabled:opacity-50">Next: Symptoms</button>
            </div>
        </div>
    );

    const renderStep2_Symptoms = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Clinical Symptoms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={symptoms.cough} onChange={e => setSymptoms({ ...symptoms, cough: e.target.checked })} className="w-5 h-5 text-medical-600 rounded" />
                    <span className="font-medium">Persistent Cough</span>
                </label>
                {symptoms.cough && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <label className="text-sm font-medium mb-1 block">Duration (Weeks)</label>
                        <input type="number" value={symptoms.coughDuration} onChange={e => setSymptoms({ ...symptoms, coughDuration: e.target.value })} className="input-field" />
                    </div>
                )}
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={symptoms.hemoptysis} onChange={e => setSymptoms({ ...symptoms, hemoptysis: e.target.checked })} className="w-5 h-5 text-medical-600 rounded" />
                    <span className="font-medium">Blood in Sputum (Hemoptysis)</span>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={symptoms.fever} onChange={e => setSymptoms({ ...symptoms, fever: e.target.checked })} className="w-5 h-5 text-medical-600 rounded" />
                    <span className="font-medium">Fever / Night Sweats</span>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={symptoms.weightLoss} onChange={e => setSymptoms({ ...symptoms, weightLoss: e.target.checked })} className="w-5 h-5 text-medical-600 rounded" />
                    <span className="font-medium">Unexplained Weight Loss</span>
                </label>
            </div>
            <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-900">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Next: Vitals</button>
            </div>
        </div>
    );

    const renderStep3_Vitals = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Vital Signs</h3>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Body Temp (°F)</label>
                    <input type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} className="input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">SpO2 (%)</label>
                    <input type="number" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} className="input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Heart Rate (BPM)</label>
                    <input type="number" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} className="input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Blood Pressure</label>
                    <input type="text" value={vitals.bp} onChange={e => setVitals({ ...vitals, bp: e.target.value })} className="input-field" />
                </div>
            </div>
            <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-900">Back</button>
                <button onClick={() => setStep(4)} className="btn-primary">Next: X-Ray</button>
            </div>
        </div>
    );

    const renderStep4_Xray = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Chest X-Ray Imaging</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                {xrayPreview ? (
                    <div className="relative inline-block">
                        <img src={xrayPreview} alt="Preview" className="max-h-64 rounded-lg shadow-lg" />
                        <button onClick={() => { setXrayFile(null); setXrayPreview(null) }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">×</button>
                    </div>
                ) : (
                    <label className="cursor-pointer block">
                        <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <span className="text-lg font-medium text-slate-700 block">Click to upload X-Ray Image</span>
                        <span className="text-sm text-slate-500">Supports JPG, PNG, DICOM</span>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                    </label>
                )}
            </div>
            <div className="flex justify-between pt-4">
                <button onClick={() => setStep(3)} className="text-slate-500 hover:text-slate-900">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary bg-gradient-to-r from-medical-600 to-teal-500 border-0 flex items-center gap-2 px-8">
                    {loading ? 'Analyzing...' : <>Run AI Analysis <Activity className="h-4 w-4" /></>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Diagnosis Session</h1>
                <p className="text-slate-500">Multimodal TB Risk Assessment</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-between mb-8 px-4">
                <StepIndicator step={1} label="Patient" currentStep={step} />
                <div className="flex-1 border-b border-slate-200 mx-4 self-center h-px relative top-[-10px]"></div>
                <StepIndicator step={2} label="Symptoms" currentStep={step} />
                <div className="flex-1 border-b border-slate-200 mx-4 self-center h-px relative top-[-10px]"></div>
                <StepIndicator step={3} label="Vitals" currentStep={step} />
                <div className="flex-1 border-b border-slate-200 mx-4 self-center h-px relative top-[-10px]"></div>
                <StepIndicator step={4} label="Imaging" currentStep={step} />
            </div>

            {/* Content Card */}
            <div className="card min-h-[400px]">
                {step === 1 && renderStep1_Patient()}
                {step === 2 && renderStep2_Symptoms()}
                {step === 3 && renderStep3_Vitals()}
                {step === 4 && renderStep4_Xray()}
            </div>
        </div>
    );
};

export default DiagnosisWizard;
