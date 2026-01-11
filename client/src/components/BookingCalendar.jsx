import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getBookingsWithQuery } from '../api';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

// Helper to convert bookings to calendar events
const toEvent = (b) => ({
  id: b._id,
  title: b.equipment?.name ? `${b.equipment.name} — ${b.farmer?.name || ''}` : `${b.farmer?.name || 'Booking'}`,
  start: new Date(b.startDate),
  end: new Date(b.endDate),
  raw: b
});

const BookingCalendar = ({ equipmentId }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // 'day' | 'month' | 'year'(custom)
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null); // for yearly summary

  // Compute start/end for query based on current view & date
  const rangeForView = (view, date) => {
    const d = new Date(date);
    if (view === 'day') {
      const s = new Date(d.setHours(0, 0, 0, 0));
      const e = new Date(d.setHours(23, 59, 59, 999));
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (view === 'month') {
      const s = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    // year
    const s = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
    const e = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start: s.toISOString(), end: e.toISOString() };
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { start, end } = rangeForView(view, date);
      const params = { start, end };
      if (equipmentId) params.equipmentId = equipmentId;
      const res = await getBookingsWithQuery(params);
      const payload = res && res.data ? res.data : res;
      const items = (payload && payload.data) || [];
      setEvents(items.map(toEvent));

      if (view === 'year') {
        // Build monthly summary
        const months = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, count: 0, bookings: [] }));
        items.forEach(b => {
          const sd = new Date(b.startDate);
          const month = sd.getMonth();
          months[month].count += 1;
          months[month].bookings.push(b);
        });
        setSummary(months);
      } else {
        setSummary(null);
      }

    } catch (err) {
      console.error('Failed loading bookings for calendar', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [view, date, equipmentId]);

  // Expose simplified getBookings wrapper that calls server with query
  // But we used getBookings above (which doesn't support args). To avoid breaking, we will implement fetch directly if needed.

  const onRangeChange = (newRange) => {
    // when navigating calendar, update date
    if (Array.isArray(newRange)) {
      // month view gives array of dates, pick first
      setDate(newRange[0] || new Date());
    } else if (newRange.start) {
      setDate(newRange.start);
    }
  };

  return (
    <div className="dark-calendar-container">
      {/* Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-text-light font-display">My Bookings Calendar</h2>
            <p className="text-sm text-brand-text">Track and manage your equipment bookings</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-brand-surface-light/50 rounded-lg px-3 py-2">
            <label className="text-sm font-medium text-brand-text">View:</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="bg-brand-surface border border-brand-primary/30 rounded-lg px-3 py-1.5 text-sm text-brand-text-light focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 cursor-pointer"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <button
            onClick={() => fetchBookings()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-lg text-sm font-semibold hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {view !== 'year' ? (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={(d) => setDate(d)}
          onRangeChange={onRangeChange}
        />
      ) : (
        <div>
          <h3 className="font-semibold mb-2 text-brand-text-light">Yearly Summary ({new Date(date).getFullYear()})</h3>
          {loading ? <p className="text-brand-text">Loading...</p> : (
            <div className="grid grid-cols-3 gap-3">
              {summary && summary.map(m => (
                <div key={m.month} className="p-3 border border-brand-primary/20 rounded-lg bg-slate-800/50">
                  <div className="font-medium text-brand-text-light">{new Date(0, m.month - 1).toLocaleString('default', { month: 'long' })}</div>
                  <div className="text-sm text-brand-text">{m.count} bookings</div>
                  <ul className="text-xs mt-2 text-brand-text/80">
                    {m.bookings.slice(0, 5).map(b => <li key={b._id}>{b.equipment?.name || 'Booking'} — {new Date(b.startDate).toLocaleDateString()}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
