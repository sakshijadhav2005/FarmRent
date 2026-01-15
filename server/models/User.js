const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, unique: true, sparse: true, minlength: 10, maxlength: 10 },
    password: { type: String }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    location: { type: String },
    role: { type: String, enum: ["farmer", "owner", "worker", "admin", "driver"], required: true },
    hourlyRate: { type: Number, default: 0 }
}, { timestamps: true });

// Add this ⬇️
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
