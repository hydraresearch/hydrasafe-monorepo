'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  // Generate unique IDs for form elements
  const emailId = useId();
  const passwordId = useId();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };
    
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success.valueOf() === true) {
        router.push('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: 'Please check your credentials and try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#111319", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ 
        maxWidth: "400px", 
        width: "100%", 
        backgroundColor: "#1A1E24", 
        borderRadius: "8px", 
        border: "1px solid #2C2C2C", 
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "40px", 
            height: "40px", 
            backgroundColor: "#00D2FF",
            color: "#000000",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "20px",
            marginBottom: "16px"
          }}>
            H
          </div>
          <h1 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: "normal", margin: "0 0 8px 0" }}>HydraSafe CMS</h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0 }}>Content Management System</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label 
              htmlFor={emailId}
              style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }}>
                <Mail size={16} />
              </div>
              <input
                id={emailId}
                type="email"
                style={{ 
                  width: "100%", 
                  backgroundColor: "#111319", 
                  border: "1px solid #2C2C2C", 
                  borderRadius: "4px", 
                  padding: "10px 12px 10px 36px", 
                  color: "#FFFFFF",
                  fontSize: "14px"
                }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {errors.email && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.email}</p>}
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <label 
              htmlFor={passwordId}
              style={{ display: "block", color: "#FFFFFF", marginBottom: "8px" }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280" }}>
                <Lock size={16} />
              </div>
              <input
                id={passwordId}
                type="password"
                style={{ 
                  width: "100%", 
                  backgroundColor: "#111319", 
                  border: "1px solid #2C2C2C", 
                  borderRadius: "4px", 
                  padding: "10px 12px 10px 36px", 
                  color: "#FFFFFF",
                  fontSize: "14px"
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errors.password && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.password}</p>}
          </div>
          
          <button 
            type="submit" 
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
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <Link href="/auth/forgot-password" style={{ color: "#00D2FF", textDecoration: "none" }}>
              Forgot your password?
            </Link>
            <span style={{ color: "#9CA3AF" }}>
              Powered by HydraSafe
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}