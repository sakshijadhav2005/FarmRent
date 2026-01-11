import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, CheckCircle, Shield, Cloud, AlertTriangle } from "lucide-react";
import { getEquipmentById, createBooking, updateBooking, searchWorkers, getImageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import StripePaymentModal from "../components/StripePaymentModal";
import WeatherWidget from "../components/WeatherWidget";
import WishlistButton from "../components/WishlistButton";

// Helper: calculate days between two dates (inclusive)
function daysBetween(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const msPerDay = 1000 * 60 * 60 * 24;
    if (e < s) return 0;
    const diff = Math.floor((e - s) / msPerDay) + 1; // inclusive
    return diff;
}

async function mockPayment() {
    // Simulate payment delay
    return new Promise((res) => setTimeout(() => res(true), 1000));
}

const EquipmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user } = useAuth();

    // Booking state (for farmers)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState(null);
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [bookingTotal, setBookingTotal] = useState(0);
    const [driverRequested, setDriverRequested] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showDriverList, setShowDriverList] = useState(false);
    const [farmAddress, setFarmAddress] = useState(""); // Farmer's address for weather lookup

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await getEquipmentById(id);
                const data = res.data;
                if (data && data.success) {
                    setEquipment(data.data);
                } else {
                    setError("Equipment not found");
                }
            } catch (err) {
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, [id]);

    // Confirm modal confirm handler
    const onConfirmBooking = async () => {
        setShowConfirm(false);
        if (!pendingPaymentMethod || !equipment) return;

        if (!startDate || !endDate) {
            setBookingMessage('Please select start and end dates');
            return;
        }
        const days = daysBetween(startDate, endDate);
        if (days <= 0) {
            setBookingMessage('End date must be after start date');
            return;
        }

        const pricePerHour = equipment.pricePerHour || equipment.price || 0;
        const hours = days * 24;

        let driverRate = 0;
        if (driverRequested) {
            // Use specific driver's rate if selected and available, otherwise standard rate (e.g. 300)
            // If the selected driver has no hourlyRate set, default to 300
            if (selectedDriver) {
                driverRate = selectedDriver.hourlyRate || 300;
            } else {
                driverRate = 300;
            }
        }
        const driverTotal = driverRate * hours;
        const equipmentTotal = hours * pricePerHour;
        const totalPrice = equipmentTotal + driverTotal;

        setBookingLoading(true);
        setBookingMessage('Processing booking...');

        try {
            // Create booking (status will be pending)
            const payload = {
                equipment: equipment._id,
                startDate,
                endDate,
                totalPrice,
                paymentMethod: pendingPaymentMethod,
                driverRequested,
                driver: selectedDriver ? selectedDriver._id : null,
                driverFee: driverTotal // We might want to send this explicitly if backend adds it, but mostly purely for record
            };

            const res = await createBooking(payload);
            const bookingData = res.data ? res.data.data : res.data;

            if (!bookingData) {
                setBookingMessage('Failed to create booking');
                setPendingPaymentMethod(null);
                setBookingLoading(false);
                return;
            }

            // Handle payment based on method
            if (pendingPaymentMethod === 'payNow') {
                // For online payment, show Stripe modal
                setCurrentBooking(bookingData);
                setBookingTotal(totalPrice);
                setShowStripeModal(true);
                setBookingLoading(false);
            } else if (pendingPaymentMethod === 'cod') {
                // For COD, just confirm the booking
                try {
                    await updateBooking(bookingData._id, {
                        status: 'confirmed',
                        paymentMethod: 'cod'
                    });
                    setBookingMessage('Booking confirmed! You will pay on delivery.');
                    setTimeout(() => navigate('/bookings'), 1500);
                } catch (err) {
                    console.error('Failed confirming COD booking', err);
                    setBookingMessage('Booking created. You will pay on delivery.');
                    setTimeout(() => navigate('/bookings'), 1500);
                }
                setBookingLoading(false);
            }
        } catch (err) {
            console.error('Booking error', err);
            setBookingMessage('Booking failed, try again');
            setBookingLoading(false);
        }
        setPendingPaymentMethod(null);
    };

    const onCloseConfirm = () => {
        setShowConfirm(false);
        setPendingPaymentMethod(null);
    };

    if (loading)
        return <div className="text-center py-10 text-lg font-semibold text-brand-text">Loading...</div>;

    if (error)
        return <div className="text-center py-10 text-red-400 text-lg">{error}</div>;

    return (
        <>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* LEFT SIDE - Image, Description, Features, Weather (3 columns) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Equipment Image */}
                        <div className="relative">
                            <img
                                src={getImageUrl(equipment.image)}
                                alt={equipment.name}
                                className="w-full h-80 md:h-96 object-cover rounded-2xl shadow-2xl"
                            />
                            {/* Availability Badge */}
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${equipment.available !== false ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                {equipment.available !== false ? '✓ Available' : '✗ Booked'}
                            </div>

                            {/* Wishlist Button */}
                            <WishlistButton
                                equipmentId={equipment._id}
                                size="lg"
                                className="absolute top-4 right-36 bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-black/60 shadow-lg text-white"
                            />

                            {/* Type Badge */}
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold bg-brand-primary/90 text-white">
                                {equipment.type}
                            </div>
                        </div>

                        {/* Thumbnail images */}
                        {equipment.images?.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {equipment.images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt="Thumbnail"
                                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 border-2 border-transparent hover:border-brand-primary"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Equipment Details Card */}
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-brand-text-light mb-4">About this Equipment</h2>

                            {/* Quick Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-brand-text-muted text-xs">Model</p>
                                    <p className="text-brand-text-light font-semibold">{equipment.model || 'N/A'}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-brand-text-muted text-xs">Year</p>
                                    <p className="text-brand-text-light font-semibold">{equipment.year || 'N/A'}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-brand-text-muted text-xs">Rating</p>
                                    <p className="text-brand-primary-light font-semibold flex items-center justify-center gap-1">
                                        <Star className="w-4 h-4 fill-current" />
                                        {equipment.rating || 4.5}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-brand-text-muted text-xs">Location</p>
                                    <p className="text-brand-text-light font-semibold flex items-center justify-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {equipment.location}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-2 text-brand-text-light">Description</h3>
                                <p className="text-brand-text leading-relaxed">
                                    {equipment.description}
                                </p>
                            </div>

                            {/* Features */}
                            {equipment.features?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold mb-3 text-brand-text-light">Features</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {equipment.features.map((feature, index) => (
                                            <div key={index} className="flex items-center text-brand-text">
                                                <CheckCircle className="h-5 w-5 text-brand-primary mr-2" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weather Widget Section - Only for farmers */}
                        {user?.role === 'farmer' && equipment?.owner?._id !== user._id && (
                            <div className="glass-card rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-4 text-brand-text-light flex items-center gap-2">
                                    <Cloud className="w-5 h-5 text-brand-accent" />
                                    Weather-Smart Booking
                                </h3>

                                {/* Farm Address Input */}
                                <div className="mb-4">
                                    <label className="block text-sm mb-2 text-brand-text font-medium">📍 Enter Your Farm Location</label>
                                    <input
                                        type="text"
                                        value={farmAddress}
                                        onChange={(e) => setFarmAddress(e.target.value)}
                                        placeholder="Enter your city/town (e.g., Pune, Mumbai, Nashik)"
                                        className="w-full border border-brand-primary/20 bg-slate-800/50 rounded-lg px-4 py-3 text-brand-text-light placeholder:text-brand-text-muted/50"
                                    />
                                    <p className="text-xs text-brand-text-muted mt-1">Check weather forecast for your location to plan your booking</p>
                                </div>

                                {/* Weather Widget */}
                                {farmAddress && farmAddress.length >= 3 && (
                                    <WeatherWidget
                                        location={farmAddress}
                                        onDateSelect={(date) => {
                                            const dateStr = date.toISOString().split('T')[0];
                                            if (!startDate) {
                                                setStartDate(dateStr);
                                            } else if (!endDate || new Date(dateStr) > new Date(startDate)) {
                                                setEndDate(dateStr);
                                            } else {
                                                setStartDate(dateStr);
                                                setEndDate('');
                                            }
                                        }}
                                        selectedDate={startDate || endDate}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - Pricing, Owner, Booking Form (2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pricing Card */}
                        <div className="glass-card rounded-2xl p-6 sticky top-4">
                            {/* Equipment Name & Price */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-brand-text-light mb-2">{equipment.name}</h1>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-brand-secondary-light">₹{equipment.pricePerHour || equipment.price}</span>
                                    <span className="text-brand-text">/hour</span>
                                </div>
                            </div>

                            {/* Owner Section */}
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-brand-primary/20 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-brand-primary/20 rounded-full flex items-center justify-center font-bold text-xl text-brand-primary-light">
                                            {equipment.owner?.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-brand-text-light">{equipment.owner?.name}</p>
                                            <p className="text-sm text-brand-text">Equipment Owner</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-brand-primary-light flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-current" />
                                            {equipment.owner?.rating || 4.8}
                                        </p>
                                        <div className="flex items-center text-xs text-brand-text">
                                            <Shield className="h-3 w-3 mr-1 text-green-400" />
                                            Verified
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Form - Only for farmers */}
                            {user?.role === 'farmer' && equipment?.owner?._id !== user._id && (
                                <div>
                                    <h3 className="text-lg font-bold mb-4 text-brand-text-light">📅 Book Now</h3>

                                    {bookingMessage && <div className="mb-4 p-3 bg-brand-primary/20 text-brand-primary-light rounded-lg text-sm">{bookingMessage}</div>}

                                    {/* Date Selection */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="block text-sm mb-1 text-brand-text">Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full border border-brand-primary/20 bg-slate-800/50 rounded-lg px-3 py-2 text-brand-text-light"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1 text-brand-text">End Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full border border-brand-primary/20 bg-slate-800/50 rounded-lg px-3 py-2 text-brand-text-light"
                                            />
                                        </div>
                                    </div>

                                    {/* Price Estimate */}
                                    {startDate && endDate && (
                                        <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-lg p-3 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-brand-text text-sm">Estimated Total</span>
                                                <span className="text-xl font-bold text-brand-secondary-light">
                                                    ₹{((daysBetween(startDate, endDate) * 24) * (equipment.pricePerHour || equipment.price)).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-brand-text-muted mt-1">
                                                {daysBetween(startDate, endDate)} days × 24 hrs × ₹{equipment.pricePerHour || equipment.price}/hr
                                            </p>
                                        </div>
                                    )}

                                    {/* Driver Request */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-brand-primary/10 mb-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="driverReq"
                                                checked={driverRequested}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setDriverRequested(checked);
                                                    if (!checked) {
                                                        setSelectedDriver(null);
                                                        setShowDriverList(false);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-brand-primary/20 text-brand-primary focus:ring-brand-primary"
                                            />
                                            <label htmlFor="driverReq" className="text-brand-text text-sm cursor-pointer select-none flex items-center gap-2 font-medium">
                                                <span className="text-xl">🚜</span> I need a Driver
                                            </label>
                                        </div>

                                        {driverRequested && (
                                            <div className="mt-3 pl-6">
                                                {!selectedDriver ? (
                                                    <div className="text-sm">
                                                        <p className="text-brand-text mb-2">We will find available drivers for you.</p>
                                                        <button
                                                            onClick={async () => {
                                                                if (!showDriverList && drivers.length === 0) {
                                                                    setLoadingDrivers(true);
                                                                    try {
                                                                        const res = await searchWorkers('', 'driver');
                                                                        if (res.data?.success) setDrivers(res.data.data);
                                                                    } catch (err) { console.error(err); }
                                                                    finally { setLoadingDrivers(false); }
                                                                }
                                                                setShowDriverList(!showDriverList);
                                                            }}
                                                            className="text-brand-accent hover:text-brand-accent-light underline text-xs"
                                                        >
                                                            {showDriverList ? 'Hide drivers' : 'Select a specific driver'}
                                                        </button>

                                                        {showDriverList && (
                                                            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                                                {loadingDrivers && <div className="text-xs text-brand-text">Loading...</div>}
                                                                {!loadingDrivers && drivers.length === 0 && <div className="text-xs text-brand-text">No drivers available.</div>}
                                                                {drivers.map(d => (
                                                                    <div key={d._id} onClick={() => setSelectedDriver(d)} className="flex items-center justify-between p-2 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700 border border-transparent hover:border-brand-accent/50 group">
                                                                        <div>
                                                                            <p className="text-brand-text-light text-xs font-bold">{d.name}</p>
                                                                            <p className="text-brand-accent-light text-[10px]">₹{d.hourlyRate || 300}/hr</p>
                                                                        </div>
                                                                        <div className="text-xs text-brand-accent opacity-0 group-hover:opacity-100">Select</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-2 bg-brand-accent/10 border border-brand-accent/30 rounded">
                                                        <div>
                                                            <p className="text-sm font-bold text-brand-text-light">{selectedDriver.name}</p>
                                                            <p className="text-xs text-brand-accent-light">₹{selectedDriver.hourlyRate || 300}/hr</p>
                                                        </div>
                                                        <button onClick={() => setSelectedDriver(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            disabled={bookingLoading || !startDate || !endDate}
                                            onClick={() => { setPendingPaymentMethod('payNow'); setShowConfirm(true); }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-brand-accent to-brand-accent-dark hover:from-brand-accent-dark hover:to-brand-accent text-white rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-brand-accent/30 transition-all"
                                        >
                                            💳 Pay Now (Online)
                                        </button>
                                        <button
                                            disabled={bookingLoading || !startDate || !endDate}
                                            onClick={() => { setPendingPaymentMethod('cod'); setShowConfirm(true); }}
                                            className="w-full px-4 py-3 border-2 border-slate-600 rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 text-brand-text transition-all"
                                        >
                                            🏦 Pay on Delivery
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Contact Owner Button */}
                            <button className="w-full mt-4 px-4 py-3 border border-slate-600 rounded-xl font-bold hover:bg-slate-700 transition text-brand-text flex items-center justify-center gap-2">
                                📞 Contact Owner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <ConfirmModal
                    open={showConfirm}
                    onClose={onCloseConfirm}
                    onConfirm={onConfirmBooking}
                    equipment={equipment}
                    startDate={startDate}
                    endDate={endDate}
                    paymentMethod={pendingPaymentMethod}
                    driverRequested={driverRequested}
                    selectedDriver={selectedDriver}
                />
            )}
            {showStripeModal && currentBooking && (
                <StripePaymentModal
                    open={showStripeModal}
                    onClose={() => {
                        setShowStripeModal(false);
                        navigate('/bookings');
                    }}
                    booking={currentBooking}
                    amount={bookingTotal}
                    onPaymentSuccess={() => {
                        setBookingMessage('Payment successful! Booking confirmed.');
                        setTimeout(() => navigate('/bookings'), 1000);
                    }}
                />
            )}
        </>
    );
};

// (Modal is rendered directly inside the component when needed)

// --- Confirmation Modal markup injected into component scope ---
function ConfirmModal({ open, onClose, onConfirm, equipment, startDate, endDate, paymentMethod, driverRequested, selectedDriver }) {
    if (!open) return null;

    const days = daysBetween(startDate, endDate);
    const pricePerHour = equipment.pricePerHour || equipment.price || 0;
    const hours = days * 24;

    // Recalculate breakdown for modal display
    let driverRate = 0;
    if (driverRequested) {
        driverRate = selectedDriver ? (selectedDriver.hourlyRate || 300) : 300;
    }
    const driverTotal = driverRate * hours;
    const equipmentTotal = hours * pricePerHour;
    const totalPrice = equipmentTotal + driverTotal;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md md:max-w-lg border border-brand-primary/20 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-lg font-bold mb-4 text-brand-text-light">Confirm Your Booking</h3>

                <div className="bg-slate-800/50 p-4 rounded-lg mb-4 space-y-2 border border-brand-primary/10">
                    <div className="flex justify-between">
                        <span className="text-sm text-brand-text">Equipment:</span>
                        <span className="font-semibold text-brand-text-light">{equipment.name} {equipment.model ? `(${equipment.model})` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-brand-text">Duration:</span>
                        <span className="font-semibold text-brand-text-light">{days} {days === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-brand-text">Period:</span>
                        <span className="font-semibold text-brand-text-light">{new Date(startDate).toLocaleDateString()} → {new Date(endDate).toLocaleDateString()}</span>
                    </div>

                    <div className="border-t border-brand-primary/10 pt-2 flex justify-between">
                        <span className="text-sm text-brand-text">Rate:</span>
                        <span className="font-semibold text-brand-text-light">₹{pricePerHour}/hour</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm text-brand-text">Driver Requested:</span>
                        <span className="font-semibold text-brand-text-light">
                            {driverRequested ? (selectedDriver ? `Yes (${selectedDriver.name})` : 'Yes (Any available)') : 'No'}
                        </span>
                    </div>

                    {driverRequested && (
                        <div className="flex justify-between">
                            <span className="text-sm text-brand-text">Driver Fee:</span>
                            <span className="font-semibold text-brand-text-light">₹{driverTotal} <span className="text-xs font-normal text-brand-text">(₹{driverRate}/hr)</span></span>
                        </div>
                    )}

                    <div className="border-t border-brand-primary/10 pt-2 flex justify-between text-lg">
                        <span className="font-bold text-brand-text-light">Total Amount:</span>
                        <span className="font-bold text-brand-secondary-light">₹{totalPrice}</span>
                    </div>
                </div>

                <div className="bg-brand-accent/10 p-3 rounded-lg mb-4 border border-brand-accent/20">
                    <p className="text-sm text-brand-text-light">
                        <strong className="text-brand-accent-light">Payment Method:</strong> {paymentMethod === 'payNow' ? '💳 Pay Now (Online)' : '🏦 Pay on Delivery'}
                    </p>
                    {paymentMethod === 'payNow' && <p className="text-xs text-brand-text mt-1">Payment will be processed immediately</p>}
                    {paymentMethod === 'cod' && <p className="text-xs text-brand-text mt-1">You will pay when receiving the equipment</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 font-medium text-brand-text">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark font-medium">Confirm & Book</button>
                </div>
            </div>
        </div>
    );
}

export default EquipmentDetails;
