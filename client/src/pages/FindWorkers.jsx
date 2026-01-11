import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchWorkers, createWorkRequest } from '../api';
import { useAuth } from '../context/AuthContext';

const FindWorkers = () => {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({ typeOfWork: '', paymentAmount: '', requiredCount: 1, location: '', startDate: '', endDate: '', notes: '', title: '' });

  const doSearch = async () => {
    setLoading(true);
    try {
      const res = await searchWorkers(q);
      if (res.data && res.data.data) setWorkers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // enforce role-based access on client side
    if (!user || (user.role !== 'owner' && user.role !== 'farmer')) {
      navigate('/dashboard');
      return;
    }
    doSearch();
  }, [user]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.typeOfWork.trim()) newErrors.typeOfWork = 'Type of work is required';
    if (!form.paymentAmount || Number(form.paymentAmount) <= 0) newErrors.paymentAmount = 'Valid amount is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (form.startDate && new Date(form.startDate) < new Date().setHours(0, 0, 0, 0)) newErrors.startDate = 'Start date cannot be in the past';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) newErrors.endDate = 'End date must be after start date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendRequest = async () => {
    if (!validate()) return;
    try {
      const payload = {
        title: form.title || `${form.typeOfWork} at ${form.location}`, // Default title if empty
        typeOfWork: form.typeOfWork,
        paymentAmount: Number(form.paymentAmount),
        requiredCount: Number(form.requiredCount),
        location: form.location,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes,
      };
      const res = await createWorkRequest(payload);
      if (res.data && res.data.success) {
        alert('Request created successfully');
        setForm({ typeOfWork: '', paymentAmount: '', requiredCount: 1, location: '', startDate: '', endDate: '', notes: '', title: '' });
        setErrors({});
      }
    } catch (err) { console.error(err); alert('Failed to create request'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-3 text-brand-text-light">Find Workers</h1>
      <p className="text-sm text-brand-text mb-4">Search registered workers and post a job request.</p>

      <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 p-4 mb-4">
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition" placeholder="Search by name or location" />
          <button onClick={doSearch} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg">Search</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 p-4">
          <h3 className="font-semibold mb-2 text-brand-text-light">Registered Workers</h3>
          {loading ? <p className="text-brand-text">Loading...</p> : (
            <div className="space-y-2">
              {workers.length === 0 && <p className="text-brand-text">No workers found</p>}
              {workers.map(w => (
                <div key={w._id} className="border border-brand-primary/20 rounded-lg p-2 flex justify-between items-center bg-slate-800/50">
                  <div>
                    <div className="font-semibold text-brand-text-light">{w.name}</div>
                    <div className="text-xs text-brand-text">{w.location} • {w.mobile}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(w.mobile);
                      alert(`Mobile number copied: ${w.mobile}`);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-600 text-brand-text hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1"
                  >
                    Copy No
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 p-4">
          <h3 className="font-semibold mb-2 text-brand-text-light">Create Job Request</h3>
          <div className="space-y-3">
            <div>
              <input placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition" />
            </div>

            <div>
              <input placeholder="Type of work *" value={form.typeOfWork} onChange={(e) => setForm({ ...form, typeOfWork: e.target.value })} className={`w-full bg-slate-800/50 border-2 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 transition ${errors.typeOfWork ? 'border-red-500 focus:border-red-500' : 'border-brand-primary/20 focus:border-brand-secondary'}`} />
              {errors.typeOfWork && <p className="text-red-400 text-xs mt-1">{errors.typeOfWork}</p>}
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <input placeholder="Payment amount *" value={form.paymentAmount} onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })} className={`w-full bg-slate-800/50 border-2 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 transition ${errors.paymentAmount ? 'border-red-500 focus:border-red-500' : 'border-brand-primary/20 focus:border-brand-secondary'}`} />
                {errors.paymentAmount && <p className="text-red-400 text-xs mt-1">{errors.paymentAmount}</p>}
              </div>
              <div className="w-1/2">
                <input placeholder="Required count" value={form.requiredCount} onChange={(e) => setForm({ ...form, requiredCount: e.target.value })} type="number" className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition" />
              </div>
            </div>

            <div>
              <input placeholder="Location *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`w-full bg-slate-800/50 border-2 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 transition ${errors.location ? 'border-red-500 focus:border-red-500' : 'border-brand-primary/20 focus:border-brand-secondary'}`} />
              {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-xs text-brand-text-muted mb-1 block">Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={`w-full bg-slate-800/50 border-2 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 transition ${errors.startDate ? 'border-red-500 focus:border-red-500' : 'border-brand-primary/20 focus:border-brand-secondary'}`} />
                {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
              </div>
              <div className="w-1/2">
                <label className="text-xs text-brand-text-muted mb-1 block">End Date *</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={`w-full bg-slate-800/50 border-2 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 transition ${errors.endDate ? 'border-red-500 focus:border-red-500' : 'border-brand-primary/20 focus:border-brand-secondary'}`} />
                {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm h-20 text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition" />
            <button onClick={handleSendRequest} className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white py-2 rounded-lg shadow-lg hover:shadow-xl transition-all">Post Request</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindWorkers;
