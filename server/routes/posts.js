import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create post
router.post('/', protect, async (req, res) => {
  try {
    const { content, type = 'text', images = [], link, hashtags = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = new Post({
      author: req.user._id,
      content: content.trim(),
      type,
      images,
      link,
      hashtags: hashtags.map(tag => tag.toLowerCase()),
    });

    await post.save();
    
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name headline profilePhoto')
      .populate('comments.user', 'name profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Get feed posts
router.get('/feed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const currentUser = await User.findById(req.user._id);
    const connections = currentUser.connections;
    const following = currentUser.following;

    // Get posts from connections, following, and trending posts
    const feedUserIds = [...connections, ...following, req.user._id];

    const posts = await Post.find({
      $or: [
        { author: { $in: feedUserIds } },
        { engagementScore: { $gte: 10 } }, // Trending posts
      ],
      visibility: { $in: ['public', 'connections'] }
    })
    .populate('author', 'name headline profilePhoto')
    .populate('comments.user', 'name profilePhoto')
    .populate('likes', 'name profilePhoto')
    .sort({ createdAt: -1, engagementScore: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      $or: [
        { author: { $in: feedUserIds } },
        { engagementScore: { $gte: 10 } }
      ],
      visibility: { $in: ['public', 'connections'] }
    });

    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

// Like/Unlike post
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
      await post.save();

      res.json({
        success: true,
        message: 'Post unliked',
        isLiked: false,
        likesCount: post.likes.length
      });
    } else {
      // Like
      post.likes.push(req.user._id);
      await post.save();

      // Create notification if not liking own post
      if (post.author.toString() !== req.user._id.toString()) {
        await new Notification({
          recipient: post.author,
          sender: req.user._id,
          type: 'post_like',
          title: 'Post Liked',
          message: `${req.user.name} liked your post`,
          relatedPost: post._id
        }).save();
      }

      res.json({
        success: true,
        message: 'Post liked',
        isLiked: true,
        likesCount: post.likes.length
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Error updating like status' });
  }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      content: content.trim(),
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'name profilePhoto');

    // Create notification if not commenting on own post
    if (post.author.toString() !== req.user._id.toString()) {
      await new Notification({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_comment',
        title: 'New Comment',
        message: `${req.user.name} commented on your post`,
        relatedPost: post._id
      }).save();
    }

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Share post
router.post('/:id/share', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingShare = post.shares.find(
      share => share.user.toString() === req.user._id.toString()
    );

    if (existingShare) {
      return res.status(400).json({ message: 'Post already shared' });
    }

    post.shares.push({ user: req.user._id });
    await post.save();

    // Create notification if not sharing own post
    if (post.author.toString() !== req.user._id.toString()) {
      await new Notification({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_share',
        title: 'Post Shared',
        message: `${req.user.name} shared your post`,
        relatedPost: post._id
      }).save();
    }

    res.json({
      success: true,
      message: 'Post shared successfully',
      sharesCount: post.shares.length
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Error sharing post' });
  }
});

// Get single post
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name headline profilePhoto')
      .populate('comments.user', 'name profilePhoto')
      .populate('likes', 'name profilePhoto');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// Search posts by hashtags
router.get('/hashtag/:tag', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({
      hashtags: tag,
      visibility: 'public'
    })
    .populate('author', 'name headline profilePhoto')
    .populate('comments.user', 'name profilePhoto')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      hashtags: tag,
      visibility: 'public'
    });

    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hashtag: tag
    });
  } catch (error) {
    console.error('Search hashtag error:', error);
    res.status(500).json({ message: 'Error searching posts' });
  }
});

export default router;