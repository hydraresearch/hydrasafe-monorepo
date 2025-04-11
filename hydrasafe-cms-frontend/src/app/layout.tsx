import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster, ToastProvider } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HydraSafe CMS',
  description: 'Content Management System for HydraSafe',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
       
          <ToastProvider>
          <AuthProvider>
            {children}
            <Toaster />
            </AuthProvider>
          </ToastProvider>
      
      </body>
    </html>
  );
}
