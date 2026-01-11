import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBookings, updateBooking, deleteBooking, getEquipmentById } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const Bookings = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  // Default to current month YYYY-MM
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await getBookings();
        if (res.data && res.data.success) {
          setBookings(res.data.data || []);
        } else {
          setError('Failed to load bookings');
        }
      } catch (err) {
        console.error(err);
        setError('Something went wrong while loading bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, authLoading, navigate]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      const res = await updateBooking(bookingId, { status });
      if (res.data && res.data.success) {
        setBookings((prev) => prev.map(b => b._id === bookingId ? res.data.data : b));
      }
    } catch (err) {
      console.error('Failed to update booking', err);
      alert('Failed to update booking');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Delete this booking?')) return;
    try {
      // get booking and equipment details before deleting
      const bookingToDelete = bookings.find(b => b._id === bookingId);
      const equipmentId = bookingToDelete?.equipment?._id || bookingToDelete?.equipment;

      const res = await deleteBooking(bookingId);
      if (res.data && res.data.success) {
        setBookings((prev) => prev.filter(b => b._id !== bookingId));

        // Fetch updated equipment to get new availability status
        try {
          const equipRes = await getEquipmentById(equipmentId);
          if (equipRes.data && equipRes.data.data) {
            const updatedEquipment = equipRes.data.data;
            // Emit event with updated equipment data so Dashboard can refresh instantly
            const availabilityStatus = updatedEquipment.available ? 'now available' : 'still booked';
            window.dispatchEvent(new CustomEvent('bookingDeleted', {
              detail: {
                equipmentId,
                equipment: updatedEquipment,
                message: `Equipment "${updatedEquipment.name}" is ${availabilityStatus}`
              }
            }));
            setToast({ message: `Booking deleted! Equipment is now available.`, type: 'success' });
          }
        } catch (err) {
          console.error('Failed to fetch updated equipment', err);
          setToast({ message: 'Booking deleted!', type: 'success' });
        }
      }
    } catch (err) {
      console.error('Failed to delete booking', err);
      setToast({ message: 'Failed to delete booking', type: 'error' });
    }
  };

  if (authLoading || loading) return <div className="text-center py-8 text-brand-text">{t('common.loading')}</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-brand-text-light">{t('nav.bookings')}</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-brand-primary/10">
            <label htmlFor="date-filter-bookings" className="text-sm font-medium text-brand-text whitespace-nowrap pl-2">{t('booking.filterByDate')}:</label>
            <input
              type="month"
              id="date-filter-bookings"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm text-brand-text-light custom-date-input"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="bg-slate-700 hover:bg-slate-600 rounded-full p-1 text-brand-text">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <span className="text-sm font-medium text-brand-text hidden sm:inline">{t('booking.status')}:</span>
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'all' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25' : 'bg-slate-800 text-brand-text hover:bg-slate-700 border border-slate-700'}`}>{t('common.all')}</button>
              <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'pending' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25' : 'bg-slate-800 text-brand-text hover:bg-slate-700 border border-slate-700'}`}>{t('booking.pending')}</button>
              <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'completed' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' : 'bg-slate-800 text-brand-text hover:bg-slate-700 border border-slate-700'}`}>{t('booking.completed')}</button>
            </div>
          </div>
        </div>
      </div>

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

      {(() => {
        const filteredBookings = bookings.filter(b => {
          // Filter by Month
          const date = new Date(b.startDate);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
          const dateMatch = !filterDate || monthStr === filterDate;

          // Filter by Status
          let statusMatch = true;
          if (filterStatus !== 'all') {
            if (filterStatus === 'completed') {
              // Include both 'completed' and 'confirmed' in this view? User has "Completed" button.
              // Usually completed means history. Confirmed means active.
              // Let's stick to strict status match unless user wants grouping.
              statusMatch = b.status === 'completed';
            } else {
              statusMatch = b.status === filterStatus;
            }
          }
          return dateMatch && statusMatch;
        });

        return filteredBookings.length === 0 ? (
          <p className="text-brand-text">{t('booking.noBookings')}</p>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((b) => (
              <div key={b._id} className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between p-6 gap-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-brand-text-light">{b.equipment?.name} {b.equipment?.model ? `• ${b.equipment.model}` : ''}</h2>
                    <p className="text-sm text-brand-text mt-1">Type: <span className="font-medium text-brand-text-light">{b.equipment?.type}</span> • Location: <span className="font-medium text-brand-text-light">{b.equipment?.location}</span></p>

                    <div className="mt-4 space-y-2 text-sm text-brand-text">
                      <p><strong className="text-brand-text-light">{t('auth.farmer')}:</strong> <span className="font-medium text-brand-text-light">{b.farmer?.name}</span> • <span className="text-brand-text">{b.farmer?.mobile}</span></p>
                      <p><strong className="text-brand-text-light">{t('booking.period')}:</strong> <span className="font-medium text-brand-text-light">{new Date(b.startDate).toLocaleDateString()}</span> → <span className="font-medium text-brand-text-light">{new Date(b.endDate).toLocaleDateString()}</span></p>
                      <p><strong className="text-brand-text-light">{t('booking.totalAmount')}:</strong> <span className="text-lg font-bold text-brand-secondary-light">₹{b.totalPrice}</span></p>
                      <p><strong className="text-brand-text-light">{t('booking.status')}:</strong> <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' : b.status === 'completed' ? 'bg-brand-primary/20 text-brand-primary-light' : 'bg-red-500/20 text-red-300'}`}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0 md:w-32">
                    {/* Owner actions - Small & Attractive */}
                    {user.role === 'owner' && (
                      <div className="w-full grid gap-2">
                        {b.status === 'pending' && (
                          <button onClick={() => handleStatusChange(b._id, 'confirmed')}
                            className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 hover:border-brand-primary text-xs font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 w-full">
                            ✓ {t('booking.confirm')}
                          </button>
                        )}

                        {b.status !== 'completed' && (
                          <button onClick={() => handleStatusChange(b._id, 'completed')}
                            className="bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border border-brand-accent/20 hover:border-brand-accent text-xs font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 w-full">
                            ★ {t('booking.completed')}
                          </button>
                        )}

                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button onClick={() => handleStatusChange(b._id, 'cancelled')}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 w-full">
                            × {t('common.cancel')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Farmer actions (delete) - Only allowed if completed or cancelled */}
                    {user.role === 'farmer' && (b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected') && (
                      <button onClick={() => handleDelete(b._id)}
                        className="bg-slate-700/50 hover:bg-slate-700 text-brand-text-muted hover:text-white border border-slate-600/50 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 w-full md:w-auto">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {t('common.delete')}
                      </button>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  );
};

export default Bookings;
