import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Check, X, Loader2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:5001/api';

/**
 * Equipment Availability Calendar
 * Visual calendar showing when equipment is available or booked
 */
const AvailabilityCalendar = ({
    equipmentId,
    onDateSelect,
    selectedDates = { start: null, end: null },
    readOnly = false
}) => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState(null);

    const months = [
        t('calendar.january', 'January'), t('calendar.february', 'February'),
        t('calendar.march', 'March'), t('calendar.april', 'April'),
        t('calendar.may', 'May'), t('calendar.june', 'June'),
        t('calendar.july', 'July'), t('calendar.august', 'August'),
        t('calendar.september', 'September'), t('calendar.october', 'October'),
        t('calendar.november', 'November'), t('calendar.december', 'December')
    ];

    const weekDays = [
        t('calendar.sun', 'Sun'), t('calendar.mon', 'Mon'),
        t('calendar.tue', 'Tue'), t('calendar.wed', 'Wed'),
        t('calendar.thu', 'Thu'), t('calendar.fri', 'Fri'),
        t('calendar.sat', 'Sat')
    ];

    // Fetch bookings for the equipment
    useEffect(() => {
        const fetchBookings = async () => {
            if (!equipmentId) return;

            setLoading(true);
            try {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

                const response = await fetch(
                    `${API_BASE}/bookings?equipmentId=${equipmentId}&start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                const data = await response.json();
                if (data.success) {
                    setBookings(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [equipmentId, currentMonth]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days = [];

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month padding
        const endPadding = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= endPadding; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    }, [currentMonth]);

    // Check if a date is booked
    const isDateBooked = (date) => {
        const dateStr = date.toDateString();
        return bookings.some(booking => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const current = new Date(date);
            current.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return current >= start && current <= end;
        });
    };

    // Check if date is in past
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    // Check if date is selected
    const isDateSelected = (date) => {
        if (!selectedDates.start) return false;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const start = new Date(selectedDates.start);
        start.setHours(0, 0, 0, 0);

        if (!selectedDates.end) {
            return checkDate.getTime() === start.getTime();
        }

        const end = new Date(selectedDates.end);
        end.setHours(0, 0, 0, 0);

        return checkDate >= start && checkDate <= end;
    };

    // Check if date is in hover range
    const isInHoverRange = (date) => {
        if (!selectedDates.start || selectedDates.end || !hoveredDate) return false;

        const checkDate = new Date(date);
        const start = new Date(selectedDates.start);
        const hover = new Date(hoveredDate);

        checkDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        hover.setHours(0, 0, 0, 0);

        if (hover >= start) {
            return checkDate >= start && checkDate <= hover;
        } else {
            return checkDate <= start && checkDate >= hover;
        }
    };

    // Handle date click
    const handleDateClick = (date) => {
        if (readOnly || isPastDate(date) || isDateBooked(date)) return;

        if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
            // Start new selection
            onDateSelect && onDateSelect({ start: date, end: null });
        } else {
            // Complete selection
            const start = new Date(selectedDates.start);
            if (date >= start) {
                // Check if any date in range is booked
                const hasBookedDates = checkRangeForBookings(start, date);
                if (!hasBookedDates) {
                    onDateSelect && onDateSelect({ start: selectedDates.start, end: date });
                }
            } else {
                // Reset if selecting before start
                onDateSelect && onDateSelect({ start: date, end: null });
            }
        }
    };

    // Check if any date in range is booked
    const checkRangeForBookings = (start, end) => {
        const current = new Date(start);
        while (current <= end) {
            if (isDateBooked(current)) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    };

    // Navigate months
    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    // Get booking info for tooltip
    const getBookingInfo = (date) => {
        const booking = bookings.find(b => {
            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            const current = new Date(date);
            current.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return current >= start && current <= end;
        });
        return booking;
    };

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-text-light">
                                {t('calendar.availability', 'Availability Calendar')}
                            </h3>
                            <p className="text-xs text-brand-text-muted">
                                {t('calendar.selectDates', 'Select your booking dates')}
                            </p>
                        </div>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />}
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <button
                    onClick={goToPrevMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-brand-text-light" />
                </button>

                <div className="flex items-center gap-4">
                    <h4 className="text-lg font-bold text-brand-text-light">
                        {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h4>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-xs bg-brand-primary/20 text-brand-primary rounded-full hover:bg-brand-primary/30 transition-colors"
                    >
                        {t('calendar.today', 'Today')}
                    </button>
                </div>

                <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-brand-text-light" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Week day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-brand-text-muted py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        const isBooked = isDateBooked(day.date);
                        const isPast = isPastDate(day.date);
                        const isSelected = isDateSelected(day.date);
                        const isHovered = isInHoverRange(day.date);
                        const isToday = day.date.toDateString() === new Date().toDateString();
                        const booking = isBooked ? getBookingInfo(day.date) : null;

                        return (
                            <div
                                key={index}
                                onClick={() => handleDateClick(day.date)}
                                onMouseEnter={() => setHoveredDate(day.date)}
                                onMouseLeave={() => setHoveredDate(null)}
                                className={`
                                    relative aspect-square p-1 rounded-lg text-center transition-all cursor-pointer
                                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                                    ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                                    ${isBooked ? 'bg-red-500/20 cursor-not-allowed' : ''}
                                    ${isSelected ? 'bg-brand-primary text-white' : ''}
                                    ${isHovered && !isSelected ? 'bg-brand-primary/30' : ''}
                                    ${!isBooked && !isPast && !isSelected && !isHovered ? 'hover:bg-white/10' : ''}
                                    ${isToday && !isSelected ? 'ring-2 ring-brand-primary' : ''}
                                `}
                                title={isBooked ? `Booked: ${booking?.farmer?.name || 'Reserved'}` : ''}
                            >
                                <span className={`
                                    text-sm font-medium
                                    ${isSelected ? 'text-white' : 'text-brand-text-light'}
                                    ${isBooked ? 'text-red-400' : ''}
                                `}>
                                    {day.date.getDate()}
                                </span>

                                {/* Status indicator */}
                                {day.isCurrentMonth && !isPast && (
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                                        {isBooked ? (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        ) : isSelected ? (
                                            <Check className="w-3 h-3 text-white" />
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="px-4 pb-4">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                        <span className="text-brand-text-muted">{t('calendar.selected', 'Selected')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-brand-text-muted">{t('calendar.booked', 'Booked')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-brand-text-muted">{t('calendar.available', 'Available')}</span>
                    </div>
                </div>
            </div>

            {/* Selected Range Display */}
            {selectedDates.start && (
                <div className="p-4 border-t border-white/10 bg-brand-primary/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-brand-text-muted mb-1">
                                {t('calendar.selectedPeriod', 'Selected Period')}
                            </p>
                            <p className="text-brand-text-light font-medium">
                                {new Date(selectedDates.start).toLocaleDateString()}
                                {selectedDates.end && ` → ${new Date(selectedDates.end).toLocaleDateString()}`}
                            </p>
                        </div>
                        {selectedDates.end && (
                            <div className="text-right">
                                <p className="text-xs text-brand-text-muted mb-1">
                                    {t('calendar.totalDays', 'Total Days')}
                                </p>
                                <p className="text-xl font-bold text-brand-primary">
                                    {Math.ceil((new Date(selectedDates.end) - new Date(selectedDates.start)) / (1000 * 60 * 60 * 24)) + 1}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendar;
