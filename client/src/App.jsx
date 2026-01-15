import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import DashboardRouter from './pages/DashboardRouter';
import AddEquipment from './pages/AddEquipment';
import Settings from './pages/Settings';
import Bookings from './pages/Bookings';
import EquipmentDetails from './pages/EquipmentDetails';
import WorkerDashboard from './pages/WorkerDashboard';
import FindWorkers from './pages/FindWorkers';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import WorkerDetails from './pages/WorkerDetails';
import WorkPlanner from './pages/WorkPlanner';
import VoiceAssistant from './pages/VoiceAssistant';
import AuthCallback from './pages/AuthCallback';
import SelectRole from './pages/SelectRole';
import { AuthProvider } from './context/AuthContext';

// Initialize Stripe (use test key for development)
// Vite exposes env vars via import.meta.env and requires the VITE_ prefix for client-side variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key');

function App() {
    return (
        <AuthProvider>
            <Elements stripe={stripePromise}>
                <Router>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="login" element={<Login />} />
                            <Route path="register" element={<Register />} />
                            <Route path="auth/callback" element={<AuthCallback />} />
                            <Route path="select-role" element={<SelectRole />} />
                            <Route path="dashboard" element={<DashboardRouter />} />
                            <Route path="dashboard/owner" element={<OwnerDashboard />} />
                            <Route path="dashboard/farmer" element={<FarmerDashboard />} />
                            <Route path="addequipment" element={<AddEquipment />} />
                            <Route path="worker-dashboard" element={<WorkerDashboard />} />
                            <Route path="find-workers" element={<FindWorkers />} />
                            <Route path="bookings" element={<Bookings />} />
                            <Route path="equipment/:id" element={<EquipmentDetails />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="wishlist" element={<Wishlist />} />
                            <Route path="worker-details" element={<WorkerDetails />} />
                            <Route path="admin" element={<AdminDashboard />} />
                            <Route path="driver-dashboard" element={<DriverDashboard />} />
                            <Route path="work-planner" element={<WorkPlanner />} />
                            <Route path="voice-assistant" element={<VoiceAssistant />} />
                            {/* Add more routes here */}
                        </Route>
                    </Routes>
                </Router>
            </Elements>
        </AuthProvider>
    );
}

export default App;

