const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^_]+_[^@]+@iitp\.ac\.in$/, 'Use IITP email (name_rollno@iitp.ac.in)']
  },
  password: { type: String, required: true, minlength: 6, select: false },
  rollNo: { type: String, required: true, unique: true, trim: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = UserSchema; 