import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [300, 'Connection message cannot exceed 300 characters']
  },
  connectedAt: {
    type: Date
  },
  mutualConnections: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Prevent duplicate connection requests
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Update connectedAt when status changes to accepted
connectionSchema.pre('save', function(next) {
  if (this.status === 'accepted' && !this.connectedAt) {
    this.connectedAt = new Date();
  }
  next();
});

export default mongoose.model('Connection', connectionSchema);