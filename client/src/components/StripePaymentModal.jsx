import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../api';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const StripePaymentModal = ({ open, onClose, booking, amount, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!open) return null;

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError('');

        try {
            // Step 1: Create payment intent
            const intentRes = await createPaymentIntent(booking._id, amount);
            if (!intentRes.success) {
                throw new Error(intentRes.message || 'Failed to create payment intent');
            }

            const clientSecret = intentRes.clientSecret;
            const paymentIntentId = intentRes.paymentIntentId;

            // Step 2: Confirm payment with Stripe
            const cardElement = elements.getElement(CardElement);
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: booking.farmer?.name || 'Customer'
                        }
                    }
                }
            );

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            // Step 3: Confirm payment on backend
            const confirmRes = await confirmPayment(booking._id, paymentIntentId);
            if (!confirmRes.success) {
                throw new Error(confirmRes.message || 'Payment confirmation failed');
            }

            setSuccess(true);
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-brand-text-light">Complete Payment</h3>
                    <button onClick={onClose} className="text-brand-text hover:text-brand-text-light">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {!success ? (
                    <>
                        <div className="mb-4 p-3 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
                            <p className="text-sm font-semibold text-brand-accent-light">Amount to Pay</p>
                            <p className="text-2xl font-bold text-brand-accent-light">₹{amount}</p>
                        </div>

                        <form onSubmit={handlePayment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-brand-text">Card Details</label>
                                <div className="p-3 border border-white/20 rounded bg-white/5">
                                    <CardElement
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: '16px',
                                                    color: '#cbd5e1',
                                                    '::placeholder': {
                                                        color: '#94a3b8',
                                                    },
                                                },
                                                invalid: {
                                                    color: '#f87171',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-brand-text"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !stripe}
                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50 font-medium"
                                >
                                    {processing ? 'Processing...' : 'Pay Now'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <CheckCircle className="h-12 w-12 text-brand-primary-light mx-auto mb-3" />
                        <p className="text-lg font-semibold text-brand-primary-light">Payment Successful!</p>
                        <p className="text-sm text-brand-text mt-2">Your booking has been confirmed.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StripePaymentModal;
