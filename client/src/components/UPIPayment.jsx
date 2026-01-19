import React, { useState } from 'react';
import { Smartphone, CreditCard, Wallet, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

/**
 * UPI Payment Integration Component
 * Supports UPI payments for Indian farmers
 */
const UPIPayment = ({
    amount,
    bookingId,
    equipmentName,
    onSuccess,
    onCancel,
    merchantUPI = 'farmlink@upi' // Default merchant UPI ID
}) => {
    const { t } = useTranslation();
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState(null); // null, 'pending', 'success', 'failed'
    const [transactionId, setTransactionId] = useState('');
    const [copied, setCopied] = useState(false);

    const paymentMethods = [
        { id: 'upi', name: 'UPI', icon: Smartphone, description: t('payment.upiDesc', 'Pay using any UPI app'), popular: true },
        { id: 'gpay', name: 'Google Pay', icon: Wallet, description: t('payment.gpayDesc', 'Pay with Google Pay') },
        { id: 'phonepe', name: 'PhonePe', icon: Wallet, description: t('payment.phonepeDesc', 'Pay with PhonePe') },
        { id: 'paytm', name: 'Paytm', icon: Wallet, description: t('payment.paytmDesc', 'Pay with Paytm') },
        { id: 'card', name: t('payment.card', 'Credit/Debit Card'), icon: CreditCard, description: t('payment.cardDesc', 'Pay with card') }
    ];

    // Generate UPI deep link
    const generateUPILink = (appType = 'generic') => {
        const transRef = `FL${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const params = new URLSearchParams({
            pa: merchantUPI,
            pn: 'FarmLink',
            am: amount.toFixed(2),
            cu: 'INR',
            tn: `Booking: ${equipmentName}`,
            tr: transRef
        });

        setTransactionId(transRef);

        switch (appType) {
            case 'gpay':
                return `tez://upi/pay?${params.toString()}`;
            case 'phonepe':
                return `phonepe://pay?${params.toString()}`;
            case 'paytm':
                return `paytmmp://pay?${params.toString()}`;
            default:
                return `upi://pay?${params.toString()}`;
        }
    };

    // Handle UPI app payment
    const handleUPIAppPayment = (appType) => {
        const upiLink = generateUPILink(appType);

        // Try to open the UPI app
        window.location.href = upiLink;

        setPaymentStatus('pending');

        // Show verification dialog after a delay
        setTimeout(() => {
            setPaymentStatus('verify');
        }, 3000);
    };

    // Handle manual UPI payment
    const handleManualUPIPayment = async () => {
        if (!upiId.trim()) {
            setError(t('payment.enterUpiId', 'Please enter your UPI ID'));
            return;
        }

        // Basic UPI ID validation
        const upiRegex = /^[\w.-]+@[\w]+$/;
        if (!upiRegex.test(upiId.trim())) {
            setError(t('payment.invalidUpiId', 'Invalid UPI ID format. Example: yourname@upi'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // In a real implementation, this would call a payment gateway API
            const response = await fetch(`${API_BASE}/payments/initiate-upi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    upiId: upiId.trim(),
                    amount,
                    bookingId,
                    description: `Booking: ${equipmentName}`
                })
            });

            const data = await response.json();

            if (data.success) {
                setTransactionId(data.transactionId);
                setPaymentStatus('pending');
            } else {
                setError(data.message || t('payment.initFailed', 'Failed to initiate payment'));
            }
        } catch (err) {
            console.error('Payment error:', err);
            // For demo, simulate success
            setTransactionId(`FL${Date.now()}`);
            setPaymentStatus('pending');
        } finally {
            setLoading(false);
        }
    };

    // Verify payment (in real app, this would check with backend)
    const verifyPayment = async (status) => {
        setLoading(true);

        try {
            // Simulate verification
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (status === 'success') {
                setPaymentStatus('success');
                setTimeout(() => {
                    onSuccess && onSuccess({
                        transactionId,
                        amount,
                        method: paymentMethod,
                        timestamp: new Date().toISOString()
                    });
                }, 2000);
            } else {
                setPaymentStatus('failed');
            }
        } catch (err) {
            setPaymentStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    // Copy UPI ID to clipboard
    const copyUPIId = () => {
        navigator.clipboard.writeText(merchantUPI);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Render payment method selection
    const renderMethodSelection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-text-light">
                {t('payment.selectMethod', 'Select Payment Method')}
            </h3>

            <div className="space-y-3">
                {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${paymentMethod === method.id
                                    ? 'border-brand-primary bg-brand-primary/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.id === 'gpay' ? 'bg-blue-500' :
                                    method.id === 'phonepe' ? 'bg-purple-500' :
                                        method.id === 'paytm' ? 'bg-blue-400' :
                                            method.id === 'card' ? 'bg-orange-500' :
                                                'bg-brand-primary'
                                }`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-brand-text-light">{method.name}</span>
                                    {method.popular && (
                                        <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full">
                                            {t('common.popular', 'Popular')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-brand-text-muted">{method.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === method.id
                                    ? 'border-brand-primary bg-brand-primary'
                                    : 'border-white/30'
                                }`}>
                                {paymentMethod === method.id && (
                                    <CheckCircle className="w-full h-full text-white" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Render UPI payment form
    const renderUPIForm = () => (
        <div className="space-y-6">
            {/* Amount Display */}
            <div className="text-center p-6 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 rounded-2xl">
                <p className="text-brand-text-muted mb-1">{t('payment.amountToPay', 'Amount to Pay')}</p>
                <p className="text-4xl font-bold text-brand-text-light">₹{amount.toFixed(2)}</p>
                <p className="text-sm text-brand-text-muted mt-2">{equipmentName}</p>
            </div>

            {/* Quick Pay Buttons */}
            <div>
                <p className="text-sm text-brand-text-muted mb-3">{t('payment.quickPay', 'Quick Pay with')}</p>
                <div className="grid grid-cols-3 gap-3">
                    {['gpay', 'phonepe', 'paytm'].map((app) => (
                        <button
                            key={app}
                            onClick={() => handleUPIAppPayment(app)}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-center"
                        >
                            <Wallet className={`w-8 h-8 mx-auto mb-2 ${app === 'gpay' ? 'text-blue-500' :
                                    app === 'phonepe' ? 'text-purple-500' :
                                        'text-blue-400'
                                }`} />
                            <span className="text-sm text-brand-text-light capitalize">{app === 'gpay' ? 'GPay' : app === 'phonepe' ? 'PhonePe' : 'Paytm'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-brand-text-muted text-sm">{t('common.or', 'or')}</span>
                <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Manual UPI Entry */}
            <div>
                <label className="text-sm text-brand-text-muted block mb-2">
                    {t('payment.enterUpiId', 'Enter your UPI ID')}
                </label>
                <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                />
            </div>

            {/* Merchant UPI (for manual payment) */}
            <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-brand-text-muted mb-2">{t('payment.payTo', 'Pay to UPI ID')}</p>
                <div className="flex items-center justify-between">
                    <span className="text-brand-text-light font-mono">{merchantUPI}</span>
                    <button
                        onClick={copyUPIId}
                        className="flex items-center gap-1 text-brand-primary text-sm"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Pay Button */}
            <button
                onClick={handleManualUPIPayment}
                disabled={loading || !upiId.trim()}
                className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-bold text-lg hover:shadow-glow-primary transition-all disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                    t('payment.payNow', 'Pay Now')
                )}
            </button>
        </div>
    );

    // Render verification screen
    const renderVerification = () => (
        <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            </div>

            <div>
                <h3 className="text-xl font-bold text-brand-text-light mb-2">
                    {t('payment.verifying', 'Verifying Payment...')}
                </h3>
                <p className="text-brand-text-muted">
                    {t('payment.pleaseComplete', 'Please complete the payment in your UPI app')}
                </p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-brand-text-muted mb-1">{t('payment.transactionId', 'Transaction ID')}</p>
                <p className="font-mono text-brand-text-light">{transactionId}</p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => verifyPayment('success')}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                    {t('payment.paymentDone', "I've Paid")}
                </button>
                <button
                    onClick={() => verifyPayment('failed')}
                    className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
                >
                    {t('payment.paymentFailed', 'Payment Failed')}
                </button>
            </div>
        </div>
    );

    // Render success screen
    const renderSuccess = () => (
        <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-14 h-14 text-green-500" />
            </div>

            <div>
                <h3 className="text-2xl font-bold text-brand-text-light mb-2">
                    {t('payment.success', 'Payment Successful!')}
                </h3>
                <p className="text-brand-text-muted">
                    {t('payment.thankYou', 'Thank you for your payment')}
                </p>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex justify-between mb-2">
                    <span className="text-brand-text-muted">{t('payment.amount', 'Amount')}</span>
                    <span className="font-bold text-green-400">₹{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-brand-text-muted">{t('payment.transactionId', 'Transaction ID')}</span>
                    <span className="font-mono text-brand-text-light text-sm">{transactionId}</span>
                </div>
            </div>
        </div>
    );

    // Render failed screen
    const renderFailed = () => (
        <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-red-500" />
            </div>

            <div>
                <h3 className="text-2xl font-bold text-brand-text-light mb-2">
                    {t('payment.failed', 'Payment Failed')}
                </h3>
                <p className="text-brand-text-muted">
                    {t('payment.tryAgain', 'Please try again or use a different payment method')}
                </p>
            </div>

            <button
                onClick={() => {
                    setPaymentStatus(null);
                    setPaymentMethod(null);
                    setError('');
                }}
                className="w-full py-3 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary-dark transition-colors"
            >
                {t('common.tryAgain', 'Try Again')}
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-brand-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-4 flex items-center justify-between">
                    <h2 className="font-bold text-white text-lg">
                        {paymentStatus === 'success' ? t('payment.complete', 'Payment Complete') : t('payment.title', 'Payment')}
                    </h2>
                    {paymentStatus !== 'success' && (
                        <button onClick={onCancel} className="text-white/80 hover:text-white">
                            ✕
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {paymentStatus === 'success' ? renderSuccess() :
                        paymentStatus === 'failed' ? renderFailed() :
                            paymentStatus === 'verify' || paymentStatus === 'pending' ? renderVerification() :
                                paymentMethod === 'upi' || paymentMethod === 'gpay' || paymentMethod === 'phonepe' || paymentMethod === 'paytm' ? renderUPIForm() :
                                    renderMethodSelection()}
                </div>

                {/* Footer */}
                {!paymentMethod && paymentStatus !== 'success' && (
                    <div className="px-6 pb-6">
                        <button
                            onClick={() => paymentMethod && setPaymentMethod(paymentMethod)}
                            disabled={!paymentMethod}
                            className="w-full py-3 bg-brand-primary text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary-dark transition-colors"
                        >
                            {t('common.continue', 'Continue')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UPIPayment;
