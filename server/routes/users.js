import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('connections', 'name headline profilePhoto')
      .populate('followers', 'name headline profilePhoto')
      .populate('following', 'name headline profilePhoto');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile views if not viewing own profile
    if (req.user._id.toString() !== user._id.toString()) {
      await User.findByIdAndUpdate(req.params.id, { 
        $inc: { profileViews: 1 } 
      });
    }

    // Check connection status
    const isConnected = user.connections.some(
      conn => conn._id.toString() === req.user._id.toString()
    );
    const isFollowing = user.followers.some(
      follower => follower._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        isConnected,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.passwordHash;
    delete updates.email;
    delete updates.isAdmin;
    delete updates.connections;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Search users
router.get('/search', protect, async (req, res) => {
  try {
    const { q, location, skills, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      query.skills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    const users = await User.find(query)
      .select('name headline profilePhoto location skills connections followers')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ profileViews: -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get user posts
router.get('/:id/posts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'name headline profilePhoto')
      .populate('comments.user', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ author: req.params.id });

    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
});

// Follow/Unfollow user
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = targetUser.followers.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id }
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id }
      });
      
      res.json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user._id }
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.id }
      });

      res.json({
        success: true,
        message: 'Following successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Error updating follow status' });
  }
});

// Get suggested users
router.get('/suggestions', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('connections following');

    // Get IDs of users already connected or following
    const excludeIds = [
      req.user._id,
      ...currentUser.connections.map(c => c._id),
      ...currentUser.following.map(f => f._id)
    ];

    // Find users with similar skills or from same location
    const suggestions = await User.find({
      _id: { $nin: excludeIds },
      $or: [
        { skills: { $in: currentUser.skills } },
        { location: currentUser.location }
      ]
    })
    .select('name headline profilePhoto location skills followers')
    .limit(10)
    .sort({ profileViews: -1 });

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
});

export default router;