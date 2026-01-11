import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { User, Tractor, List, Calendar, Settings, CheckCircle, XCircle, Clock } from "lucide-react";
import { getEquipment, getDashboardStats, getBookings, getWorkRequestsByOwner, getImageUrl } from "../api";
import BookingCalendar from "../components/BookingCalendar";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [equipmentList, setEquipmentList] = useState([]);
    const [ownerBookings, setOwnerBookings] = useState([]);
    const [workRequests, setWorkRequests] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [stats, setStats] = useState({
        totalBookings: 0,
        activeRentals: 0,
        pendingRequests: 0,
    });

    // Fetch dashboard data (equipment, stats, owner bookings)
    const fetchData = async () => {
        if (authLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }

        try {
            const [equipmentRes, statsRes] = await Promise.all([
                getEquipment(),
                getDashboardStats()
            ]);

            setEquipmentList(equipmentRes.data.data || []);
            setStats(statsRes.data);

            // If owner/farmer, fetch work requests
            if (user.role === 'owner' || user.role === 'farmer') {
                try {
                    const requestsRes = await getWorkRequestsByOwner();
                    setWorkRequests(requestsRes.data.data || []);
                } catch (err) {
                    console.error('Failed loading work requests', err);
                }
            }

            // If owner, fetch bookings for their equipment
            if (user.role === 'owner') {
                try {
                    const bookingsRes = await getBookings();
                    setOwnerBookings(bookingsRes.data.data || []);
                } catch (err) {
                    console.error('Failed loading owner bookings', err);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for booking deletion events with equipment data to update UI instantly
        const onBookingDeleted = (e) => {
            const { equipment, equipmentId, message } = e.detail;

            if (equipment) {
                // Update equipment in list immediately without full re-fetch
                setEquipmentList((prev) =>
                    prev.map((eq) =>
                        eq._id === equipmentId ? { ...eq, ...equipment } : eq
                    )
                );

                // Show toast with availability update
                setToast({
                    message: message || `Equipment availability updated`,
                    type: 'success'
                });
            } else {
                // Fallback to full re-fetch if equipment data not provided
                fetchData();
            }
        };

        // Refresh work requests every 5 seconds to show real-time status updates
        const refreshInterval = setInterval(() => {
            if (user && (user.role === 'owner' || user.role === 'farmer')) {
                getWorkRequestsByOwner()
                    .then(res => setWorkRequests(res.data.data || []))
                    .catch(err => console.error('Failed to refresh work requests:', err));
            }
        }, 5000);

        window.addEventListener('bookingDeleted', onBookingDeleted);
        return () => {
            window.removeEventListener('bookingDeleted', onBookingDeleted);
            clearInterval(refreshInterval);
        };
    }, [user, authLoading, navigate]);

    if (authLoading || dataLoading) return <div className="text-center mt-10 text-brand-text">{t('common.loading')}</div>;

    return (
        <div className="w-full">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-50">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            <div>
                {/* Main Content */}
                <div className="w-full">
                    <h1 className="text-3xl font-bold mb-6 text-brand-text-light">{t('nav.dashboard')}</h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20">
                            <h3 className="text-brand-text text-sm font-medium">{t('dashboard.totalBookings')}</h3>
                            <p className="text-3xl font-bold mt-2 text-brand-primary-light">{stats.totalBookings}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20">
                            <h3 className="text-brand-text text-sm font-medium">{t('dashboard.activeRentals')}</h3>
                            <p className="text-3xl font-bold mt-2 text-brand-accent-light">{stats.activeRentals}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20">
                            <h3 className="text-brand-text text-sm font-medium">{t('dashboard.pendingRequests')}</h3>
                            <p className="text-3xl font-bold mt-2 text-brand-secondary-light">{stats.pendingRequests}</p>
                        </div>
                    </div>

                    {/* Equipment Section - Owner sees their equipment; Farmer sees available equipment to book */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                        <div className="px-6 py-4 border-b border-brand-primary/20">
                            <h3 className="font-bold text-brand-text-light">{user.role === 'owner' ? t('dashboard.myEquipment') : t('dashboard.availableEquipment')}</h3>
                        </div>

                        <div className="p-6">
                            {user.role === 'owner' ? (
                                // Owner view: list equipment they own
                                (equipmentList.filter(eq => String(eq.owner?._id || eq.owner) === user._id).length === 0) ? (
                                    <p className="text-brand-text">No equipment listed yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {equipmentList.filter(eq => String(eq.owner?._id || eq.owner) === user._id).map((eq) => (
                                            <div key={eq._id} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-lg overflow-hidden border border-white/20 transition hover:border-brand-primary/50">
                                                <img
                                                    src={getImageUrl(eq.image)}
                                                    alt={eq.name}
                                                    className="w-full h-40 object-cover"
                                                />
                                                <div className="p-4">
                                                    <p className="font-medium text-lg text-brand-text-light">{eq.name}</p>
                                                    {eq.model && <p className="text-sm text-brand-text">Model: {eq.model}</p>}
                                                    <p className="text-sm text-brand-text">
                                                        Type: {eq.type} | Year: {eq.year}
                                                    </p>
                                                    <p className="text-sm text-brand-text mt-2">₹{eq.pricePerHour || eq.price}/hr</p>
                                                    <div className="mt-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${eq.available === false ? 'bg-red-500/20 text-red-300' : 'bg-brand-primary/20 text-brand-primary-light'}`}>
                                                            {eq.available === false ? t('common.booked') : t('common.available')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                // Farmer view: show available equipment added by owners
                                (equipmentList.filter(eq => eq.available !== false && String(eq.owner?._id || eq.owner) !== user._id).length === 0) ? (
                                    <p className="text-brand-text">No equipment available for booking right now.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {equipmentList.filter(eq => eq.available !== false && String(eq.owner?._id || eq.owner) !== user._id).map((eq) => (
                                            <div key={eq._id} className="bg-white/10 backdrop-blur-xl rounded-lg shadow-lg overflow-hidden border border-white/20 transition hover:border-brand-primary/50">
                                                <img
                                                    src={getImageUrl(eq.image)}
                                                    alt={eq.name}
                                                    className="w-full h-40 object-cover"
                                                />
                                                <div className="p-4">
                                                    <p className="font-medium text-lg text-brand-text-light">{eq.name}</p>
                                                    {eq.model && <p className="text-sm text-brand-text">Model: {eq.model}</p>}
                                                    <p className="text-sm text-brand-text">Owner: {eq.owner?.name || 'Owner'}</p>
                                                    <p className="text-sm text-brand-text">
                                                        Type: {eq.type} | Year: {eq.year}
                                                    </p>
                                                    <p className="text-sm text-brand-text mt-2">₹{eq.pricePerHour || eq.price}/hr</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-primary/20 text-brand-primary-light">{t('common.available')}</span>
                                                        <button onClick={() => navigate(`/equipment/${eq._id}`)} className="px-3 py-1 bg-brand-primary hover:bg-brand-primary-dark text-white rounded text-xs">{t('booking.bookNow')}</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Owner Bookings Panel */}
                    {user.role === 'owner' && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20 mt-6">
                            <h3 className="font-bold text-brand-text-light mb-4">{t('dashboard.equipmentBookings')}</h3>
                            <BookingCalendar />
                        </div>
                    )}

                    {/* Work Requests Panel - for owners and farmers */}
                    {(user.role === 'owner' || user.role === 'farmer') && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden mt-8">
                            <div className="px-6 py-4 border-b border-brand-primary/20">
                                <h3 className="font-bold text-brand-text-light">{t('dashboard.workRequests')}</h3>
                            </div>
                            <div className="p-6">
                                {workRequests.length === 0 ? (
                                    <p className="text-brand-text">No work requests posted yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {workRequests.map((req) => (
                                            <div key={req._id} className="bg-white/5 backdrop-blur-xl rounded-lg p-4 border border-white/10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-lg text-brand-text-light">{req.title || req.typeOfWork}</h4>
                                                        <p className="text-sm text-brand-text">{req.typeOfWork} • ₹{req.paymentAmount} • {req.requiredCount} workers needed</p>
                                                        <p className="text-sm text-brand-text">Location: {req.location}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {req.status === 'pending' && (
                                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                                                                <Clock className="h-3 w-3" />
                                                                Pending
                                                            </span>
                                                        )}
                                                        {req.status === 'accepted' && (
                                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand-primary/20 text-brand-primary-light">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Accepted by {req.worker?.name || 'Worker'}
                                                            </span>
                                                        )}
                                                        {req.status === 'rejected' && (
                                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                                                                <XCircle className="h-3 w-3" />
                                                                Rejected by {req.respondedBy?.name || 'Worker'}{req.respondedAt ? ` • ${new Date(req.respondedAt).toLocaleString()}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {req.notes && (
                                                    <p className="text-sm text-brand-text bg-slate-900/50 p-2 rounded border border-brand-primary/20">
                                                        <strong className="text-brand-text-light">Notes:</strong> {req.notes}
                                                    </p>
                                                )}
                                                {/* Timeline: posted + response history */}
                                                <div className="mt-3 text-sm text-brand-text">
                                                    <div className="mb-2 font-medium text-brand-text-light">Timeline</div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-brand-text">
                                                            <div className="w-2 h-2 rounded-full bg-brand-accent" />
                                                            <div>Posted by {req.owner?.name || 'Owner'} • {new Date(req.createdAt).toLocaleString()}</div>
                                                        </div>
                                                        {(req.responseHistory || []).map((h, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                                <div className={`w-2 h-2 rounded-full ${h.action === 'accept' ? 'bg-brand-primary' : h.action === 'reject' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                                                <div className="text-brand-text">{h.action.toUpperCase()} by {h.user?.name || h.user} • {h.at ? new Date(h.at).toLocaleString() : ''}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
