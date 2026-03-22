import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className, id, onClick }: { children: React.ReactNode; className?: string; id?: string; onClick?: () => void }) => (
  <div id={id} onClick={onClick} className={cn("bg-white rounded-2xl border border-black/5 shadow-sm p-6", className)}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  id,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "border border-black/10 hover:bg-black/5",
    ghost: "hover:bg-black/5"
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, className, id, variant = 'primary' }: { children: React.ReactNode; className?: string; id?: string; variant?: 'primary' | 'outline' }) => (
  <span id={id} className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-semibold",
    variant === 'primary' ? "bg-emerald-100 text-emerald-700" : "border border-black/10 text-stone-500",
    className
  )}>
    {children}
  </span>
);
