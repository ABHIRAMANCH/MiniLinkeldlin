import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { recipient, content, type = 'text' } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient,
      content,
      type
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto')
      .populate('recipient', 'name profilePhoto');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get conversation with a user
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversationId = [req.user._id.toString(), userId].sort().join('_');

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePhoto')
      .populate('recipient', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        readAt: null
      },
      { readAt: new Date() }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      conversationId
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Error fetching conversation' });
  }
});

// Get all conversations
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$readAt', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.recipient',
          foreignField: '_id',
          as: 'recipientInfo'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.senderInfo[0]._id.toString() === req.user._id.toString() 
        ? conv.recipientInfo[0] 
        : conv.senderInfo[0];

      return {
        conversationId: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          profilePhoto: otherUser.profilePhoto,
          headline: otherUser.headline
        },
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt,
          sender: conv.lastMessage.sender.toString() === req.user._id.toString() ? 'me' : 'other'
        },
        unreadCount: conv.unreadCount
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// Mark messages as read
router.put('/read/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        readAt: null
      },
      { readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Delete conversation
router.delete('/conversation/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Only delete messages where user is sender or recipient
    const result = await Message.deleteMany({
      conversationId,
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} messages`
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Error deleting conversation' });
  }
});

export default router;