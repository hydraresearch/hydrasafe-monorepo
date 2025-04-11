'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('cms_token');
    
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        // Invalid token
        handleLogout();
      }
    } catch (error) {
      // Token validation failed
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success && response.data.user.token) {
        // Save token and user data
        localStorage.setItem('cms_token', JSON.stringify(response.data.user.token));
        setToken(JSON.stringify(response.data.user.token));
        setUser(response.data.user);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.data.user.name}!`,
        });
        
        return true;
      } 
      if (!response.data.success) {
        toast({
          title: "Login failed",
          description: response.data.message,
          variant: "destructive",
        });
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(name, email, password);
      
      if (response.data.success && response.data.token) {
        // Save token and user data
        localStorage.setItem('cms_token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created.",
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cms_token');
    setToken(null);
    setUser(null);
  };

  const logout = () => {
    handleLogout();
    router.push('/auth/login');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.updateProfile(userData);
      
      if (response.data.success && response.data.user) {
        // Update user data
        setUser(response.data.user);
        
        // Update token if provided
        if (response.data.token) {
          localStorage.setItem('cms_token', response.data.token);
          setToken(response.data.token);
        }
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}