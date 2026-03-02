import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  icon?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  icon = false,
  disabled = false
}) => {
  const baseStyles = "w-full py-4 rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:border-primary/50",
    ghost: "bg-transparent text-primary hover:bg-primary/5"
  };

  return (
    <button 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
      {icon && <ArrowRight className="w-5 h-5" />}
    </button>
  );
};