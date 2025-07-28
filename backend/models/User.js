// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing
const { uid } = require('uid'); // For generating unique IDs

const UserSchema = new mongoose.Schema({
    googleId: { // Google's unique ID for the user
        type: String,
        unique: true,
        sparse: true // Allows multiple null values, important if some users don't use Google login
    },
    username: { // User's display name
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: { // User's email address
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { // Hashed password (only for local accounts, if you implement them)
        type: String,
        // Password is not required if using Google OAuth
        // If you later add local password login, you'd add a validator here.
    },
    bio: { // New field for user's profile
        type: String,
        default: "",
        maxlength: 500
    },
    profilePicture: { // URL to user's profile picture
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash password before saving (if a password is provided)
// This is for local password authentication, not directly used by Google OAuth
UserSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare entered password with hashed password (for local login)
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // Only attempt to compare if a password exists for the user
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;