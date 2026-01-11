import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck, Calendar, CreditCard, Star, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount, deleteNotification } from '../api';

/**
 * Notification Bell Component
 * Dropdown with notifications list
 */
const NotificationDetailModal = ({ notification, onClose, onAcknowledge }) => {
    if (!notification) return null;

    // Helper for safe data access
    const getData = (key) => notification.data && notification.data[key];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="neu-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 neu-icon-btn w-8 h-8"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-4">
                    {/* Header with Icon */}
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center neu-inset text-brand-text-light`}>
                            {/* Reuse getIcon logic passed or duplicated */}
                            {notification.type === 'booking' && <Calendar className="w-6 h-6 text-brand-primary" />}
                            {notification.type === 'payment' && <CreditCard className="w-6 h-6 text-brand-secondary" />}
                            {notification.type === 'review' && <Star className="w-6 h-6 text-yellow-500" />}
                            {['system', 'wishlist', 'reminder'].includes(notification.type) && <AlertCircle className="w-6 h-6 text-brand-accent" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-text-light">{notification.title}</h3>
                            <span className="text-xs text-brand-text-muted">{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="neu-inset p-4 text-brand-text-light leading-relaxed">
                        {notification.message}
                    </div>

                    {/* Metadata / Extra Details */}
                    {notification.data && Object.keys(notification.data).length > 0 && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {getData('bookingId') && (
                                <div className="neu-card p-3">
                                    <span className="block text-xs text-brand-text-muted">Booking ID</span>
                                    <span className="font-mono text-brand-primary-light">{getData('bookingId').slice(-6).toUpperCase()}</span>
                                </div>
                            )}
                            {getData('amount') && (
                                <div className="neu-card p-3">
                                    <span className="block text-xs text-brand-text-muted">Amount</span>
                                    <span className="font-bold text-brand-secondary-light">₹{getData('amount')}</span>
                                </div>
                            )}
                            {/* Add more specific fields as needed */}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => {
                                onAcknowledge(notification._id);
                                onClose();
                            }}
                            className="neu-btn flex-1 py-3 text-red-400 hover:text-red-500 gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Acknowledge & Remove
                        </button>
                        <button
                            onClick={onClose}
                            className="neu-btn flex-1 py-3"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationBell = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await getUnreadNotificationCount();
            if (response.data?.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await getNotifications(1, false);
            if (response.data?.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (id, event) => {
        if (event) event.stopPropagation();
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to acknowledge notification:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <Calendar className="w-4 h-4" />;
            case 'payment': return <CreditCard className="w-4 h-4" />;
            case 'review': return <Star className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'booking': return 'text-brand-primary-light';
            case 'payment': return 'text-brand-secondary-light';
            case 'review': return 'text-yellow-400';
            default: return 'text-brand-accent-light';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`neu-icon-btn relative ${isOpen ? 'text-brand-primary-light' : ''}`}
            >
                <Bell className="w-5 h-5 pointer-events-none" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md border-2 border-[var(--neu-bg)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 neu-card z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                        <h3 className="font-semibold text-brand-text-light">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-brand-primary-light hover:underline flex items-center gap-1"
                            >
                                <CheckCheck className="w-3 h-3" />
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[25rem] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-brand-text-muted">
                                {t('common.loading')}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="neu-inset w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                    <Bell className="w-8 h-8 text-brand-text-muted" />
                                </div>
                                <p className="text-brand-text-muted text-sm">{t('notifications.noNotifications')}</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-2">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        onClick={() => setSelectedNotification(notif)}
                                        className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${notif.read
                                                ? 'border-transparent hover:bg-white/5'
                                                : 'neu-card border-brand-primary/20' // Unread pops out
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`mt-1 p-2 rounded-full neu-inset ${getIconColor(notif.type)}`}>
                                                {getIcon(notif.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${notif.read ? 'text-brand-text-muted' : 'text-brand-text-light'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-brand-text-muted mt-0.5 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-brand-text-dark mt-1 block">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Action Overlay (Appears on Hover) */}
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleAcknowledge(notif._id, e)}
                                                className="p-1.5 neu-btn hover:text-red-400 text-brand-text-muted"
                                                title="Acknowledge"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-white/5 bg-white/5 text-center">
                            <button className="text-xs font-medium text-brand-primary-light hover:text-brand-primary transition-colors">
                                View All History
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <NotificationDetailModal
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onAcknowledge={handleAcknowledge}
            />
        </div>
    );
};


export default NotificationBell;
