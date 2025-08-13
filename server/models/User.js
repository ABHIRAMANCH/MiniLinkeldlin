import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  years: { type: Number, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false }
});

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String, required: true },
  field: String,
  startYear: Number,
  endYear: Number,
  current: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  headline: {
    type: String,
    maxlength: [120, 'Headline cannot exceed 120 characters']
  },
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  skills: [{
    type: String,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  experience: [experienceSchema],
  education: [educationSchema],
  profilePhoto: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: ''
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  profileViews: {
    type: Number,
    default: 0
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resumeUrl: String,
  website: String,
  phone: String,
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showPhone: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for search functionality
userSchema.index({ 
  name: 'text', 
  headline: 'text', 
  skills: 'text', 
  location: 'text' 
});

export default mongoose.model('User', userSchema);