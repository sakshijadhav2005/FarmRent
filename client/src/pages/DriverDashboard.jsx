import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, assignDriverToBooking, updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, CheckCircle, Settings, Save, ExternalLink } from 'lucide-react';

const DriverDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]); // Available
    const [assigned, setAssigned] = useState([]); // Accepted
    const [loading, setLoading] = useState(false);
    const [responding, setResponding] = useState(null);
    const [activeTab, setActiveTab] = useState('available');

    // Settings state
    const [rate, setRate] = useState(user?.hourlyRate || 0);
    const [name, setName] = useState(user?.name || '');
    const [mobile, setMobile] = useState(user?.mobile || '');
    const [location, setLocation] = useState(user?.location || '');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getBookings();
            if (res.data && res.data.success) {
                const all = res.data.data || [];
                console.log('DriverDashboard received:', all);
                // Filter available (no driver assigned yet) vs assigned (to me)
                // The backend returns:
                // - Available: driverRequested=true, driver=null
                // - Assigned: driverRequested=true, driver=me
                const myId = user._id;
                const avail = all.filter(b => !b.driver);
                const my = all.filter(b => b.driver && (b.driver._id === myId || b.driver === myId));

                console.log('Available:', avail);
                console.log('Assigned:', my);

                setRequests(avail);
                setAssigned(my);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'driver') {
            navigate('/dashboard');
            return;
        }
        load();
    }, [user]);

    const handleAccept = async (id) => {
        if (!confirm('Are you sure you want to accept this driving request?')) return;
        setResponding(id);
        try {
            await assignDriverToBooking(id);
            await load();
        } catch (err) {
            console.error(err);
            alert('Failed to accept job: ' + (err.response?.data?.message || err.message));
        } finally {
            setResponding(null);
        }
    };

    const handleViewMap = (loc) => {
        if (!loc) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
    };

    // Settings handler moved to component scope
    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await updateProfile({
                name,
                mobile,
                location,
                hourlyRate: rate
            });
            alert('Settings updated successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-brand-text-light">Driver Dashboard</h1>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="stat-card bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
                    <h3 className="text-brand-text text-sm font-medium">Available Pickups</h3>
                    <p className="text-3xl font-bold mt-2 text-brand-primary-light">{requests.length}</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-brand-accent/20 to-brand-accent/5">
                    <h3 className="text-brand-text text-sm font-medium">My Trips</h3>
                    <p className="text-3xl font-bold mt-2 text-brand-accent-light">{assigned.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-brand-primary/20 mb-6">
                <button onClick={() => setActiveTab('available')} className={`pb-2 px-2 transition-colors ${activeTab === 'available' ? 'border-b-2 border-brand-primary text-brand-primary-light font-medium' : 'text-brand-text hover:text-white'}`}>
                    Available Requests ({requests.length})
                </button>
                <button onClick={() => setActiveTab('assigned')} className={`pb-2 px-2 transition-colors ${activeTab === 'assigned' ? 'border-b-2 border-brand-accent text-brand-accent-light font-medium' : 'text-brand-text hover:text-white'}`}>
                    My Schedule ({assigned.length})
                </button>
                <button onClick={() => setActiveTab('settings')} className={`pb-2 px-2 transition-colors ${activeTab === 'settings' ? 'border-b-2 border-brand-secondary text-brand-secondary-light font-medium' : 'text-brand-text hover:text-white'}`}>
                    Settings
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading && <div className="text-center text-brand-text">Loading...</div>}

                {!loading && activeTab === 'available' && requests.map(b => (
                    <div key={b._id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-colors">
                        <div>
                            <h3 className="font-bold text-lg text-brand-text-light">{b.equipment?.name || 'Unknown Equipment'}</h3>
                            <div className="text-sm text-brand-text flex items-center gap-2 mt-1">
                                <MapPin size={14} className="text-brand-primary" />
                                <span>{b.equipment?.location || 'Location not specified'}</span>
                                {b.equipment?.location && (
                                    <button
                                        onClick={() => handleViewMap(b.equipment.location)}
                                        className="text-xs text-brand-primary-light hover:text-brand-primary hover:underline flex items-center gap-1 ml-2 px-2 py-0.5 bg-brand-primary/10 rounded border border-brand-primary/20"
                                        title="View on Google Maps"
                                    >
                                        <ExternalLink size={10} /> View Map
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-brand-text flex items-center gap-2 mt-1">
                                <Calendar size={14} className="text-brand-primary" />
                                {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-brand-text-muted mt-2">Booked by: {b.farmer?.name}</p>
                        </div>
                        <button
                            onClick={() => handleAccept(b._id)}
                            disabled={responding === b._id}
                            className="bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40"
                        >
                            {responding === b._id ? 'Accepting...' : 'Accept Request'}
                        </button>
                    </div>
                ))}

                {!loading && activeTab === 'assigned' && assigned.map(b => (
                    <div key={b._id} className="bg-white/5 p-4 rounded-xl border border-brand-accent/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-brand-text-light">{b.equipment?.name}</h3>
                            <div className="text-sm text-brand-text flex items-center gap-2 mt-1">
                                <MapPin size={14} className="text-brand-accent" />
                                <span>{b.equipment?.location}</span>
                                {b.equipment?.location && (
                                    <button
                                        onClick={() => handleViewMap(b.equipment.location)}
                                        className="text-xs text-brand-accent-light hover:text-brand-accent hover:underline flex items-center gap-1 ml-2 px-2 py-0.5 bg-brand-accent/10 rounded border border-brand-accent/20"
                                        title="View on Google Maps"
                                    >
                                        <ExternalLink size={10} /> View Map
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-brand-text flex items-center gap-2 mt-1">
                                <Calendar size={14} className="text-brand-accent" />
                                {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                            </p>
                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                                <CheckCircle size={12} className="mr-1" /> Confirmed
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <span className="text-brand-accent-light text-sm font-bold block">Contact Farmer</span>
                            <a href={`tel:${b.farmer?.mobile}`} className="text-brand-text hover:text-white text-sm underline">{b.farmer?.mobile}</a>
                        </div>
                    </div>
                ))}

                {!loading && ((activeTab === 'available' && requests.length === 0) || (activeTab === 'assigned' && assigned.length === 0)) && (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-brand-text-muted">No records found.</p>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="glass-card p-6 rounded-xl border border-white/10 max-w-lg">
                        <h3 className="text-xl font-bold text-brand-text-light mb-4 flex items-center gap-2">
                            <Settings size={20} /> Driver Settings
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-brand-text text-sm mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-brand-text text-sm mb-2">Mobile</label>
                                    <input
                                        type="text"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="input-field"
                                        placeholder="Mobile Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-brand-text text-sm mb-2">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="input-field"
                                    placeholder="City, State"
                                />
                            </div>

                            <div>
                                <label className="block text-brand-text text-sm mb-2">My Hourly Rate (₹)</label>
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. 300"
                                />
                                <p className="text-xs text-brand-text-muted mt-1">
                                    This rate will be displayed to farmers when they look for specific drivers.
                                </p>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="flex items-center gap-2 bg-brand-secondary hover:bg-brand-secondary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
