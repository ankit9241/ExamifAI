const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    rollNo: {
        type: String,
        required: true,
        unique: true
    },
    tokenExpiry: {
        type: Date,
        default: null
    },
    faceDescriptor: {
        type: [Number], // Single array of 128 numbers
        default: undefined
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to convert user to JSON (excluding password)
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);
User.createIndexes().catch(console.error);
module.exports = User; 