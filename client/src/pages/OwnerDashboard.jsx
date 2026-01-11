import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEquipment, getDashboardStats, getBookings, getWorkRequestsByOwner, getImageUrl, deleteEquipment } from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import RecordsCalendar from "../components/RecordsCalendar";
import { Trash2 } from "lucide-react";

const OwnerDashboard = () => {
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

    const fetchData = async () => {
        if (authLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }
        if (user.role !== 'owner') {
            // Not an owner — redirect back to dashboard router
            navigate('/dashboard');
            return;
        }

        try {
            const [equipmentRes, statsRes] = await Promise.all([
                getEquipment(),
                getDashboardStats()
            ]);

            setEquipmentList(equipmentRes.data.data || []);
            setStats(statsRes.data);

            try {
                const requestsRes = await getWorkRequestsByOwner();
                setWorkRequests(requestsRes.data.data || []);
            } catch (err) {
                console.error('Failed loading work requests', err);
            }

            try {
                const bookingsRes = await getBookings();
                setOwnerBookings(bookingsRes.data.data || []);
            } catch (err) {
                console.error('Failed loading owner bookings', err);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setDataLoading(false);
        }
    };

    const handleDeleteEquipment = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await deleteEquipment(id);
            if (res.data?.success) {
                setEquipmentList(prev => prev.filter(eq => eq._id !== id));
                setToast({ message: "Equipment deleted successfully", type: "success" });
            } else {
                setToast({ message: "Failed to delete equipment", type: "error" });
            }
        } catch (err) {
            console.error("Error deleting equipment:", err);
            setToast({ message: "Error deleting equipment", type: "error" });
        }
    };

    useEffect(() => {
        fetchData();
        const onBookingDeleted = (e) => {
            const { equipment, equipmentId, message } = e.detail;
            if (equipment) {
                setEquipmentList((prev) =>
                    prev.map((eq) =>
                        eq._id === equipmentId ? { ...eq, ...equipment } : eq
                    )
                );

                setToast({ message: message || `Equipment availability updated`, type: 'success' });
            } else {
                fetchData();
            }
        };

        window.addEventListener('bookingDeleted', onBookingDeleted);
        return () => window.removeEventListener('bookingDeleted', onBookingDeleted);
    }, [user, authLoading]);

    if (authLoading || dataLoading) return <div className="text-center mt-10 text-brand-text">Loading...</div>;

    return (
        <div className="w-full">
            {toast && (
                <div className="fixed top-4 right-4 z-50">
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                </div>
            )}

            <h1 className="text-3xl font-bold mb-6 text-brand-text-light">Owner Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="stat-card bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
                    <h3 className="text-brand-text text-sm font-medium">Total Bookings</h3>
                    <p className="text-3xl font-bold mt-2 text-brand-primary-light">{stats.totalBookings}</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-brand-accent/20 to-brand-accent/5">
                    <h3 className="text-brand-text text-sm font-medium">Active Rentals</h3>
                    <p className="text-3xl font-bold mt-2 text-brand-accent-light">{stats.activeRentals}</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/5">
                    <h3 className="text-brand-text text-sm font-medium">Pending Requests</h3>
                    <p className="text-3xl font-bold mt-2 text-brand-secondary-light">{stats.pendingRequests}</p>
                </div>
            </div>

            <div className="glass-card !p-0 mb-8">
                <div className="px-6 py-4 border-b border-brand-primary/20">
                    <h3 className="font-bold text-brand-text-light">My Equipment</h3>
                </div>

                <div className="p-6">
                    {(equipmentList.filter(eq => String(eq.owner?._id || eq.owner) === user._id).length === 0) ? (
                        <p className="text-brand-text">No equipment listed yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {equipmentList.filter(eq => String(eq.owner?._id || eq.owner) === user._id).map((eq) => (
                                <div key={eq._id} className="equipment-card group">
                                    <div className="equipment-card-image h-40">
                                        <img src={getImageUrl(eq.image)} alt={eq.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4 relative">
                                        <div className="absolute top-2 right-2">
                                            <button
                                                onClick={() => handleDeleteEquipment(eq._id, eq.name)}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 z-10 relative"
                                                title="Delete Equipment"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="font-medium text-lg text-brand-text-light pr-8">{eq.name}</p>
                                        {eq.model && <p className="text-sm text-brand-text">Model: {eq.model}</p>}
                                        <p className="text-sm text-brand-text">Type: {eq.type} | Year: {eq.year}</p>
                                        <p className="text-sm text-brand-text mt-2">₹{eq.pricePerHour || eq.price}/hr</p>
                                        <div className="mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${eq.available === false ? 'bg-red-500/20 text-red-300' : 'bg-brand-primary/20 text-brand-primary-light'}`}>
                                                {eq.available === false ? 'Booked' : 'Available'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card !p-0 mb-8">
                <div className="px-6 py-4 border-b border-brand-primary/20">
                    <h3 className="font-bold text-brand-text-light">My Bookings Calendar</h3>
                </div>
                <div className="p-6">
                    <RecordsCalendar dataType="bookings" />
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
