import express from 'express';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Send connection request
router.post('/request', protect, async (req, res) => {
  try {
    const { userId, message = '' } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect to yourself' });
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ 
        message: 'Connection request already exists or you are already connected' 
      });
    }

    // Create connection request
    const connection = new Connection({
      requester: req.user._id,
      recipient: userId,
      message: message.trim()
    });

    await connection.save();

    // Create notification
    await new Notification({
      recipient: userId,
      sender: req.user._id,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${req.user.name} wants to connect with you`,
      relatedUser: req.user._id
    }).save();

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully'
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Error sending connection request' });
  }
});

// Get connection requests (received)
router.get('/requests/received', protect, async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'name headline profilePhoto location')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Error fetching connection requests' });
  }
});

// Get connection requests (sent)
router.get('/requests/sent', protect, async (req, res) => {
  try {
    const requests = await Connection.find({
      requester: req.user._id,
      status: 'pending'
    })
    .populate('recipient', 'name headline profilePhoto location')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Error fetching sent requests' });
  }
});

// Accept/Decline connection request
router.put('/request/:id/:action', protect, async (req, res) => {
  try {
    const { id, action } = req.params;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if user is the recipient
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already processed' });
    }

    if (action === 'accept') {
      connection.status = 'accepted';
      await connection.save();

      // Add to connections list
      await User.findByIdAndUpdate(connection.requester, {
        $addToSet: { connections: connection.recipient }
      });
      await User.findByIdAndUpdate(connection.recipient, {
        $addToSet: { connections: connection.requester }
      });

      // Create notification
      await new Notification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request`,
        relatedUser: req.user._id
      }).save();

      res.json({
        success: true,
        message: 'Connection request accepted'
      });
    } else {
      connection.status = 'declined';
      await connection.save();

      res.json({
        success: true,
        message: 'Connection request declined'
      });
    }
  } catch (error) {
    console.error('Process connection request error:', error);
    res.status(500).json({ message: 'Error processing connection request' });
  }
});

// Get connections
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'connections',
        select: 'name headline profilePhoto location skills',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    const totalConnections = await User.findById(req.user._id).select('connections');

    res.json({
      success: true,
      connections: user.connections,
      totalConnections: totalConnections.connections.length,
      totalPages: Math.ceil(totalConnections.connections.length / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Error fetching connections' });
  }
});

// Remove connection
router.delete('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove from both users' connections
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { connections: userId }
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { connections: req.user._id }
    });

    // Update connection status
    await Connection.findOneAndUpdate(
      {
        $or: [
          { requester: req.user._id, recipient: userId },
          { requester: userId, recipient: req.user._id }
        ],
        status: 'accepted'
      },
      { status: 'declined' }
    );

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Error removing connection' });
  }
});

// Get mutual connections
router.get('/mutual/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id).select('connections');
    const targetUser = await User.findById(userId).select('connections');

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find mutual connections
    const mutualConnections = await User.find({
      _id: {
        $in: currentUser.connections.filter(id =>
          targetUser.connections.includes(id)
        )
      }
    }).select('name headline profilePhoto');

    res.json({
      success: true,
      mutualConnections,
      count: mutualConnections.length
    });
  } catch (error) {
    console.error('Get mutual connections error:', error);
    res.status(500).json({ message: 'Error fetching mutual connections' });
  }
});

export default router;