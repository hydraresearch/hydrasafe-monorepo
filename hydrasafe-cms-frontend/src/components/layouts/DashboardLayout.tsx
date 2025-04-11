'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  Settings,
  LogOut,
  Key,
  Globe,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111319]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D2FF]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Content', href: '/content', icon: FileText },
    { name: 'Media', href: '/media', icon: Image },
    { name: 'API Keys', href: '/api-keys', icon: Key },
    { name: 'Website Preview', href: '/preview', icon: Globe },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || user?.role === 'admin'
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-[#111319] text-white overflow-hidden">
      {/* Sidebar backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={toggleMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-[#1A1E24] border-r border-[#2C2C2C] transition-transform duration-300 md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          !isSidebarOpen && "md:w-20"
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2C2C2C]">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-[#00D2FF] rounded flex items-center justify-center text-black font-bold">
              H
            </div>
            {isSidebarOpen && (
              <span className="ml-3 font-medium text-white">HydraSafe CMS</span>
            )}
          </div>
          
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white md:block hidden"
          >
            <Menu size={20} />
          </button>
          
          <button
            onClick={toggleMobileSidebar} 
            className="text-gray-400 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar content */}
        <div className="overflow-y-auto h-full py-4">
          <nav className="px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                    isActive 
                      ? "bg-[#00D2FF]/10 text-[#00D2FF]" 
                      : "text-gray-300 hover:bg-[#2C2C2C] hover:text-white"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-[#00D2FF]" : "text-gray-400"
                    )}
                    size={20} 
                  />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2C2C2C]">
          <button
            onClick={logout}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#2C2C2C] hover:text-white rounded-md w-full"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        isSidebarOpen ? "md:ml-64" : "md:ml-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#1A1E24] border-b border-[#2C2C2C]">
          <div className="h-16 px-4 flex items-center justify-between">
            <button 
              className="md:hidden text-gray-400 hover:text-white"
              onClick={toggleMobileSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#00D2FF]"></span>
              </button>
              
              <div className="flex items-center">
                <span className="hidden md:block mr-3 text-sm text-gray-300">
                  {user?.name}
                </span>
                <div className="h-8 w-8 bg-[#00D2FF] rounded-full flex items-center justify-center text-black font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area with container */}
        <main className="flex-1 overflow-auto bg-[#111319]">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-[#1A1E24] border-t border-[#2C2C2C] py-4 text-center text-gray-400 text-sm">
          <div className="container mx-auto px-4">
            HydraSafe CMS v1.0 — © {new Date().getFullYear()}
          </div>
        </footer>
      </div>
    </div>
  );
}