import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ className, label, error, helperText, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-10 px-4 text-[13px] text-text-primary bg-surface-card border rounded-input transition-all duration-100 ease-out outline-none placeholder:text-text-tertiary",
              error 
                ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" 
                : "border-border-default focus:border-border-active focus:ring-2 focus:ring-blue-100 hover:border-border-hover",
              leftIcon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p className={cn("text-[12px]", error ? "text-rose-500" : "text-text-tertiary")}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

AppInput.displayName = 'AppInput';
