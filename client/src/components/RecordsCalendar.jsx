import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getBookingsWithQuery, getAssignedWorkForWorker } from '../api';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

// Helper to convert items to calendar events
const toEvent = (item, type) => {
  if (type === 'bookings') {
    return {
      id: item._id,
      title: item.equipment?.name ? `${item.equipment.name} — ${item.farmer?.name || ''}` : `${item.farmer?.name || 'Booking'}`,
      start: new Date(item.startDate),
      end: new Date(item.endDate),
      raw: item
    };
  }
  // For work-requests
  return {
    id: item._id,
    title: item.title || item.typeOfWork,
    start: new Date(item.startDate || item.createdAt),
    end: new Date(item.endDate || item.createdAt), // Default to createdAt if no date range
    raw: item
  };
};

const RecordsCalendar = ({ dataType = 'bookings', equipmentId }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // 'day' | 'month' | 'year'(custom)
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null); // for yearly summary

  // Compute start/end for query based on current view & date
  const rangeForView = (view, date) => {
    const d = new Date(date);
    if (view === 'day') {
      const s = new Date(d.setHours(0,0,0,0));
      const e = new Date(d.setHours(23,59,59,999));
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (view === 'month') {
      const s = new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
      const e = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    // year
    const s = new Date(d.getFullYear(), 0, 1, 0,0,0,0);
    const e = new Date(d.getFullYear(), 11, 31, 23,59,59,999);
    return { start: s.toISOString(), end: e.toISOString() };
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { start, end } = rangeForView(view, date);
      const params = { start, end };
      let items = [];
      if (dataType === 'bookings') {
        if (equipmentId) params.equipmentId = equipmentId;
        const res = await getBookingsWithQuery(params);
        const payload = res && res.data ? res.data : res;
        items = (payload && payload.data) || [];
      } else {
        const res = await getAssignedWorkForWorker(); // This fetches all assigned work, no date filter on backend yet
        const payload = res && res.data ? res.data : res;
        items = (payload && payload.data) || [];
      }
      setEvents(items.map(item => toEvent(item, dataType)));

      if (view === 'year') {
        // Build monthly summary
        const months = Array.from({ length: 12 }).map((_, i) => ({ month: i+1, count: 0, bookings: [] }));
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
      console.error(`Failed loading ${dataType} for calendar`, err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [view, date, equipmentId, dataType]);

  const onRangeChange = (newRange) => {
    if (Array.isArray(newRange)) {
      setDate(newRange[0] || new Date());
    } else if (newRange.start) {
      setDate(newRange.start);
    }
  };

  return (
    <div className="dark-calendar-container">
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium text-brand-text">View:</label>
        <select value={view} onChange={(e)=>setView(e.target.value)} className="border border-brand-primary/20 bg-slate-800/50 rounded px-2 py-1 text-sm text-brand-text-light">
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <button onClick={()=>fetchRecords()} className="ml-2 px-3 py-1 bg-brand-accent hover:bg-brand-accent-dark text-white rounded text-sm">Refresh</button>
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
          onNavigate={(d)=>setDate(d)}
          onRangeChange={onRangeChange}
        />
      ) : (
        <div>
          <h3 className="font-semibold mb-2 text-brand-text-light">Yearly Summary ({new Date(date).getFullYear()})</h3>
          {loading ? <p className="text-brand-text">Loading...</p> : (
            <div className="grid grid-cols-3 gap-3">
              {summary && summary.map(m => (
                <div key={m.month} className="p-3 border border-brand-primary/20 rounded-lg bg-slate-800/50">
                  <div className="font-medium text-brand-text-light">{new Date(0, m.month-1).toLocaleString('default', { month: 'long' })}</div>
                  <div className="text-sm text-brand-text">{m.count} records</div>
                  <ul className="text-xs mt-2 text-brand-text/80">
                    {m.bookings.slice(0,5).map(b => <li key={b._id}>{b.equipment?.name || b.title || 'Record'} — {new Date(b.startDate).toLocaleDateString()}</li>)}
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

export default RecordsCalendar;
