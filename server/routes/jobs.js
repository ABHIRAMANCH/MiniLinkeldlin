import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create job posting
router.post('/', protect, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      poster: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('poster', 'name headline profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Error creating job posting' });
  }
});

// Get all jobs with filters
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      location, 
      type, 
      experience,
      skills,
      remote,
      featured 
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Job type filter
    if (type) {
      query.type = type;
    }

    // Experience level filter
    if (experience) {
      query.experience = experience;
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      query.skills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    // Remote filter
    if (remote === 'true') {
      query.remote = true;
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    const jobs = await Job.find(query)
      .populate('poster', 'name headline profilePhoto')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Get single job
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('poster', 'name headline profilePhoto company')
      .populate('applications.applicant', 'name headline profilePhoto email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views if not the poster
    if (job.poster._id.toString() !== req.user._id.toString()) {
      await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    // Check if user has applied
    const hasApplied = job.applications.some(
      app => app.applicant._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      job: {
        ...job.toObject(),
        hasApplied
      }
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Apply to job
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const { coverLetter, resumeUrl } = req.body;
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.isActive) {
      return res.status(400).json({ message: 'Job posting is no longer active' });
    }

    // Check if already applied
    const existingApplication = job.applications.find(
      app => app.applicant.toString() === req.user._id.toString()
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Add application
    job.applications.push({
      applicant: req.user._id,
      coverLetter,
      resumeUrl
    });

    await job.save();

    // Create notification for job poster
    await new Notification({
      recipient: job.poster,
      sender: req.user._id,
      type: 'job_match',
      title: 'New Job Application',
      message: `${req.user.name} applied to your job: ${job.title}`,
      relatedJob: job._id,
      relatedUser: req.user._id
    }).save();

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ message: 'Error submitting application' });
  }
});

// Get job applications (for job poster)
router.get('/:id/applications', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applications.applicant', 'name headline profilePhoto email location skills experience');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view applications' });
    }

    res.json({
      success: true,
      applications: job.applications,
      jobTitle: job.title
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Update application status
router.put('/:jobId/applications/:applicationId', protect, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await job.save();

    res.json({
      success: true,
      message: 'Application status updated',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
});

// Get user's job applications
router.get('/my/applications', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const jobs = await Job.find({
      'applications.applicant': req.user._id
    })
    .populate('poster', 'name headline profilePhoto')
    .sort({ 'applications.appliedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Filter to only include user's applications
    const applications = jobs.map(job => {
      const userApplication = job.applications.find(
        app => app.applicant.toString() === req.user._id.toString()
      );
      
      return {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          poster: job.poster
        },
        application: userApplication
      };
    });

    res.json({
      success: true,
      applications,
      currentPage: page
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Update job posting
router.put('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('poster', 'name headline profilePhoto');

    res.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Error updating job' });
  }
});

// Delete job posting
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job poster or admin
    if (job.poster.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
});

export default router;