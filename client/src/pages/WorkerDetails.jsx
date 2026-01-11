import React, { useState, useEffect } from 'react';
import axios from '../api';
import { UserCheck, Phone, Calendar, MapPin, Briefcase, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WorkerDetails = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, accepted, completed, rejected

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/work-requests/owner');
            if (res.data.success) {
                // Return all requests, let frontend filter handle visibility
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch worker details:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        // Date filter
        if (filterDate && new Date(req.startDate) < new Date(filterDate)) {
            return false;
        }
        // Status filter
        if (statusFilter !== 'all' && req.status !== statusFilter) {
            return false;
        }
        // If status filter is 'pending', we might want to ensure it is actually pending (no worker hired)
        // But the status field from backend handles this ('pending', 'accepted', 'completed', 'rejected')
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-400 bg-green-400/10';
            case 'accepted': return 'text-blue-400 bg-blue-400/10';
            case 'pending': return 'text-yellow-400 bg-yellow-400/10';
            case 'rejected': return 'text-red-400 bg-red-400/10';
            default: return 'text-brand-primary bg-brand-primary/10';
        }
    };

    return (
        <div className="animate-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Work Requests</h1>
                    <p className="text-brand-text-muted">Manage your work requests and hired workers</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-white/10">
                        <Filter className="w-4 h-4 text-brand-text" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-primary"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted (Active)</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-white/10">
                        <label htmlFor="date-filter" className="text-sm text-brand-text font-medium">Date:</label>
                        <input
                            type="date"
                            id="date-filter"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-primary"
                        />
                        {filterDate && (
                            <button onClick={() => setFilterDate('')} className="text-xs text-brand-primary-light hover:text-white px-2">Clear</button>
                        )}
                    </div>
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="glass-card p-8 text-center flex flex-col items-center justify-center">
                    <UserCheck className="w-16 h-16 text-brand-text-muted opacity-50 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Requests Found</h3>
                    <p className="text-brand-text-muted max-w-md">
                        {filterDate || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'You have not created any work requests yet.'}
                    </p>
                    <button onClick={fetchRequests} className="mt-4 px-4 py-2 bg-brand-primary/20 text-brand-primary-light rounded-lg text-sm hover:bg-brand-primary/30 transition-colors">
                        Refresh List
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map((req) => (
                        <div key={req._id} className="glass-card p-6 border-l-4 border-brand-primary relative group">
                            <div className={`absolute top-4 right-4 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${getStatusColor(req.status)}`}>
                                {req.status === 'accepted' ? 'Active' : req.status}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary-dark to-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {req.worker?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{req.worker?.name || (req.status === 'pending' ? 'Not Assigned' : 'Unknown')}</h3>
                                    <span className="text-sm text-brand-text-muted">
                                        {req.status === 'pending' ? 'Waiting for worker' : 'Hired Worker'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-brand-text-muted">
                                    <Briefcase className="w-4 h-4 text-brand-primary" />
                                    <span className="text-sm font-medium text-brand-text-secondary">{req.title} ({req.typeOfWork})</span>
                                </div>

                                <div className="flex items-center gap-3 text-brand-text-muted">
                                    <Phone className="w-4 h-4 text-brand-primary" />
                                    <span className="text-sm">{req.worker?.mobile || 'N/A'}</span>
                                </div>

                                <div className="flex items-center gap-3 text-brand-text-muted">
                                    <Calendar className="w-4 h-4 text-brand-primary" />
                                    <span className="text-sm">
                                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-brand-text-muted">
                                    <MapPin className="w-4 h-4 text-brand-primary" />
                                    <span className="text-sm truncate w-full">{req.location}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                <div className="text-xs text-brand-text-muted">
                                    Amount: <span className="text-brand-secondary font-bold text-base ml-1">₹{req.paymentAmount}</span>
                                </div>
                                {req.worker?.mobile && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(req.worker.mobile);
                                            alert(`Copied: ${req.worker.mobile}`);
                                        }}
                                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                                    >
                                        Copy Mobile No
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkerDetails;
