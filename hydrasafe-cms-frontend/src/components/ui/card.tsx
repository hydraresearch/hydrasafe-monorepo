'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  children: ReactNode;
}

export const Card = ({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) => {
  const baseStyles = "card-mercedes rounded-lg overflow-hidden";
  
  const variants = {
    default: "border border-cms-border",
    elevated: "border border-cms-border shadow-mercedes",
    bordered: "border-2 border-cms-border",
    flat: "bg-transparent",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export const CardHeader = ({ className, children, ...props }: CardHeaderProps) => {
  return (
    <div className={cn("px-6 py-5 border-b border-cms-border", className)} {...props}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export const CardTitle = ({ className, children, ...props }: CardTitleProps) => {
  return (
    <h3 className={cn("text-xl font-semibold text-cms-text", className)} {...props}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  className?: string;
  children: ReactNode;
}

export const CardDescription = ({ className, children, ...props }: CardDescriptionProps) => {
  return (
    <p className={cn("mt-1 text-sm text-cms-text-muted", className)} {...props}>
      {children}
    </p>
  );
};

interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export const CardContent = ({ className, children, ...props }: CardContentProps) => {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

export const CardFooter = ({ className, children, ...props }: CardFooterProps) => {
  return (
    <div 
      className={cn("px-6 py-4 border-t border-cms-border", className)} 
      {...props}
    >
      {children}
    </div>
  );
};