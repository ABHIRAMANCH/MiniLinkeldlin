import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: String,
  resumeUrl: String,
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  skills: [{
    type: String,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  requirements: [{
    type: String,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  benefits: [{
    type: String,
    maxlength: [100, 'Benefit cannot exceed 100 characters']
  }],
  poster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [jobApplicationSchema],
  externalUrl: String,
  companyLogo: String,
  isActive: {
    type: Boolean,
    default: true
  },
  deadline: Date,
  remote: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({ 
  title: 'text', 
  company: 'text', 
  description: 'text', 
  skills: 'text' 
});
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);