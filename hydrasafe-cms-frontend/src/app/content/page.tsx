'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Filter, Trash2, Edit, Eye } from 'lucide-react';

interface Content {
  _id: string;
  title: string;
  slug: string;
  contentType: 'page' | 'post' | 'product';
  status: 'draft' | 'published' | 'archived';
  author: {
    _id: string;
    name: string;
  };
  updatedAt: string;
}

interface ContentListResponse {
  success: boolean;
  data: Content[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export default function ContentList() {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { token, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchContents = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would fetch from your API
      // This is mock data for demonstration
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockData: ContentListResponse = {
        success: true,
        data: [
          {
            _id: '1',
            title: 'Welcome to HydraSafe',
            slug: 'welcome-to-hydrasafe',
            contentType: 'page',
            status: 'published',
            author: {
              _id: '101',
              name: 'John Doe'
            },
            updatedAt: '2025-04-10T10:30:00.000Z'
          },
          {
            _id: '2',
            title: 'HydraSafe Security Features',
            slug: 'hydrasafe-security-features',
            contentType: 'post',
            status: 'published',
            author: {
              _id: '101',
              name: 'John Doe'
            },
            updatedAt: '2025-04-09T15:45:00.000Z'
          },
          {
            _id: '3',
            title: 'Upcoming Product Release',
            slug: 'upcoming-product-release',
            contentType: 'post',
            status: 'draft',
            author: {
              _id: '102',
              name: 'Jane Smith'
            },
            updatedAt: '2025-04-08T08:20:00.000Z'
          },
          {
            _id: '4',
            title: 'HydraCurve Explainer',
            slug: 'hydracurve-explainer',
            contentType: 'page',
            status: 'published',
            author: {
              _id: '101',
              name: 'John Doe'
            },
            updatedAt: '2025-04-07T14:10:00.000Z'
          },
          {
            _id: '5',
            title: 'Security Best Practices',
            slug: 'security-best-practices',
            contentType: 'post',
            status: 'draft',
            author: {
              _id: '102',
              name: 'Jane Smith'
            },
            updatedAt: '2025-04-06T11:05:00.000Z'
          },
          {
            _id: '6',
            title: 'HydraSafe Pro Edition',
            slug: 'hydrasafe-pro-edition',
            contentType: 'product',
            status: 'published',
            author: {
              _id: '103',
              name: 'Alex Johnson'
            },
            updatedAt: '2025-04-05T09:15:00.000Z'
          },
          {
            _id: '7',
            title: 'Comparison with Competitors',
            slug: 'comparison-with-competitors',
            contentType: 'page',
            status: 'archived',
            author: {
              _id: '101',
              name: 'John Doe'
            },
            updatedAt: '2025-04-04T16:30:00.000Z'
          }
        ],
        total: 7,
        totalPages: 1,
        currentPage: 1
      };
      
      let filteredData = [...mockData.data];
      
      // Apply filters if any
      if (searchQuery) {
        filteredData = filteredData.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.slug.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (contentTypeFilter) {
        filteredData = filteredData.filter(item => 
          item.contentType === contentTypeFilter
        );
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter(item => 
          item.status === statusFilter
        );
      }
      
      setContents(filteredData);
      setTotalPages(Math.ceil(filteredData.length / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContents();
  }, [token, searchQuery, contentTypeFilter, statusFilter, currentPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        // In a real app, you would call your API
        // await axios.delete(`${process.env.API_URL}/content/${id}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        // Simulate successful deletion
        setContents(prevContents => prevContents.filter(content => content._id !== id));
        
        toast({
          title: 'Success',
          description: 'Content deleted successfully',
          variant: 'success'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete content',
          variant: 'destructive'
        });
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const isEditor = user && (user.role === 'admin' || user.role === 'editor');

  return (
    <DashboardLayout>
      <div className="cms-container">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cms-text">Content</h1>
            <p className="text-gray-400">Manage your website content</p>
          </div>
          
          {isEditor && (
            <Button 
              onClick={() => router.push('/content/new')}
              className="mt-4 md:mt-0"
              leftIcon={<Plus size={16} />}
            >
              New Content
            </Button>
          )}
        </header>
        
        <div className="bg-cms-surface border border-cms-border rounded-lg mb-8">
          <div className="p-4 border-b border-cms-border flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search content..."
                className="block w-full pl-10 pr-3 py-2 border border-cms-border rounded-md shadow-sm bg-mercedes-carbon text-cms-text focus:outline-none focus:ring-brand focus:border-brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-3 py-2 border border-cms-border rounded-md shadow-sm bg-mercedes-carbon text-cms-text focus:outline-none focus:ring-brand focus:border-brand"
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="page">Page</option>
                <option value="post">Post</option>
                <option value="product">Product</option>
              </select>
              
              <select
                className="px-3 py-2 border border-cms-border rounded-md shadow-sm bg-mercedes-carbon text-cms-text focus:outline-none focus:ring-brand focus:border-brand"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
          ) : contents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No content found</p>
              {isEditor && (
                <Button 
                  variant="primary" 
                  className="mt-4"
                  onClick={() => router.push('/content/new')}
                  leftIcon={<Plus size={16} />}
                >
                  Create Content
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-cms-secondary">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cms-border">
                  {contents.map((content) => (
                    <tr key={content._id} className="hover:bg-cms-secondary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{content.title}</div>
                        <div className="text-xs text-gray-400">{content.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-white capitalize">
                          {content.contentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${content.status === 'published' 
                            ? 'bg-green-900 text-green-300' 
                            : content.status === 'draft' 
                              ? 'bg-yellow-900 text-yellow-300' 
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {content.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {content.author.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(content.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-cms-surface"
                            onClick={() => router.push(`/content/preview/${content._id}`)}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {isEditor && (
                            <>
                              <button 
                                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-cms-surface"
                                onClick={() => router.push(`/content/edit/${content._id}`)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              
                              <button 
                                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-cms-surface"
                                onClick={() => handleDelete(content._id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-cms-border">
              <div>
                <p className="text-sm text-gray-400">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
