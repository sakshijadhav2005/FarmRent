const PDFDocument = require('pdfkit');

/**
 * Generate Invoice PDF
 * @param {Object} booking - Booking object with populated equipment and farmer
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoice = async (booking) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Colors
            const primaryColor = '#22c55e';
            const textColor = '#1f2937';
            const mutedColor = '#6b7280';

            // Header
            doc.fontSize(24)
                .fillColor(primaryColor)
                .text('FarmRent', 50, 50)
                .fontSize(10)
                .fillColor(mutedColor)
                .text('Farm Equipment Rental Platform', 50, 80);

            // Invoice Title
            doc.fontSize(20)
                .fillColor(textColor)
                .text('INVOICE', 400, 50, { align: 'right' })
                .fontSize(10)
                .fillColor(mutedColor)
                .text(`Invoice #: ${booking.invoiceNumber || 'FR-' + booking._id.toString().slice(-8).toUpperCase()}`, 400, 75, { align: 'right' })
                .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });

            // Divider
            doc.moveTo(50, 120)
                .lineTo(550, 120)
                .strokeColor('#e5e7eb')
                .stroke();

            // Customer Details
            doc.fontSize(12)
                .fillColor(textColor)
                .text('Bill To:', 50, 140)
                .fontSize(10)
                .text(booking.farmer?.name || 'Customer', 50, 160)
                .fillColor(mutedColor)
                .text(booking.farmer?.email || '', 50, 175);

            // Equipment Details
            doc.fontSize(12)
                .fillColor(textColor)
                .text('Equipment Details:', 300, 140)
                .fontSize(10)
                .text(booking.equipment?.name || 'Equipment', 300, 160)
                .fillColor(mutedColor)
                .text(`Location: ${booking.equipment?.location || 'N/A'}`, 300, 175);

            // Booking Details Table
            const tableTop = 220;

            // Table Header
            doc.rect(50, tableTop, 500, 25)
                .fillColor('#f3f4f6')
                .fill();

            doc.fontSize(10)
                .fillColor(textColor)
                .text('Description', 60, tableTop + 8)
                .text('Period', 250, tableTop + 8)
                .text('Rate', 380, tableTop + 8)
                .text('Amount', 470, tableTop + 8);

            // Table Row
            const startDate = new Date(booking.startDate).toLocaleDateString('en-IN');
            const endDate = new Date(booking.endDate).toLocaleDateString('en-IN');
            const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)) + 1;

            doc.fontSize(10)
                .fillColor(textColor)
                .text(`${booking.equipment?.name || 'Equipment Rental'}`, 60, tableTop + 35)
                .fillColor(mutedColor)
                .text(`${startDate} - ${endDate}`, 250, tableTop + 35)
                .text(`₹${booking.equipment?.pricePerHour || 0}/hr × ${days * 24}hrs`, 370, tableTop + 35)
                .fillColor(textColor)
                .text(`₹${booking.totalPrice}`, 470, tableTop + 35);

            // Divider
            doc.moveTo(50, tableTop + 60)
                .lineTo(550, tableTop + 60)
                .strokeColor('#e5e7eb')
                .stroke();

            // Totals
            const totalsTop = tableTop + 80;

            doc.fontSize(10)
                .fillColor(mutedColor)
                .text('Subtotal:', 380, totalsTop)
                .fillColor(textColor)
                .text(`₹${booking.totalPrice}`, 470, totalsTop);

            doc.fillColor(mutedColor)
                .text('Tax (0%):', 380, totalsTop + 20)
                .fillColor(textColor)
                .text('₹0', 470, totalsTop + 20);

            doc.rect(370, totalsTop + 40, 180, 25)
                .fillColor(primaryColor)
                .fill();

            doc.fontSize(12)
                .fillColor('#ffffff')
                .text('Total:', 385, totalsTop + 47)
                .text(`₹${booking.totalPrice}`, 470, totalsTop + 47);

            // Payment Status
            const statusTop = totalsTop + 90;
            doc.fontSize(10)
                .fillColor(mutedColor)
                .text('Payment Status:', 380, statusTop)
                .fillColor(booking.paymentStatus === 'paid' ? primaryColor : '#f59e0b')
                .text(booking.paymentStatus?.toUpperCase() || 'PENDING', 470, statusTop);

            if (booking.transactionId) {
                doc.fillColor(mutedColor)
                    .text('Transaction ID:', 380, statusTop + 20)
                    .fillColor(textColor)
                    .text(booking.transactionId.slice(0, 20), 470, statusTop + 20);
            }

            // Footer
            doc.fontSize(8)
                .fillColor(mutedColor)
                .text('Thank you for choosing FarmRent!', 50, 700, { align: 'center' })
                .text('For any queries, contact us at support@farmrent.com', 50, 715, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateInvoice
};
