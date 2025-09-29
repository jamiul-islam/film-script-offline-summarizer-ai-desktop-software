import React, { forwardRef } from 'react';
import { cn } from '../../styles/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const inputClasses = cn('input', error && 'input-error', className);

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-200">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && (
          <p className="text-sm text-error-400 animate-slide-in-up">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
