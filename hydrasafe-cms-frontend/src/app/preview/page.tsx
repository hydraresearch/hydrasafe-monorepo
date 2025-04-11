'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { contentAPI } from '@/lib/api';
import { CONTENT_TYPES } from '@/lib/constants';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface ContentItem {
  _id: string;
  title: string;
  slug: string;
  contentType: string;
  status: string;
  updatedAt: string;
}

export default function PreviewPage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load the saved website URL from localStorage or API
    const storedUrl = localStorage.getItem('preview_website_url') || '';
    setWebsiteUrl(storedUrl);
    setSavedUrl(storedUrl);
    
    // Load published content
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const response = await contentAPI.getAll({ status: 'published' });
      if (response.data.success) {
        setContent(response.data.content);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWebsiteUrl = () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('preview_website_url', websiteUrl);
    setSavedUrl(websiteUrl);
    
    // Could also save to user preferences in API
    
    setIsSaving(false);
    toast({
      title: 'Saved',
      description: 'Website URL has been saved',
    });
  };

  const getContentTypeLabel = (type: string) => {
    const contentType = CONTENT_TYPES.find(t => t.value === type);
    return contentType ? contentType.label : type;
  };

  const getPreviewUrl = (slug: string, type: string) => {
    if (!savedUrl) return '';
    
    // Construct preview URL based on content type
    let path = '';
    switch (type) {
      case 'page':
        path = `/${slug}`;
        break;
      case 'post':
        path = `/blog/${slug}`;
        break;
      case 'product':
        path = `/products/${slug}`;
        break;
      default:
        path = `/${type}/${slug}`;
    }
    
    // Ensure the base URL has a trailing slash if needed
    const baseUrl = savedUrl.endsWith('/') ? savedUrl : `${savedUrl}/`;
    
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    return `${baseUrl}${cleanPath}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Website Preview</h1>
          <Button
            onClick={fetchContent}
            leftIcon={<RefreshCw size={16} />}
          >
            Refresh Content
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configure Website URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                label="Your Website URL"
                placeholder="https://your-website.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={saveWebsiteUrl}
                isLoading={isSaving}
                className="self-end"
              >
                Save URL
              </Button>
            </div>
            {savedUrl && (
              <p className="mt-2 text-sm text-gray-400">
                Content will be previewed at: {savedUrl}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published Content</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cms-primary"></div>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No published content found. Publish content to preview it on your website.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cms-border">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Last Updated</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.map((item) => {
                      const previewUrl = getPreviewUrl(item.slug, item.contentType);
                      return (
                        <tr key={item._id} className="border-b border-cms-border">
                          <td className="px-4 py-3">{item.title}</td>
                          <td className="px-4 py-3">{getContentTypeLabel(item.contentType)}</td>
                          <td className="px-4 py-3">
                            {new Date(item.updatedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {savedUrl ? (
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-cms-primary hover:underline"
                              >
                                Preview <ExternalLink size={14} className="ml-1" />
                              </a>
                            ) : (
                              <span className="text-gray-400">Set website URL to preview</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {savedUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Website Frame Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-cms-border h-[600px]">
                <iframe
                  src={savedUrl}
                  className="w-full h-full"
                  title="Website Preview"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}