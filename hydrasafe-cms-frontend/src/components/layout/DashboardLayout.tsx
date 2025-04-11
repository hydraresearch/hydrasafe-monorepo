'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/logo';
import { 
  LayoutGrid, 
  FileText, 
  Image, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  href, 
  icon, 
  label, 
  isActive,
  onClick 
}) => {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-brand bg-opacity-20 text-brand' 
          : 'text-gray-400 hover:text-white hover:bg-cms-surface'
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const navLinks = [
    {
      href: '/dashboard',
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      isActive: pathname === '/dashboard'
    },
    {
      href: '/content',
      icon: <FileText size={20} />,
      label: 'Content',
      isActive: pathname.startsWith('/content')
    },
    {
      href: '/media',
      icon: <Image size={20} />,
      label: 'Media',
      isActive: pathname.startsWith('/media')
    },
    ...(user.role === 'admin' ? [
      {
        href: '/users',
        icon: <Users size={20} />,
        label: 'Users',
        isActive: pathname.startsWith('/users')
      }
    ] : []),
    {
      href: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings',
      isActive: pathname.startsWith('/settings')
    }
  ];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-mercedes-gradient">
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-cms-border">
        <Logo withText />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-cms-surface"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex h-screen pt-0 lg:pt-0">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-cms-border">
          <div className="p-6">
            <Logo withText />
          </div>
          
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={link.isActive}
              />
            ))}
          </div>
          
          <div className="p-4 border-t border-cms-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cms-surface flex items-center justify-center text-white font-medium uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="ml-auto p-2 rounded-md text-gray-400 hover:text-white hover:bg-cms-surface"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-70">
            <div className="fixed inset-y-0 left-0 w-64 bg-mercedes-gradient border-r border-cms-border">
              <div className="p-6 border-b border-cms-border flex items-center justify-between">
                <Logo withText />
                <button onClick={closeMobileMenu} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="px-3 py-4 space-y-1 overflow-y-auto">
                {navLinks.map((link) => (
                  <SidebarLink
                    key={link.href}
                    href={link.href}
                    icon={link.icon}
                    label={link.label}
                    isActive={link.isActive}
                    onClick={closeMobileMenu}
                  />
                ))}
              </div>
              
              <div className="p-4 border-t border-cms-border">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cms-surface flex items-center justify-center text-white font-medium uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-auto p-2 rounded-md text-gray-400 hover:text-white hover:bg-cms-surface"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
