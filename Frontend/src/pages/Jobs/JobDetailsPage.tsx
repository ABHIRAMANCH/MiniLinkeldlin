import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin, 
  Clock, 
  DollarSign, 
  Building,
  Users,
  Calendar,
  ExternalLink,
  Briefcase,
  CheckCircle,
  Star,
  Share,
  Flag,
  Edit,
  Trash2
} from 'lucide-react';
import { jobApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  type: string;
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  skills: string[];
  requirements: string[];
  benefits: string[];
  poster: {
    _id: string;
    name: string;
    headline: string;
    profilePhoto: string;
  };
  applications: any[];
  externalUrl: string;
  companyLogo: string;
  isActive: boolean;
  deadline: string;
  remote: boolean;
  featured: boolean;
  views: number;
  createdAt: string;
  hasApplied?: boolean;
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeUrl: ''
  });

  const isJobPoster = job?.poster._id === user?._id;

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobApi.getJob(id!);
      setJob(response.data.job);
    } catch (error) {
      toast.error('Error loading job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    if (job.externalUrl) {
      window.open(job.externalUrl, '_blank');
      return;
    }

    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!job || !applicationData.coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }

    setApplying(true);
    try {
      await jobApi.applyToJob(job._id, applicationData);
      toast.success('Application submitted successfully!');
      setJob(prev => prev ? { ...prev, hasApplied: true } : null);
      setShowApplicationModal(false);
      setApplicationData({ coverLetter: '', resumeUrl: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job opportunity: ${job?.title} at ${job?.company}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Job URL copied to clipboard!');
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    
    const formatAmount = (amount: number) => {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toString();
    };

    const currency = salary.currency || 'USD';
    const period = salary.period || 'yearly';
    
    if (salary.min && salary.max) {
      return `${currency} ${formatAmount(salary.min)} - ${formatAmount(salary.max)} / ${period}`;
    } else if (salary.min) {
      return `${currency} ${formatAmount(salary.min)}+ / ${period}`;
    } else if (salary.max) {
      return `Up to ${currency} ${formatAmount(salary.max)} / ${period}`;
    }
    
    return null;
  };

  const getJobTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'internship': 'bg-orange-100 text-orange-800',
      'freelance': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceLevel = (level: string) => {
    const levels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive'
    };
    return levels[level as keyof typeof levels] || level;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
          <p className="text-gray-600 mt-2">The job you're looking for doesn't exist.</p>
          <Link
            to="/jobs"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Jobs
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : (
                <Building className="h-8 w-8 text-gray-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                {job.featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Featured
                  </span>
                )}
              </div>
              
              <h2 className="text-xl text-blue-600 font-semibold mb-4">{job.company}</h2>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {job.location}
                  {job.remote && <span className="ml-1">(Remote)</span>}
                </div>
                
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {getExperienceLevel(job.experience)}
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {job.applications.length} applicants
                </div>
              </div>

              {formatSalary(job.salary) && (
                <div className="flex items-center mt-3 text-lg font-semibold text-green-600">
                  <DollarSign className="h-5 w-5 mr-2" />
                  {formatSalary(job.salary)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share className="h-5 w-5" />
            </button>
            
            {!isJobPoster && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Flag className="h-5 w-5" />
              </button>
            )}

            {isJobPoster && (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/jobs/${job._id}/edit`}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job Type and Deadline */}
        <div className="flex items-center space-x-4 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getJobTypeColor(job.type)}`}>
            {job.type.replace('-', ' ').toUpperCase()}
          </span>
          
          {job.deadline && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              Application deadline: {new Date(job.deadline).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {!isJobPoster && (
            <button
              onClick={handleApply}
              disabled={job.hasApplied || !job.isActive}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                job.hasApplied
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : !job.isActive
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {job.hasApplied ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Applied
                </>
              ) : (
                <>
                  {job.externalUrl && <ExternalLink className="h-5 w-5 mr-2" />}
                  Apply Now
                </>
              )}
            </button>
          )}

          <Link
            to={`/messages/${job.poster._id}`}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Recruiter
          </Link>

          {isJobPoster && (
            <Link
              to={`/jobs/${job._id}/applications`}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              View Applications ({job.applications.length})
            </Link>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h3>
              <ul className="space-y-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <Star className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Poster */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Posted by</h3>
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${job.poster._id}`} className="flex-shrink-0">
                {job.poster.profilePhoto ? (
                  <img
                    className="w-12 h-12 rounded-full"
                    src={job.poster.profilePhoto}
                    alt={job.poster.name}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {job.poster.name.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>
              <div>
                <Link
                  to={`/profile/${job.poster._id}`}
                  className="font-semibold text-gray-900 hover:text-blue-600"
                >
                  {job.poster.name}
                </Link>
                <p className="text-sm text-gray-600">{job.poster.headline}</p>
              </div>
            </div>
          </div>

          {/* Job Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Applications</span>
                <span className="font-medium">{job.applications.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium">{job.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Posted</span>
                <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Apply for {job.title}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows={6}
                    placeholder="Tell us why you're interested in this position..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume URL (optional)
                  </label>
                  <input
                    type="url"
                    value={applicationData.resumeUrl}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                    placeholder="https://your-resume-link.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  disabled={applying || !applicationData.coverLetter.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;