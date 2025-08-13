import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Users, 
  Briefcase, 
  FileText,
  MapPin,
  Building,
  User,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { userApi, jobApi, postApi } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import PostCard from '../../components/Posts/PostCard';
import toast from 'react-hot-toast';

interface SearchResult {
  people: any[];
  jobs: any[];
  posts: any[];
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('people');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    location: '',
    skills: '',
    jobType: '',
    experience: ''
  });
  const [results, setResults] = useState<SearchResult>({
    people: [],
    jobs: [],
    posts: []
  });
  const [totalResults, setTotalResults] = useState({
    people: 0,
    jobs: 0,
    posts: 0
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, [searchParams]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const [peopleResponse, jobsResponse, postsResponse] = await Promise.all([
        userApi.searchUsers({ 
          q: searchTerm, 
          location: filters.location,
          skills: filters.skills,
          page: 1, 
          limit: 20 
        }),
        jobApi.getJobs({ 
          search: searchTerm,
          location: filters.location,
          type: filters.jobType,
          experience: filters.experience,
          page: 1, 
          limit: 20 
        }),
        postApi.getFeed({ 
          search: searchTerm,
          page: 1, 
          limit: 20 
        })
      ]);

      setResults({
        people: peopleResponse.data.users || [],
        jobs: jobsResponse.data.jobs || [],
        posts: postsResponse.data.posts || []
      });

      setTotalResults({
        people: peopleResponse.data.total || 0,
        jobs: jobsResponse.data.total || 0,
        posts: postsResponse.data.posts?.length || 0
      });

      // Update URL
      setSearchParams({ q: searchTerm });
    } catch (error) {
      toast.error('Error performing search');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'people', label: 'People', icon: Users, count: totalResults.people },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, count: totalResults.jobs },
    { id: 'posts', label: 'Posts', icon: FileText, count: totalResults.posts }
  ];

  const PersonCard: React.FC<{ person: any }> = ({ person }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <Link to={`/profile/${person._id}`} className="flex-shrink-0">
          {person.profilePhoto ? (
            <img
              className="w-16 h-16 rounded-full"
              src={person.profilePhoto}
              alt={person.name}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${person._id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 block truncate"
          >
            {person.name}
          </Link>
          <p className="text-gray-600 text-sm mb-2 truncate">{person.headline}</p>
          
          {person.location && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {person.location}
            </div>
          )}

          {person.skills && person.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {person.skills.slice(0, 3).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {person.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{person.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </button>
            <Link
              to={`/messages/${person._id}`}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const JobCard: React.FC<{ job: any }> = ({ job }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                {job.type.replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-700 line-clamp-2 mb-4">
        {job.description}
      </p>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 4).map((skill: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-sm text-gray-500">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {job.applications?.length || 0} applicants
        </span>
        <Link
          to={`/jobs/${job._id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
        >
          View Job
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
        {searchQuery && (
          <p className="text-gray-600">
            Results for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search people, jobs, posts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Skills
              </label>
              <input
                type="text"
                value={filters.skills}
                onChange={(e) => handleFilterChange('skills', e.target.value)}
                placeholder="JavaScript, React..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
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
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-1 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* People Results */}
            {activeTab === 'people' && (
              <div>
                {results.people.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.people.map(person => (
                      <PersonCard key={person._id} person={person} />
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Jobs Results */}
            {activeTab === 'jobs' && (
              <div>
                {results.jobs.length > 0 ? (
                  <div className="space-y-6">
                    {results.jobs.map(job => (
                      <JobCard key={job._id} job={job} />
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Posts Results */}
            {activeTab === 'posts' && (
              <div>
                {results.posts.length > 0 ? (
                  <div className="space-y-6">
                    {results.posts.map(post => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onUpdate={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-600">Try adjusting your search terms.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* No search query */}
            {!searchQuery && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">Enter a search term to find people, jobs, and posts.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;