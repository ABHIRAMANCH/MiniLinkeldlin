import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  readAt: Date,
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });

// Create conversation ID from sender and recipient IDs
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    const ids = [this.sender.toString(), this.recipient.toString()].sort();
    this.conversationId = ids.join('_');
  }
  next();
});

export default mongoose.model('Message', messageSchema);