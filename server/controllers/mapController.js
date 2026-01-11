const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // per IP

// Simple in-memory rate limiter per IP
const clients = new Map();

const cleanClients = () => {
  const now = Date.now();
  for (const [ip, entry] of clients.entries()) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) clients.delete(ip);
  }
};

setInterval(cleanClients, RATE_LIMIT_WINDOW_MS).unref();

// Helper to enforce rate limit. Returns true if allowed.
const allowRequest = (ip) => {
  const now = Date.now();
  const entry = clients.get(ip);
  if (!entry) {
    clients.set(ip, { count: 1, start: now });
    return true;
  }
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    clients.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
};

// Proxy geocoding to Nominatim
exports.geocode = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'anon';
    if (!allowRequest(ip)) return res.status(429).json({ success: false, message: 'Rate limit exceeded' });

    const q = req.query.q;
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter q is required' });

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const r = await fetch(url, { headers: { 'User-Agent': 'FarmersApp/1.0 (contact@example.com)' } });
    if (!r.ok) return res.status(502).json({ success: false, message: 'Failed to geocode' });
    const data = await r.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Geocode proxy error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Proxy routing to OSRM public service
exports.route = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'anon';
    if (!allowRequest(ip)) return res.status(429).json({ success: false, message: 'Rate limit exceeded' });

    const start = req.query.start; // "lat,lon"
    const end = req.query.end;     // "lat,lon"
    if (!start || !end) return res.status(400).json({ success: false, message: 'start and end query parameters are required' });

    // parse
    const [sLat, sLon] = start.split(',').map(Number);
    const [eLat, eLon] = end.split(',').map(Number);
    if (![sLat, sLon, eLat, eLon].every(v => Number.isFinite(v))) return res.status(400).json({ success: false, message: 'Invalid coordinates' });

    const url = `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson&annotations=duration,distance`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ success: false, message: 'Failed to fetch route' });
    const data = await r.json();
    // Return route geometry, distance (meters) and duration (seconds)
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return res.status(200).json({ success: true, data: { geometry: route.geometry, distance: route.distance, duration: route.duration } });
    }
    return res.status(404).json({ success: false, message: 'No route found' });
  } catch (err) {
    console.error('Route proxy error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
