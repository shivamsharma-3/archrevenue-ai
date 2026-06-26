import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface AppButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

export function AppButton({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: AppButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-100 ease-out rounded-button focus:outline-none focus-visible:ring-2 focus-visible:ring-border-active focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-text-inverse shadow-sm hover:shadow-md",
    secondary: "bg-surface-secondary hover:bg-surface-hover text-text-primary border border-border-default hover:border-border-hover shadow-sm",
    ghost: "bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300"
  };

  const sizes = {
    sm: "h-8 px-3 text-[12px]",
    md: "h-10 px-4 text-[13px]",
    lg: "h-12 px-6 text-[14px]"
  };

  return (
    <button
      type={props.type || 'button'}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
      {!isLoading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
    </button>
  );
}
