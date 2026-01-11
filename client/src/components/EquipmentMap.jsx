import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EquipmentMap = ({ equipment }) => {
    // Default center (India)
    const position = [20.5937, 78.9629];

    return (
        <MapContainer
            center={position}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: '400px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {equipment.map((item) => (
                item.coordinates && (
                    <Marker key={item._id} position={[item.coordinates.lat, item.coordinates.lng]}>
                        <Popup>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.type}</div>
                            <div className="text-sm font-bold mt-1">₹{item.pricePerHour || item.price}/hr</div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
};

export default EquipmentMap;
