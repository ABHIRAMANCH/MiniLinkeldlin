import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [3000, 'Post content cannot exceed 3000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'link', 'job_share'],
    default: 'text'
  },
  images: [{
    type: String
  }],
  link: {
    url: String,
    title: String,
    description: String,
    image: String
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  engagementScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search and performance
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ content: 'text' });

// Calculate engagement score before saving
postSchema.pre('save', function(next) {
  this.engagementScore = this.likes.length + this.comments.length + (this.shares.length * 2);
  next();
});

export default mongoose.model('Post', postSchema);