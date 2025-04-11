'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileText, Image, Users, Globe, ExternalLink, LineChart, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface DashboardStats {
  contentCount: number;
  mediaCount: number;
  userCount: number;
  recentContent: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    contentCount: 0,
    mediaCount: 0,
    userCount: 0,
    recentContent: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    // Get website URL from localStorage
    const storedUrl = localStorage.getItem('preview_website_url') || '';
    setWebsiteUrl(storedUrl);
    
    // For demo, simulate loading stats
    setTimeout(() => {
      setStats({
        contentCount: 12,
        mediaCount: 34,
        userCount: 3,
        recentContent: [
          {
            _id: '1',
            title: 'Home Page',
            contentType: 'page',
            status: 'published',
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'About Us',
            contentType: 'page',
            status: 'published',
            updatedAt: new Date().toISOString()
          },
          {
            _id: '3',
            title: 'Product Launch Announcement',
            contentType: 'post',
            status: 'draft',
            updatedAt: new Date().toISOString()
          },
          {
            _id: '4',
            title: 'Contact Form',
            contentType: 'page',
            status: 'published',
            updatedAt: new Date().toISOString()
          }
        ]
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  const StatCard = ({ title, count, icon, color, linkText, linkUrl }: any) => (
    <div className="stats-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-light text-white">{count}</h3>
          <p className="text-gray-400 text-sm">{title}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          {icon}
        </div>
      </div>
      <Link href={linkUrl} className="inline-flex items-center text-sm text-brand hover:text-brand-light">
        {linkText} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <Card className="card-mercedes">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-light text-white">
              Welcome back, {user?.name}
            </h2>
            <p className="text-gray-400 mt-1 text-base">
              Manage your website content with HydraSafe CMS
            </p>
          </div>
          
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mercedes-ghost mt-4 md:mt-0 flex items-center text-sm"
            >
              Visit your website <ExternalLink size={16} className="ml-2" />
            </a>
          )}
        </div>
      </Card>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Content Pages" 
          count={isLoading ? '...' : stats.contentCount}
          icon={<FileText size={24} className="text-brand" />}
          color="bg-brand/10"
          linkText="Manage content"
          linkUrl="/content"
        />
        
        <StatCard 
          title="Media Files" 
          count={isLoading ? '...' : stats.mediaCount}
          icon={<Image size={24} className="text-blue-400" />}
          color="bg-blue-400/10"
          linkText="Manage media"
          linkUrl="/media"
        />
        
        <StatCard 
          title="API Access" 
          count="Enabled"
          icon={<Globe size={24} className="text-green-400" />}
          color="bg-green-400/10"
          linkText="Manage API keys"
          linkUrl="/api-keys"
        />
        
        <StatCard 
          title="Analytics" 
          count="View Report"
          icon={<LineChart size={24} className="text-purple-400" />}
          color="bg-purple-400/10"
          linkText="View details"
          linkUrl="/dashboard"
        />
      </div>
      
      {/* Recent content */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-light text-white">Recent Content</h3>
          <Link href="/content" className="text-brand hover:text-brand-light text-sm">
            View all
          </Link>
        </div>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : stats.recentContent.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-base">
            No content created yet. Start creating content to see it here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-sm">Title</th>
                  <th className="text-sm">Type</th>
                  <th className="text-sm">Status</th>
                  <th className="text-sm">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentContent.map((item: any) => (
                  <tr key={item._id}>
                    <td>
                      <Link href={`/content/${item._id}`} className="text-brand hover:text-brand-light text-base">
                        {item.title}
                      </Link>
                    </td>
                    <td className="capitalize text-base">{item.contentType}</td>
                    <td>
                      <span className={`status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {new Date(item.updatedAt).toLocaleDateString()} at {new Date(item.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Headless CMS Information */}
      <div className="card-mercedes">
        <h3 className="text-xl font-light text-white mb-4 flex items-center">
          <Info size={20} className="mr-2 text-brand" />
          Headless CMS Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="glass-card p-4">
            <h4 className="text-lg font-medium text-white mb-2">API Access</h4>
            <p className="text-gray-400 text-base mb-3">
              Generate API keys to access your content programmatically from any frontend application.
            </p>
            <Link href="/api-keys" className="text-brand hover:text-brand-light text-sm flex items-center">
              Manage API Keys <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="glass-card p-4">
            <h4 className="text-lg font-medium text-white mb-2">Website Preview</h4>
            <p className="text-gray-400 text-base mb-3">
              Preview your content directly on your website before publishing.
            </p>
            <Link href="/preview" className="text-brand hover:text-brand-light text-sm flex items-center">
              Website Preview <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}