'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Get the API URL from env or use default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        const response = await axios.get(`${apiUrl}/setup/status`);
        setSetupRequired(response.data.setupRequired);
      } catch (error) {
        // If we can't connect to the API, assume setup is required
        console.error('Failed to check setup status:', error);
        setSetupRequired(true);
      } finally {
        setCheckingSetup(false);
      }
    };

    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        // Check if setup is required
        checkSetupStatus();
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // While authentication is loading, show loading spinner
  if (isLoading || checkingSetup) {
    return (
      <div style={{ backgroundColor: "#111319", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: "56px", 
          height: "56px", 
          backgroundColor: "#00D2FF",
          color: "#000000",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "28px",
          animation: "pulse 2s infinite"
        }}>
          H
        </div>
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // If setup is required, redirect to setup page
  if (setupRequired) {
    router.push('/setup');
    return null;
  }

  // Otherwise redirect to login
  router.push('/auth/login');
  return null;
}