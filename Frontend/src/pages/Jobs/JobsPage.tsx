import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter,
  Plus,
  Building,
  Users,
  Calendar,
  ExternalLink
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

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    experience: '',
    remote: false,
    featured: false
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  const fetchJobs = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const params = {
        page: reset ? 1 : page,
        limit: 10,
        search: searchQuery,
        ...filters
      };

      const response = await jobApi.getJobs(params);
      const newJobs = response.data.jobs;

      if (reset) {
        setJobs(newJobs);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
      }

      setHasMore(response.data.currentPage < response.data.totalPages);
      setTotalJobs(response.data.total);
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleApply = async (jobId: string, externalUrl?: string) => {
    if (externalUrl) {
      window.open(externalUrl, '_blank');
      return;
    }
    navigate(`/jobs/${jobId}`);
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

  const JobCard: React.FC<{ job: Job }> = ({ job }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <Building className="h-6 w-6 text-gray-600" />
            )}
          </div>
          
          <div className="flex-1">
            <Link
              to={`/jobs/${job._id}`}
              className="text-xl font-semibold text-gray-900 hover:text-blue-600 block"
            >
              {job.title}
            </Link>
            <p className="text-blue-600 font-medium">{job.company}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
                {job.remote && <span className="ml-1">(Remote)</span>}
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(job.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {job.applications.length} applicants
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {job.featured && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Featured
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getJobTypeColor(job.type)}`}>
            {job.type.replace('-', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Job Details */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-1" />
            {getExperienceLevel(job.experience)}
          </div>
          
          {formatSalary(job.salary) && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatSalary(job.salary)}
            </div>
          )}
          
          {job.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </div>
          )}
        </div>

        <p className="text-gray-700 line-clamp-3 mb-3">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="text-sm text-gray-500">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <Link to={`/profile/${job.poster._id}`} className="flex items-center space-x-2">
            {job.poster.profilePhoto ? (
              <img
                className="w-6 h-6 rounded-full"
                src={job.poster.profilePhoto}
                alt={job.poster.name}
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {job.poster.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">Posted by {job.poster.name}</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/jobs/${job._id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
          >
            View Details
          </Link>
          
          <button
            onClick={() => handleApply(job._id, job.externalUrl)}
            disabled={job.hasApplied}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              job.hasApplied
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {job.externalUrl && <ExternalLink className="h-4 w-4 mr-1 inline" />}
            {job.hasApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Board</h1>
          <p className="text-gray-600">
            {totalJobs > 0 ? `${totalJobs} jobs available` : 'Discover your next opportunity'}
          </p>
        </div>
        
        <Link
          to="/jobs/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Post a Job
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs by title, company, or keywords..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City, Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience
              </label>
              <select
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(e) => handleFilterChange('remote', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Remote</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {loading && page === 1 ? (
          <LoadingSpinner />
        ) : jobs.length > 0 ? (
          <>
            {jobs.map(job => (
              <JobCard key={job._id} job={job} />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Jobs'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || Object.values(filters).some(f => f)
                ? 'Try adjusting your search criteria or filters.'
                : 'Be the first to post a job opportunity!'}
            </p>
            <Link
              to="/jobs/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;