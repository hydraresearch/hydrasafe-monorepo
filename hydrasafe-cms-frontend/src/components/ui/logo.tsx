'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  withText?: boolean;
  textOnly?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, withText = false, textOnly = false }) => {
  return (
    <Link href="/" className="flex items-center group">
      {!textOnly && (
        <div 
          style={{ width: size, height: size }} 
          className="relative flex items-center justify-center rounded-md bg-brand text-black shadow-mercedes-glow"
        >
          <span className="font-bold" style={{ fontSize: size * 0.5 }}>
            H
          </span>
        </div>
      )}
      
      {(withText || textOnly) && (
        <div className={`font-semibold ${!textOnly ? 'ml-2' : ''}`}>
          <span className="text-brand">Hydra</span>
          <span className="text-cms-text">Safe CMS</span>
        </div>
      )}
    </Link>
  );
};

export default Logo;