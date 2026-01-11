const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add equipment name']
    },
    model: {
        type: String,
        required: [true, 'Please add equipment model']
    },
    type: {
        type: String,
        required: [true, 'Please select equipment type'],
        enum: ['Tractor', 'Harvester', 'Drone', 'Tiller', 'Other']
    },
    year: {
        type: Number
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    pricePerHour: {
        type: Number,
        required: [true, 'Please add price per hour']
    },
    location: {
        type: String,
        required: [true, 'Please add location']
    },
    coordinates: {
        lat: { type: Number, default: 20.5937 }, // Default: India Center Latitude
        lng: { type: Number, default: 78.9629 }  // Default: India Center Longitude
    },
    image: {
        type: String,
        default: 'no-photo.jpg'
    },
    available: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Equipment', equipmentSchema);
