import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getEquipment, getBookings, getWorkRequestsByOwner, getImageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import { Calendar, Package, Users, Clock, X, ChevronRight, MapPin, Star } from "lucide-react";

/**
 * GOLDEN RATIO FARMER DASHBOARD
 * φ = 1.618 applied throughout:
 * - Grid gaps: φ-based
 * - Card padding: φ-based
 * - Stats: φ proportions
 * - Spacing: φ multipliers
 */

const FarmerDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [equipmentList, setEquipmentList] = useState([]);
    const [workRequests, setWorkRequests] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchData = async () => {
        if (authLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }
        if (user.role !== 'farmer') {
            navigate('/dashboard');
            return;
        }

        try {
            const equipmentRes = await getEquipment();
            setEquipmentList(equipmentRes.data.data || []);

            try {
                const [requestsRes, bookingsRes] = await Promise.all([
                    getWorkRequestsByOwner(),
                    getBookings()
                ]);
                setWorkRequests(requestsRes.data.data || []);
                setBookings(bookingsRes.data.data || []);
            } catch (err) {
                console.error('Failed loading dashboard data', err);
            }
        } catch (err) {
            console.error('Error loading farmer dashboard', err);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, authLoading]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '38.2vh' }}>
                <div className="relative">
                    <div className="border-4 border-brand-primary/20 rounded-full"
                        style={{ width: '4.236rem', height: '4.236rem' }}></div>
                    <div className="absolute top-0 left-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"
                        style={{ width: '4.236rem', height: '4.236rem' }}></div>
                </div>
            </div>
        );
    }

    const stats = [
        {
            labelKey: 'dashboard.totalBookings',
            value: bookings.length,
            icon: Calendar,
            gradient: 'from-brand-primary/20 to-brand-primary/5',
            iconGradient: 'from-brand-primary to-brand-primary-dark',
            color: 'brand-primary-light',
        },
        {
            labelKey: 'dashboard.pendingRequests',
            value: workRequests.filter(r => r.status === 'pending').length,
            icon: Clock,
            gradient: 'from-brand-accent/20 to-brand-accent/5',
            iconGradient: 'from-brand-accent to-brand-accent-dark',
            color: 'brand-accent-light',
        },
        {
            labelKey: 'dashboard.workRequests',
            value: workRequests.length,
            icon: Users,
            gradient: 'from-brand-secondary/20 to-brand-secondary/5',
            iconGradient: 'from-brand-secondary to-brand-secondary-dark',
            color: 'brand-secondary-light',
        },
    ];

    const availableEquipment = equipmentList.filter(eq => {
        if (String(eq.owner?._id || eq.owner) === user._id) return false;

        if (!filterDate) {
            return eq.available !== false;
        }

        const selectedDate = new Date(filterDate);
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

        const isBooked = bookings.some(b => {
            const equipmentId = String(b.equipment?._id || b.equipment);
            if (equipmentId !== eq._id) return false;

            const bookingStart = new Date(b.startDate);
            const bookingEnd = new Date(b.endDate);

            return bookingStart <= endOfDay && bookingEnd >= startOfDay;
        });

        return !isBooked;
    });

    const filteredBookings = bookings.filter(b => {
        const dateMatch = !filterDate || new Date(b.startDate).toISOString().slice(0, 10) === filterDate;
        const statusMatch = filterStatus === 'all' || b.paymentStatus === filterStatus;
        return dateMatch && statusMatch;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.618rem' }}>
            {/* Page Header */}
            <div>
                <h1 className="font-display font-bold text-brand-text-light"
                    style={{ fontSize: '2.058rem', marginBottom: '0.382rem' }}>
                    {t('dashboard.welcome')}, {user.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-brand-text-muted" style={{ fontSize: '1rem' }}>
                    {t('dashboard.subtitle')}
                </p>
            </div>

            {/* Stats Grid - φ gap */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1.618rem' }}>
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index}
                            className={`stat-card bg-gradient-to-br ${stat.gradient}`}
                            style={{ padding: '1.618rem' }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-brand-text-muted font-medium"
                                        style={{ fontSize: '0.875rem', marginBottom: '0.382rem' }}>
                                        {t(stat.labelKey)}
                                    </p>
                                    <p className={`font-display font-bold text-${stat.color}`}
                                        style={{ fontSize: '2.618rem' }}>
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`bg-gradient-to-br ${stat.iconGradient} shadow-lg flex items-center justify-center`}
                                    style={{ padding: '0.618rem', borderRadius: '0.618rem' }}>
                                    <Icon className="text-white" style={{ width: '1.618rem', height: '1.618rem' }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Available Equipment Section */}
            <div className="glass-card" style={{ borderRadius: '1.618rem', overflow: 'hidden' }}>
                {/* Section Header - φ padding */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5"
                    style={{ padding: '1.618rem', gap: '1rem' }}>
                    <div>
                        <h2 className="font-display font-bold text-brand-text-light"
                            style={{ fontSize: '1.618rem' }}>
                            Available Equipment
                        </h2>
                        <p className="text-brand-text-muted" style={{ fontSize: '0.875rem', marginTop: '0.236rem' }}>
                            Browse and book equipment for your farm
                        </p>
                    </div>
                    <div className="flex items-center" style={{ gap: '0.618rem' }}>
                        <div className="relative">
                            <input type="date" value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '2.618rem', paddingRight: '1rem', fontSize: '0.875rem' }} />
                            <Calendar className="absolute text-brand-text-muted"
                                style={{ left: '0.618rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem' }} />
                        </div>
                        {filterDate && (
                            <button onClick={() => setFilterDate('')}
                                className="bg-white/5 hover:bg-white/10 transition-phi"
                                style={{ padding: '0.618rem', borderRadius: '0.618rem' }}>
                                <X className="text-brand-text-muted" style={{ width: '1rem', height: '1rem' }} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Equipment Grid - φ gap */}
                <div style={{ padding: '1.618rem' }}>
                    {availableEquipment.length === 0 ? (
                        <div className="text-center" style={{ padding: '4.236rem 1.618rem' }}>
                            <Package className="mx-auto text-brand-text-muted"
                                style={{ width: '2.618rem', height: '2.618rem', marginBottom: '1rem' }} />
                            <p className="text-brand-text-muted" style={{ fontSize: '1rem' }}>
                                {filterDate ? 'No equipment available for the selected date.' : 'No equipment available right now.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.618rem' }}>
                            {availableEquipment.slice(0, 6).map((eq) => (
                                <Link key={eq._id} to={`/equipment/${eq._id}`} className="equipment-card group">
                                    {/* Image - φ aspect ratio */}
                                    <div className="equipment-card-image">
                                        <img src={getImageUrl(eq.image)}
                                            alt={eq.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-phi"
                                            style={{ transitionDuration: '685ms' }} />
                                        {/* Rating Badge */}
                                        <div className="absolute badge badge-primary z-10 backdrop-blur-sm"
                                            style={{ top: '0.618rem', right: '0.618rem' }}>
                                            <Star style={{ width: '0.618rem', height: '0.618rem', marginRight: '0.236rem' }} className="fill-current" />
                                            {eq.rating || 4.5}
                                        </div>
                                    </div>

                                    {/* Content - φ padding */}
                                    <div style={{ padding: '1rem' }}>
                                        <h3 className="font-display font-bold text-brand-text-light"
                                            style={{ fontSize: '1.125rem', marginBottom: '0.236rem' }}>
                                            {eq.name}
                                        </h3>
                                        {eq.model && (
                                            <p className="text-brand-text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.382rem' }}>
                                                {eq.model} {eq.year && `• ${eq.year}`}
                                            </p>
                                        )}

                                        <div className="flex items-center text-brand-text-muted"
                                            style={{ fontSize: '0.875rem', marginBottom: '0.618rem' }}>
                                            <MapPin style={{ width: '1rem', height: '1rem', marginRight: '0.236rem' }} />
                                            {eq.location || 'Location not specified'}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5"
                                            style={{ paddingTop: '0.618rem' }}>
                                            <div>
                                                <span className="font-bold text-brand-secondary-light" style={{ fontSize: '1.618rem' }}>
                                                    ₹{eq.pricePerHour || eq.price}
                                                </span>
                                                <span className="text-brand-text-muted" style={{ fontSize: '0.75rem' }}>/hr</span>
                                            </div>
                                            <div className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/30 transition-all flex items-center justify-center cursor-pointer"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                                <span>Book Now</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* My Bookings Section */}
            <div className="glass-card" style={{ borderRadius: '1.618rem', overflow: 'hidden' }}>
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5"
                    style={{ padding: '1.618rem', gap: '1rem' }}>
                    <div>
                        <h2 className="font-display font-bold text-brand-text-light"
                            style={{ fontSize: '1.618rem' }}>
                            My Bookings
                        </h2>
                        <p className="text-brand-text-muted" style={{ fontSize: '0.875rem', marginTop: '0.236rem' }}>
                            Track and manage your equipment bookings
                        </p>
                    </div>
                    <div className="flex items-center" style={{ gap: '0.382rem' }}>
                        {['all', 'pending', 'completed'].map((status) => (
                            <button key={status} onClick={() => setFilterStatus(status)}
                                className={`font-medium capitalize transition-phi ${filterStatus === status
                                    ? status === 'pending'
                                        ? 'bg-brand-warning/20 text-brand-warning'
                                        : status === 'completed'
                                            ? 'bg-brand-success/20 text-brand-success'
                                            : 'bg-brand-primary/20 text-brand-primary-light'
                                    : 'bg-white/5 text-brand-text-muted hover:bg-white/10'
                                    }`}
                                style={{ padding: '0.382rem 1rem', borderRadius: '0.618rem', fontSize: '0.875rem' }}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings List - φ spacing */}
                <div style={{ padding: '1.618rem' }}>
                    {filteredBookings.length === 0 ? (
                        <div className="text-center" style={{ padding: '4.236rem 1.618rem' }}>
                            <Calendar className="mx-auto text-brand-text-muted"
                                style={{ width: '2.618rem', height: '2.618rem', marginBottom: '1rem' }} />
                            <p className="text-brand-text-muted" style={{ fontSize: '1rem' }}>
                                No bookings match the current filters.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.618rem' }}>
                            {filteredBookings.map((booking) => (
                                <div key={booking._id}
                                    className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/30 transition-phi"
                                    style={{ padding: '1.272rem 1.618rem', borderRadius: '1rem' }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: '1rem' }}>
                                        <div className="flex-1">
                                            <div className="flex items-center" style={{ gap: '0.618rem', marginBottom: '0.382rem' }}>
                                                <h4 className="font-display font-bold text-brand-text-light"
                                                    style={{ fontSize: '1.125rem' }}>
                                                    {booking.equipment?.name || 'Booking'}
                                                </h4>
                                                <span className={`badge ${booking.paymentStatus === 'completed'
                                                    ? 'badge-primary'
                                                    : 'badge-warning'
                                                    }`}>
                                                    {booking.paymentStatus}
                                                </span>
                                            </div>
                                            <p className="flex items-center text-brand-text-muted"
                                                style={{ fontSize: '0.875rem', gap: '0.382rem' }}>
                                                <Clock style={{ width: '1rem', height: '1rem' }} />
                                                {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center" style={{ gap: '1.618rem' }}>
                                            <div className="text-right">
                                                <p className="font-bold text-brand-secondary-light" style={{ fontSize: '1.618rem' }}>
                                                    ₹{booking.totalPrice}
                                                </p>
                                                <p className="text-brand-text-muted" style={{ fontSize: '0.688rem' }}>Total Amount</p>
                                            </div>
                                            <ChevronRight className="text-brand-text-muted group-hover:text-brand-primary-light group-hover:translate-x-1 transition-phi"
                                                style={{ width: '1.272rem', height: '1.272rem' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
