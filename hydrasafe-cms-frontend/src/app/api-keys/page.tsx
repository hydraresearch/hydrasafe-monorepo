'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Copy, Key, Trash } from 'lucide-react';
import api from '@/lib/api';

interface ApiKey {
  _id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Load API keys
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api-keys');
      if (response.data.success) {
        setApiKeys(response.data.apiKeys);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post('/api-keys', { name: newKeyName });
      if (response.data.success) {
        setApiKeys([...apiKeys, response.data.apiKey]);
        setNewKeyName('');
        toast({
          title: 'Success',
          description: 'API key created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api-keys/${id}`);
      if (response.data.success) {
        setApiKeys(apiKeys.filter(key => key._id !== id));
        toast({
          title: 'Success',
          description: 'API key deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">API Keys</h1>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="API Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Button
              onClick={createApiKey}
              isLoading={isCreating}
              leftIcon={<Key size={16} />}
            >
              Generate Key
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cms-primary"></div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No API keys found. Create one to access the headless CMS API.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cms-border">
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Key</th>
                      <th className="px-4 py-3 text-left">Created</th>
                      <th className="px-4 py-3 text-left">Last Used</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey._id} className="border-b border-cms-border">
                        <td className="px-4 py-3">{apiKey.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <code className="bg-cms-background px-2 py-1 rounded text-sm font-mono">
                              {apiKey.key.substring(0, 10)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => copyToClipboard(apiKey.key)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {apiKey.lastUsed
                            ? new Date(apiKey.lastUsed).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey._id)}
                          >
                            <Trash size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Use these API keys to access your content programmatically. Include the API key in the
                request header:
              </p>
              <div className="bg-cms-background p-4 rounded-md">
                <code className="font-mono text-sm">
                  X-API-Key: your_api_key_here
                </code>
              </div>
              <h3 className="text-lg font-semibold mt-4">Endpoints</h3>
              <div className="space-y-2">
                <div>
                  <strong className="font-mono">GET /api/content</strong>
                  <p className="text-sm text-gray-500">Fetch all published content</p>
                </div>
                <div>
                  <strong className="font-mono">GET /api/content/:id</strong>
                  <p className="text-sm text-gray-500">Fetch a single content item by ID</p>
                </div>
                <div>
                  <strong className="font-mono">GET /api/content/slug/:slug</strong>
                  <p className="text-sm text-gray-500">Fetch a single content item by slug</p>
                </div>
                <div>
                  <strong className="font-mono">GET /api/content/type/:type</strong>
                  <p className="text-sm text-gray-500">Fetch content by type (page, post, product)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}