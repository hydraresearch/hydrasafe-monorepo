'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type SetupStep = 'admin' | 'system' | 'complete';

export default function Setup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Admin user setup
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // System settings
  const [siteName, setSiteName] = useState('HydraSafe CMS');
  const [siteUrl, setSiteUrl] = useState('');
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
  const [allowRegistration, setAllowRegistration] = useState(false);
  
  const validateAdminForm = () => {
    if (!adminName || !adminEmail || !adminPassword || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(adminEmail)) {
      setError('Please enter a valid email');
      return false;
    }
    
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const validateSystemForm = () => {
    if (!siteName || !apiUrl) {
      setError('Site name and API URL are required');
      return false;
    }
    return true;
  };
  
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAdminForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log("Submitting to:", `${apiUrl}/setup/admin`);
      
      // Send admin data to the server
      const response = await axios.post(`${apiUrl}/setup/admin`, {
        name: adminName,
        email: adminEmail,
        password: adminPassword
      });
      
      console.log("Server response:", response.data);
      setCurrentStep('system');
    } catch (err: any) {
      console.error("Error creating admin:", err);
      
      if (err.message === 'Network Error') {
        setError(`Cannot connect to the server at ${apiUrl}. Please make sure the backend server is running.`);
      } else {
        setError(err.response?.data?.message || `Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSystemForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Send system settings to the server
      await axios.post(`${apiUrl}/setup/system`, {
        siteName,
        siteUrl,
        apiUrl,
        allowRegistration
      });
      
      setCurrentStep('complete');
    } catch (err: any) {
      console.error("Error saving system settings:", err);
      
      if (err.message === 'Network Error') {
        setError(`Cannot connect to the server at ${apiUrl}. Please make sure the backend server is running.`);
      } else {
        setError(err.response?.data?.message || `Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const finishSetup = () => {
    // In a real implementation, we would set a flag in localStorage
    // to indicate that setup is complete
    localStorage.setItem('setup_complete', 'true');
    router.push('/auth/login');
  };
  
  const renderAdminSetup = () => (
    <form onSubmit={handleAdminSubmit} className="space-y-4">
      <h2 style={{ fontSize: "20px", fontWeight: "normal", color: "#FFFFFF", marginBottom: "16px" }}>Create Admin User</h2>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Full Name</label>
        <input
          type="text"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          placeholder="John Doe"
          required
        />
      </div>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Email</label>
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          placeholder="admin@example.com"
          required
        />
      </div>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Password</label>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          placeholder="••••••••"
          required
        />
      </div>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          placeholder="••••••••"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        style={{ 
          width: "100%", 
          backgroundColor: "#00D2FF", 
          color: "#000000", 
          padding: "10px", 
          borderRadius: "9999px", 
          border: "none", 
          fontWeight: "500",
          fontSize: "14px",
          cursor: "pointer",
          marginTop: "24px"
        }}
      >
        {isLoading ? 'Creating...' : 'Continue to System Settings'}
      </button>
    </form>
  );
  
  const renderSystemSetup = () => (
    <form onSubmit={handleSystemSubmit} className="space-y-4">
      <h2 style={{ fontSize: "20px", fontWeight: "normal", color: "#FFFFFF", marginBottom: "16px" }}>System Settings</h2>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Site Name</label>
        <input
          type="text"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          required
        />
      </div>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>Website URL (optional)</label>
        <input
          type="url"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          placeholder="https://yourwebsite.com"
        />
      </div>
      
      <div>
        <label style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}>API URL</label>
        <input
          type="url"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={{ 
            width: "100%", 
            backgroundColor: "#111319", 
            border: "1px solid #2C2C2C", 
            borderRadius: "4px", 
            padding: "10px 12px", 
            color: "#FFFFFF",
            fontSize: "14px"
          }}
          required
        />
      </div>
      
      <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
        <input
          type="checkbox"
          id="allowRegistration"
          checked={allowRegistration}
          onChange={(e) => setAllowRegistration(e.target.checked)}
          style={{ 
            marginRight: "8px",
            width: "16px",
            height: "16px"
          }}
          aria-labelledby="allowRegistrationLabel"
        />
        <label 
          id="allowRegistrationLabel" 
          htmlFor="allowRegistration" 
          style={{ color: "#FFFFFF" }}
        >
          Allow user registration
        </label>
      </div>
      
      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button
          type="button"
          onClick={() => setCurrentStep('admin')}
          style={{ 
            flex: "1",
            backgroundColor: "transparent", 
            color: "#FFFFFF", 
            padding: "10px", 
            borderRadius: "9999px", 
            border: "1px solid #2C2C2C", 
            fontWeight: "500",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Back
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{ 
            flex: "1",
            backgroundColor: "#00D2FF", 
            color: "#000000", 
            padding: "10px", 
            borderRadius: "9999px", 
            border: "none", 
            fontWeight: "500",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          {isLoading ? 'Saving...' : 'Complete Setup'}
        </button>
      </div>
    </form>
  );
  
  const renderComplete = () => (
    <div className="text-center">
      <div style={{ 
        width: "64px", 
        height: "64px",
        borderRadius: "50%", 
        background: "rgba(0, 210, 255, 0.1)",
        color: "#00D2FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px auto"
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <h2 style={{ fontSize: "24px", fontWeight: "normal", color: "#FFFFFF", marginBottom: "16px" }}>Setup Complete!</h2>
      
      <p style={{ color: "#9CA3AF", marginBottom: "24px" }}>
        Your HydraSafe CMS has been configured successfully. You can now log in with your admin credentials.
      </p>
      
      <button
        onClick={finishSetup}
        style={{ 
          width: "100%", 
          backgroundColor: "#00D2FF", 
          color: "#000000", 
          padding: "10px", 
          borderRadius: "9999px", 
          border: "none", 
          fontWeight: "500",
          fontSize: "14px",
          cursor: "pointer"
        }}
      >
        Go to Login
      </button>
    </div>
  );
  
  return (
    <div style={{ backgroundColor: "#111319", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ 
        maxWidth: "500px", 
        width: "100%", 
        backgroundColor: "#1A1E24", 
        borderRadius: "8px", 
        border: "1px solid #2C2C2C", 
        padding: "32px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
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
            marginBottom: "16px"
          }}>
            H
          </div>
          <h1 style={{ color: "#FFFFFF", fontSize: "28px", fontWeight: "normal", margin: "0 0 8px 0" }}>HydraSafe CMS Setup</h1>
          
          {/* Progress indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
            <div style={{ 
              width: "100px", 
              height: "4px", 
              backgroundColor: currentStep === 'admin' || currentStep === 'system' || currentStep === 'complete' ? "#00D2FF" : "#2C2C2C",
              borderRadius: "2px"
            }}></div>
            <div style={{ 
              width: "100px", 
              height: "4px", 
              backgroundColor: currentStep === 'system' || currentStep === 'complete' ? "#00D2FF" : "#2C2C2C",
              borderRadius: "2px"
            }}></div>
            <div style={{ 
              width: "100px", 
              height: "4px", 
              backgroundColor: currentStep === 'complete' ? "#00D2FF" : "#2C2C2C",
              borderRadius: "2px"
            }}></div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            color: "#EF4444", 
            padding: "12px", 
            borderRadius: "4px",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        )}
        
        {/* Current step content */}
        {currentStep === 'admin' && renderAdminSetup()}
        {currentStep === 'system' && renderSystemSetup()}
        {currentStep === 'complete' && renderComplete()}
      </div>
    </div>
  );
}