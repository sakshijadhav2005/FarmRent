const nodemailer = require('nodemailer');

// Create transporter - Configure based on environment
const createTransporter = () => {
    // For production, use actual SMTP credentials
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // For development, log emails to console
    console.log('📧 Email service running in development mode (emails logged to console)');
    return {
        sendMail: async (options) => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 EMAIL (Dev Mode)');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Body:', options.html || options.text);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return { messageId: 'dev-' + Date.now() };
        }
    };
};

const transporter = createTransporter();

// Email templates
const templates = {
    bookingConfirmation: (data) => ({
        subject: `🎉 Booking Confirmed - ${data.equipmentName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #f1f5f9; padding: 30px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">🌾 FarmRent</h1>
                    <p style="color: #94a3b8;">Your Farming Partner</p>
                </div>
                
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: #4ade80; margin-top: 0;">Booking Confirmed! ✅</h2>
                    <p style="color: #f1f5f9;">Your equipment rental has been successfully booked.</p>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #f1f5f9; margin-top: 0;">Booking Details</h3>
                    <table style="width: 100%; color: #94a3b8;">
                        <tr><td style="padding: 8px 0;">Equipment:</td><td style="color: #f1f5f9;">${data.equipmentName}</td></tr>
                        <tr><td style="padding: 8px 0;">Start Date:</td><td style="color: #f1f5f9;">${data.startDate}</td></tr>
                        <tr><td style="padding: 8px 0;">End Date:</td><td style="color: #f1f5f9;">${data.endDate}</td></tr>
                        <tr><td style="padding: 8px 0;">Total Amount:</td><td style="color: #facc15; font-weight: bold;">₹${data.totalPrice}</td></tr>
                        <tr><td style="padding: 8px 0;">Payment:</td><td style="color: #f1f5f9;">${data.paymentMethod === 'cod' ? 'Pay on Delivery' : 'Paid Online'}</td></tr>
                    </table>
                </div>
                
                <p style="color: #94a3b8; text-align: center; margin-top: 30px;">
                    Need help? Contact us at support@farmrent.com
                </p>
            </div>
        `
    }),

    bookingNotificationToOwner: (data) => ({
        subject: `📢 New Booking - ${data.equipmentName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #f1f5f9; padding: 30px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">🌾 FarmRent</h1>
                    <p style="color: #94a3b8;">Equipment Owner Dashboard</p>
                </div>
                
                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: #7dd3fc; margin-top: 0;">New Booking Received! 📦</h2>
                    <p style="color: #f1f5f9;">Someone has booked your equipment.</p>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                    <h3 style="color: #f1f5f9; margin-top: 0;">Details</h3>
                    <table style="width: 100%; color: #94a3b8;">
                        <tr><td style="padding: 8px 0;">Equipment:</td><td style="color: #f1f5f9;">${data.equipmentName}</td></tr>
                        <tr><td style="padding: 8px 0;">Farmer:</td><td style="color: #f1f5f9;">${data.farmerName}</td></tr>
                        <tr><td style="padding: 8px 0;">Period:</td><td style="color: #f1f5f9;">${data.startDate} - ${data.endDate}</td></tr>
                        <tr><td style="padding: 8px 0;">Amount:</td><td style="color: #facc15; font-weight: bold;">₹${data.totalPrice}</td></tr>
                    </table>
                </div>
            </div>
        `
    }),

    paymentConfirmation: (data) => ({
        subject: `💳 Payment Successful - ₹${data.amount}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #f1f5f9; padding: 30px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">🌾 FarmRent</h1>
                </div>
                
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <h2 style="color: #4ade80; margin-top: 0;">Payment Successful! 💳</h2>
                    <p style="font-size: 36px; color: #facc15; margin: 20px 0;">₹${data.amount}</p>
                    <p style="color: #94a3b8;">Transaction ID: ${data.transactionId}</p>
                </div>
            </div>
        `
    }),

    bookingReminder: (data) => ({
        subject: `⏰ Reminder: Booking Tomorrow - ${data.equipmentName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #f1f5f9; padding: 30px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">🌾 FarmRent</h1>
                </div>
                
                <div style="background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 12px; padding: 20px;">
                    <h2 style="color: #fde047; margin-top: 0;">⏰ Booking Reminder</h2>
                    <p style="color: #f1f5f9;">Your booking for <strong>${data.equipmentName}</strong> starts tomorrow!</p>
                    <p style="color: #94a3b8;">Location: ${data.location}</p>
                </div>
            </div>
        `
    }),

    notification: (title, message) => ({
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1628; color: #f1f5f9; padding: 30px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">🌾 FarmRent</h1>
                </div>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px;">
                    <h2 style="color: #f1f5f9; margin-top: 0;">${title}</h2>
                    <p style="color: #94a3b8;">${message}</p>
                </div>
            </div>
        `
    })
};

// Send email functions
const sendBookingConfirmation = async (email, data) => {
    const template = templates.bookingConfirmation(data);
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FarmRent <noreply@farmrent.com>',
        to: email,
        subject: template.subject,
        html: template.html
    });
};

const sendBookingNotificationToOwner = async (email, data) => {
    const template = templates.bookingNotificationToOwner(data);
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FarmRent <noreply@farmrent.com>',
        to: email,
        subject: template.subject,
        html: template.html
    });
};

const sendPaymentConfirmation = async (email, data) => {
    const template = templates.paymentConfirmation(data);
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FarmRent <noreply@farmrent.com>',
        to: email,
        subject: template.subject,
        html: template.html
    });
};

const sendBookingReminder = async (email, data) => {
    const template = templates.bookingReminder(data);
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FarmRent <noreply@farmrent.com>',
        to: email,
        subject: template.subject,
        html: template.html
    });
};

const sendNotificationEmail = async (email, title, message) => {
    const template = templates.notification(title, message);
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FarmRent <noreply@farmrent.com>',
        to: email,
        subject: template.subject,
        html: template.html
    });
};

module.exports = {
    sendBookingConfirmation,
    sendBookingNotificationToOwner,
    sendPaymentConfirmation,
    sendBookingReminder,
    sendNotificationEmail
};
