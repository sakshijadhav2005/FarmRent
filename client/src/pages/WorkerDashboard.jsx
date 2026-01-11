import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getWorkRequestsForWorker, respondToWorkRequest, getAssignedWorkForWorker } from '../api';
import { useAuth } from '../context/AuthContext';
import { User, List, CheckCircle, Settings, Check, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import RecordsCalendar from '../components/RecordsCalendar';

const WorkerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState([]);
  // Map / routing state
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapRoute, setMapRoute] = useState([]); // array of [lat, lng]
  const [mapStart, setMapStart] = useState(null);
  const [mapEnd, setMapEnd] = useState(null);
  const [mapTitle, setMapTitle] = useState('');
  const [mapDistance, setMapDistance] = useState(null); // meters
  const [mapDuration, setMapDuration] = useState(null); // seconds
  const [responding, setResponding] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // available, accepted, rejected
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD string
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getWorkRequestsForWorker();
      console.debug('WorkerDashboard: fetched', res?.data);
      const items = res?.data?.data || [];
      // The backend now filters correctly, so we can just split by status
      const pendingOnly = items.filter(i => i.status === 'pending');
      const rejectedOnly = items.filter(i => i.status === 'rejected');
      setRequests(pendingOnly);
      setRejected(rejectedOnly);
    } catch (err) {
      console.error('Error loading work requests:', err);
      setRequests([]);
      setRejected([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return;

    // enforce role-based access on client side
    if (!user || user.role !== 'worker') {
      navigate('/dashboard');
      return;
    }
    load();
    loadAssigned();
  }, [user, authLoading]);

  // Show loading state while confirming auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const respond = async (id, action) => {
    setResponding(id);
    try {
      await respondToWorkRequest(id, action);
      console.log(`Request ${id} ${action} successfully`);
      await load();
      await loadAssigned();
    } catch (err) {
      console.error('Error responding to request:', err);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setResponding(null);
    }
  };

  // Geocode a freeform address using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    try {
      const q = encodeURIComponent(address);
      const url = `/maps/geocode?q=${q}`;
      const res = await api.get(url);
      const payload = res.data;
      if (payload && payload.success && Array.isArray(payload.data) && payload.data.length > 0) {
        const d = payload.data[0];
        return { lat: parseFloat(d.lat), lon: parseFloat(d.lon) };
      }
      return null;
    } catch (err) {
      console.error('Geocoding failed (proxy)', err);
      return null;
    }
  };

  // Get route from OSRM between start and end (each: {lat, lon})
  const getRoute = async (start, end) => {
    try {
      const url = `/maps/route?start=${start.lat},${start.lon}&end=${end.lat},${end.lon}`;
      const res = await api.get(url);
      const payload = res.data;
      if (payload && payload.success && payload.data && payload.data.geometry) {
        const coords = payload.data.geometry.coordinates; // [[lon,lat],...]
        const route = coords.map(c => [c[1], c[0]]);
        // return route plus distance/duration
        return { route, distance: payload.data.distance, duration: payload.data.duration };
      }
      return null;
    } catch (err) {
      console.error('Routing failed (proxy)', err);
      return null;
    }
  };

  const viewRoute = async (request) => {
    if (!request || !request.location) {
      alert('No location available for this request');
      return;
    }

    setMapLoading(true);
    setMapTitle(request.title || request.typeOfWork || 'Route');

    // Get worker current position
    const getCurrentPosition = () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), err => reject(err), { enableHighAccuracy: true, timeout: 15000 });
    });

    try {
      const startCoords = await getCurrentPosition();
      const start = { lat: startCoords.latitude, lon: startCoords.longitude };

      // Geocode destination
      const dest = await geocodeAddress(request.location);
      if (!dest) {
        alert('Failed to geocode destination address.');
        setMapLoading(false);
        return;
      }

      const routeRes = await getRoute(start, dest);
      if (!routeRes) {
        alert('Failed to compute route.');
        setMapLoading(false);
        return;
      }

      setMapStart([start.lat, start.lon]);
      setMapEnd([dest.lat, dest.lon]);
      setMapRoute(routeRes.route);
      setMapDistance(routeRes.distance);
      setMapDuration(routeRes.duration);
      setMapOpen(true);
    } catch (err) {
      console.error('Failed to load route', err);
      alert('Failed to obtain current location. Please allow location access.');
    } finally {
      setMapLoading(false);
    }
  };

  const loadAssigned = async () => {
    try {
      const res = await getAssignedWorkForWorker();
      const items = res?.data?.data || [];
      // Backend now filters correctly, so we can just set the state
      setAssigned(items);
    } catch (err) {
      console.error('Failed loading assigned work:', err);
      setAssigned([]);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-brand-text-light">Dashboard Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
          <h3 className="text-brand-text text-sm font-medium">Pending Requests</h3>
          <p className="text-3xl font-bold mt-2 text-brand-primary-light">{requests.length}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-brand-accent/20 to-brand-accent/5">
          <h3 className="text-brand-text text-sm font-medium">Accepted Work</h3>
          <p className="text-3xl font-bold mt-2 text-brand-accent-light">{assigned.length}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/5">
          <h3 className="text-brand-text text-sm font-medium">Completed</h3>
          <p className="text-3xl font-bold mt-2 text-brand-secondary-light">0</p>
        </div>
      </div>

      {/* Tabs for requests */}
      <div className="mb-6 border-b border-brand-primary/20">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('available')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'available'
              ? 'border-brand-primary text-brand-primary-light'
              : 'border-transparent text-brand-text hover:text-brand-text-light hover:border-gray-500'
              }`}>
            Available Work
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'available' ? 'bg-brand-primary/20 text-brand-primary-light' : 'bg-slate-700 text-brand-text'
              }`}>{requests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'accepted'
              ? 'border-brand-accent text-brand-accent-light'
              : 'border-transparent text-brand-text hover:text-brand-text-light hover:border-gray-500'
              }`}>
            My Accepted Work
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'accepted' ? 'bg-brand-accent/20 text-brand-accent-light' : 'bg-slate-700 text-brand-text'
              }`}>{assigned.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected'
              ? 'border-brand-secondary text-brand-secondary-light'
              : 'border-transparent text-brand-text hover:text-brand-text-light hover:border-gray-500'
              }`}>
            Rejected
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${activeTab === 'rejected' ? 'bg-brand-secondary/20 text-brand-secondary-light' : 'bg-slate-700 text-brand-text'
              }`}>{rejected.length}</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6 mb-6">
        {loading ? <p className="text-brand-text">Loading...</p> : (
          <div>
            {activeTab === 'available' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-brand-text-light">Available Work Requests</h2>
                {requests.length === 0 ? (
                  <div className="py-12 text-center text-brand-text">No pending work requests</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <div key={r._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-brand-text-light">{r.title || r.typeOfWork}</h3>
                            <p className="text-sm text-brand-text">{r.typeOfWork} • ₹{r.paymentAmount} • {r.requiredCount} needed</p>
                            <p className="text-sm text-brand-text">Location: {r.location}</p>
                            <p className="text-sm text-brand-text mt-2">Posted by: {r.owner?.name}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => respond(r._id, 'accept')}
                              disabled={responding === r._id}
                              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-md transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              {responding === r._id ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => respond(r._id, 'reject')}
                              disabled={responding === r._id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              {responding === r._id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                              onClick={() => viewRoute(r)}
                              className="px-3 py-2 bg-brand-accent hover:bg-brand-accent-dark text-white rounded-md transition text-sm font-medium flex items-center gap-2"
                            >
                              View Route
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-brand-text-light">My Accepted Work</h2>
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-filter-accepted" className="text-sm font-medium text-brand-text">Filter by date:</label>
                    <input
                      type="date"
                      id="date-filter-accepted"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="border border-brand-primary/20 bg-slate-800/50 rounded px-2 py-1 text-sm text-brand-text-light"
                    />
                    <button onClick={() => setFilterDate('')} className="px-3 py-1 bg-slate-700 text-sm rounded text-brand-text">Clear</button>
                  </div>
                </div>

                {(() => {
                  const filtered = assigned.filter(r =>
                    !filterDate || new Date(r.startDate || r.createdAt).toISOString().slice(0, 10) === filterDate
                  );
                  return filtered.length === 0 ? (
                    <div className="py-12 text-center text-brand-text">{filterDate ? 'No accepted work on this date' : 'No assigned work yet'}</div>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((r) => (
                        <div key={r._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-brand-text-light">{r.title || r.typeOfWork}</h3>
                              <p className="text-sm text-brand-text">{r.typeOfWork} • ₹{r.paymentAmount} • {r.requiredCount} needed</p>
                              <p className="text-sm text-brand-text">Location: {r.location}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-semibold text-brand-primary-light">ACCEPTED</p>
                              <button
                                onClick={() => respond(r._id, 'complete')}
                                disabled={responding === r._id}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow-lg shadow-green-900/20 transition-all flex items-center gap-1"
                              >
                                {responding === r._id ? 'Updating...' : '✓ Work Done'}
                              </button>
                              {r.location && (
                                <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(r.location)}`} className="block text-sm text-brand-accent-light hover:underline">View on map</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-brand-text-light">Rejected Requests</h2>
                  <div className="flex items-center gap-2">
                    <label htmlFor="date-filter-rejected" className="text-sm font-medium text-brand-text">Filter by date:</label>
                    <input
                      type="date"
                      id="date-filter-rejected"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="border border-brand-primary/20 bg-slate-800/50 rounded px-2 py-1 text-sm text-brand-text-light"
                    />
                    <button onClick={() => setFilterDate('')} className="px-3 py-1 bg-slate-700 text-sm rounded text-brand-text">Clear</button>
                  </div>
                </div>

                {(() => {
                  const filtered = rejected.filter(r =>
                    !filterDate || new Date(r.respondedAt || r.createdAt).toISOString().slice(0, 10) === filterDate
                  );
                  return filtered.length === 0 ? (
                    <div className="py-12 text-center text-brand-text">{filterDate ? 'No rejected requests on this date' : 'No rejected requests'}</div>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((r) => (
                        <div key={r._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-brand-text-light">{r.title || r.typeOfWork}</h3>
                              <p className="text-sm text-brand-text">{r.typeOfWork} • ₹{r.paymentAmount} • {r.requiredCount} needed</p>
                              <p className="text-sm text-brand-text">Location: {r.location}</p>
                              <p className="text-sm text-brand-text mt-2">Posted by: {r.owner?.name}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                                <X className="h-3 w-3" />
                                Rejected
                              </span>
                              <div className="mt-2">
                                <button onClick={() => viewRoute(r)} className="px-3 py-2 bg-brand-accent hover:bg-brand-accent-dark text-white rounded-md text-sm">View Route</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar for assigned work */}
      <div className="glass-card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4 text-brand-text-light">My Work Calendar</h2>
        <RecordsCalendar dataType="work-requests" />
      </div>

      {/* Map Modal / Overlay */}
      {mapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card w-[90%] md:w-3/4 h-[80%] rounded-lg shadow-lg overflow-hidden border border-white/20">
            <div className="flex items-center justify-between p-3 border-b border-brand-primary/20">
              <div>
                <div className="font-semibold text-brand-text-light">{mapTitle}</div>
                {mapDistance != null && mapDuration != null && (
                  <div className="text-sm text-brand-text">{(mapDistance / 1000).toFixed(1)} km • {Math.round(mapDuration / 60)} min</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {mapLoading && <div className="text-sm text-brand-text">Loading...</div>}
                <button onClick={() => setMapOpen(false)} className="px-3 py-1 bg-slate-700 text-brand-text rounded">Close</button>
              </div>
            </div>
            <div className="h-full">
              <MapContainer center={mapStart || (mapRoute[0] || [0, 0])} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapRoute && mapRoute.length > 0 && (
                  <Polyline positions={mapRoute} color="blue" weight={4} />
                )}
                {mapStart && (
                  <CircleMarker center={mapStart} radius={6} pathOptions={{ color: 'green' }}>
                    <Popup>Start location (your current location)</Popup>
                  </CircleMarker>
                )}
                {mapEnd && (
                  <CircleMarker center={mapEnd} radius={6} pathOptions={{ color: 'red' }}>
                    <Popup>Destination</Popup>
                  </CircleMarker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;

