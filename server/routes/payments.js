const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Initialize Stripe only when secret key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('STRIPE_SECRET_KEY not set — payment endpoints will return errors until configured');
}

// Create a payment intent for a booking
router.post('/create-payment-intent', protect, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and amount are required'
            });
        }

        // Verify the booking exists and belongs to the user
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.farmer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to pay for this booking'
            });
        }

        // Ensure Stripe is configured
        if (!stripe) {
            return res.status(500).json({ success: false, message: 'Stripe secret key not configured on server' });
        }

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'inr',
            metadata: {
                bookingId: bookingId,
                farmerId: req.user.id
            },
            description: `Farm Equipment Booking - ${booking.equipment}`
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
});

// Confirm payment and update booking status
router.post('/confirm-payment', protect, async (req, res) => {
    try {
        const { bookingId, paymentIntentId } = req.body;

        if (!bookingId || !paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and Payment Intent ID are required'
            });
        }

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment was not successful',
                status: paymentIntent.status
            });
        }

        // Update booking with payment details
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                status: 'confirmed',
                paymentMethod: 'online',
                paymentStatus: 'paid',
                transactionId: paymentIntentId,
                paidAt: new Date()
            },
            { new: true }
        ).populate('farmer equipment owner');

        // Notify Owner of Payment
        try {
            // Dynamic import to avoid circular dependency issues if any
            const { createNotification } = require('../controllers/notificationController');
            if (booking.owner) {
                await createNotification(
                    booking.owner._id,
                    'payment',
                    'Payment Received',
                    `Received payment of ₹${(paymentIntent.amount / 100).toFixed(2)} for ${booking.equipment?.name || 'Equipment'}`,
                    { bookingId: booking._id, amount: paymentIntent.amount / 100 },
                    true
                );
            }

            // Notify Farmer of Success
            if (booking.farmer) {
                await createNotification(
                    booking.farmer._id,
                    'payment',
                    'Payment Successful',
                    `Your payment of ₹${(paymentIntent.amount / 100).toFixed(2)} was successful. Booking Confirmed!`,
                    { bookingId: booking._id, amount: paymentIntent.amount / 100 },
                    true
                );
            }
        } catch (notifErr) {
            console.error('Failed to send payment notification:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: 'Payment confirmed successfully',
            data: booking
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm payment',
            error: error.message
        });
    }
});

// Webhook for Stripe events (for future use)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`Payment succeeded: ${paymentIntent.id}`);
            // Handle successful payment here
            break;
        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            console.log(`Payment failed: ${failedIntent.id}`);
            // Handle failed payment here
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;
