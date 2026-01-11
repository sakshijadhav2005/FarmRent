import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    getAdminAnalytics,
    getAdminActivities,
    getAdminUsers,
    getAdminEquipment,
    getAdminBookings,
    updateAdminUser,
    deleteAdminUser,
    updateAdminEquipment,
    deleteAdminEquipment,
    updateAdminBooking
} from '../api';
import {
    Users, Tractor, Calendar, DollarSign, TrendingUp, Activity,
    ChevronRight, Search, Filter, Edit2, Trash2, Check, X,
    AlertCircle, BarChart3, PieChart, UserCheck, Package, Clock
} from 'lucide-react';

/**
 * Admin Dashboard with φ-based design
 * Comprehensive platform management
 */

const AdminDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [activities, setActivities] = useState([]);
    const [users, setUsers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [user, authLoading, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const [analyticsRes, activitiesRes] = await Promise.all([
                    getAdminAnalytics(),
                    getAdminActivities(10)
                ]);
                setAnalytics(analyticsRes.data?.data);
                setActivities(activitiesRes.data?.data || []);
            } else if (activeTab === 'users') {
                const res = await getAdminUsers(1, 10, '', searchTerm);
                setUsers(res.data?.data || []);
                setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
            } else if (activeTab === 'equipment') {
                const res = await getAdminEquipment(1, 10, '', searchTerm);
                setEquipment(res.data?.data || []);
                setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
            } else if (activeTab === 'bookings') {
                const res = await getAdminBookings(1, 10, '', '');
                setBookings(res.data?.data || []);
                setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (id, updates) => {
        try {
            await updateAdminUser(id, updates);
            fetchData();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteAdminUser(id);
            fetchData();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const handleUpdateEquipment = async (id, updates) => {
        try {
            await updateAdminEquipment(id, updates);
            fetchData();
        } catch (error) {
            console.error('Failed to update equipment:', error);
        }
    };

    const handleDeleteEquipment = async (id) => {
        if (!window.confirm('Delete this equipment and all its bookings?')) return;
        try {
            await deleteAdminEquipment(id);
            fetchData();
        } catch (error) {
            console.error('Failed to delete equipment:', error);
        }
    };

    const handleUpdateBooking = async (id, updates) => {
        try {
            await updateAdminBooking(id, updates);
            fetchData();
        } catch (error) {
            console.error('Failed to update booking:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="relative">
                    <div className="border-4 border-brand-primary/20 rounded-full"
                        style={{ width: '4.236rem', height: '4.236rem' }}></div>
                    <div className="absolute top-0 left-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"
                        style={{ width: '4.236rem', height: '4.236rem' }}></div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'equipment', label: 'Equipment', icon: Tractor },
        { id: 'bookings', label: 'Bookings', icon: Calendar }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.618rem' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{ gap: '1rem' }}>
                <div>
                    <h1 className="font-display font-bold text-brand-text-light"
                        style={{ fontSize: '2.058rem', marginBottom: '0.382rem' }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-brand-text-muted">Manage your platform</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/5 backdrop-blur-lg rounded-xl border border-white/10"
                    style={{ padding: '0.382rem' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 font-medium rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-brand-primary text-white shadow-lg'
                                    : 'text-brand-text-muted hover:text-brand-text-light hover:bg-white/5'
                                    }`}
                                style={{ padding: '0.618rem 1.272rem', fontSize: '0.875rem' }}
                            >
                                <Icon style={{ width: '1rem', height: '1rem' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && analytics && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.618rem' }}>
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={analytics.users.total}
                            change={`+${analytics.users.newThisMonth} this month`}
                            gradient="from-brand-primary/20 to-brand-primary/5"
                            iconGradient="from-brand-primary to-brand-primary-dark"
                        />
                        <StatCard
                            icon={Tractor}
                            label="Total Equipment"
                            value={analytics.equipment.total}
                            change={`${analytics.equipment.active} active`}
                            gradient="from-brand-accent/20 to-brand-accent/5"
                            iconGradient="from-brand-accent to-brand-accent-dark"
                        />
                        <StatCard
                            icon={Calendar}
                            label="Total Bookings"
                            value={analytics.bookings.total}
                            change={`${analytics.bookings.thisWeek} this week`}
                            gradient="from-brand-secondary/20 to-brand-secondary/5"
                            iconGradient="from-brand-secondary to-brand-secondary-dark"
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Total Revenue"
                            value={`₹${(analytics.revenue.total / 1000).toFixed(1)}K`}
                            change={`₹${(analytics.revenue.thisMonth / 1000).toFixed(1)}K this month`}
                            gradient="from-green-500/20 to-green-500/5"
                            iconGradient="from-green-500 to-green-700"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.618rem' }}>
                        {/* Users by Role */}
                        <div className="glass-card" style={{ padding: '1.618rem' }}>
                            <h3 className="font-display font-bold text-brand-text-light"
                                style={{ fontSize: '1.272rem', marginBottom: '1.272rem' }}>
                                Users by Role
                            </h3>
                            <div className="space-y-3">
                                {analytics.users.byRole.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${item._id === 'farmer' ? 'bg-brand-primary' :
                                                item._id === 'owner' ? 'bg-brand-accent' :
                                                    item._id === 'worker' ? 'bg-brand-secondary' : 'bg-purple-500'
                                                }`}></div>
                                            <span className="text-brand-text-light capitalize">{item._id}</span>
                                        </div>
                                        <span className="font-bold text-brand-text-light">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking Status */}
                        <div className="glass-card" style={{ padding: '1.618rem' }}>
                            <h3 className="font-display font-bold text-brand-text-light"
                                style={{ fontSize: '1.272rem', marginBottom: '1.272rem' }}>
                                Booking Status
                            </h3>
                            <div className="space-y-3">
                                {analytics.bookings.byStatus.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${item._id === 'pending' ? 'bg-yellow-500' :
                                                item._id === 'confirmed' ? 'bg-blue-500' :
                                                    item._id === 'completed' ? 'bg-brand-primary' : 'bg-red-500'
                                                }`}></div>
                                            <span className="text-brand-text-light capitalize">{item._id}</span>
                                        </div>
                                        <span className="font-bold text-brand-text-light">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="glass-card" style={{ padding: '1.618rem' }}>
                        <h3 className="font-display font-bold text-brand-text-light"
                            style={{ fontSize: '1.272rem', marginBottom: '1.272rem' }}>
                            Recent Activities
                        </h3>
                        <div className="space-y-3">
                            {activities.slice(0, 8).map((activity, index) => (
                                <div key={index}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'booking' ? 'bg-brand-primary/20' : 'bg-brand-accent/20'
                                        }`}>
                                        {activity.type === 'booking' ? (
                                            <Calendar className="w-4 h-4 text-brand-primary-light" />
                                        ) : (
                                            <UserCheck className="w-4 h-4 text-brand-accent-light" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-brand-text-light">{activity.message}</p>
                                        <p className="text-xs text-brand-text-muted">
                                            {new Date(activity.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-card" style={{ padding: '1.618rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.272rem' }}>
                        <h3 className="font-display font-bold text-brand-text-light" style={{ fontSize: '1.272rem' }}>
                            User Management ({pagination.total})
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-brand-text-light placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Name</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Email</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Role</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Joined</th>
                                    <th className="text-right py-3 px-4 text-brand-text-muted text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-brand-text-light">{u.name}</td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">{u.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                                u.role === 'owner' ? 'bg-brand-accent/20 text-brand-accent-light' :
                                                    u.role === 'farmer' ? 'bg-brand-primary/20 text-brand-primary-light' :
                                                        'bg-brand-secondary/20 text-brand-secondary-light'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                                                    className="bg-white/5 border border-white/10 rounded text-xs py-1 px-2 text-brand-text-light"
                                                >
                                                    <option value="farmer">Farmer</option>
                                                    <option value="owner">Owner</option>
                                                    <option value="worker">Worker</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handleDeleteUser(u._id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
                <div className="glass-card" style={{ padding: '1.618rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.272rem' }}>
                        <h3 className="font-display font-bold text-brand-text-light" style={{ fontSize: '1.272rem' }}>
                            Equipment Management ({pagination.total})
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                            <input
                                type="text"
                                placeholder="Search equipment..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-brand-text-light placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Name</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Type</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Owner</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Price</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-brand-text-muted text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((eq) => (
                                    <tr key={eq._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-brand-text-light">{eq.name}</td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">{eq.type}</td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">{eq.owner?.name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-brand-secondary-light font-medium">
                                            ₹{eq.pricePerHour || eq.price}/hr
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${eq.available ? 'bg-brand-primary/20 text-brand-primary-light' :
                                                'bg-red-500/20 text-red-400'
                                                }`}>
                                                {eq.available ? 'Available' : 'Booked'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateEquipment(eq._id, { available: !eq.available })}
                                                    className={`p-1.5 rounded ${eq.available ? 'hover:bg-red-500/20 text-brand-text-muted' :
                                                        'hover:bg-green-500/20 text-green-400'
                                                        }`}
                                                >
                                                    {eq.available ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEquipment(eq._id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="glass-card" style={{ padding: '1.618rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.272rem' }}>
                        <h3 className="font-display font-bold text-brand-text-light" style={{ fontSize: '1.272rem' }}>
                            Booking Management ({pagination.total})
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Farmer</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Equipment</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Dates</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Amount</th>
                                    <th className="text-left py-3 px-4 text-brand-text-muted text-sm font-medium">Status</th>
                                    <th className="text-right py-3 px-4 text-brand-text-muted text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-brand-text-light">{b.farmer?.name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">{b.equipment?.name || 'N/A'}</td>
                                        <td className="py-3 px-4 text-brand-text-muted text-sm">
                                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-brand-secondary-light font-medium">₹{b.totalPrice}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                                                    b.status === 'completed' ? 'bg-brand-primary/20 text-brand-primary-light' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <select
                                                value={b.status}
                                                onChange={(e) => handleUpdateBooking(b._id, { status: e.target.value })}
                                                className="bg-white/5 border border-white/10 rounded text-xs py-1 px-2 text-brand-text-light"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, change, gradient, iconGradient }) => (
    <div className={`glass-card bg-gradient-to-br ${gradient}`} style={{ padding: '1.618rem' }}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-brand-text-muted font-medium" style={{ fontSize: '0.875rem', marginBottom: '0.382rem' }}>
                    {label}
                </p>
                <p className="font-display font-bold text-brand-text-light" style={{ fontSize: '2.058rem' }}>
                    {value}
                </p>
                <p className="text-brand-text-muted" style={{ fontSize: '0.75rem', marginTop: '0.382rem' }}>
                    {change}
                </p>
            </div>
            <div className={`bg-gradient-to-br ${iconGradient} rounded-xl flex items-center justify-center shadow-lg`}
                style={{ width: '3rem', height: '3rem' }}>
                <Icon className="text-white" style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
        </div>
    </div>
);

export default AdminDashboard;
