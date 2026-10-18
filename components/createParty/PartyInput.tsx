'use client';

import { forwardRef, useId } from "react";

interface Props {
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const PartyInput = forwardRef<HTMLInputElement, Props>(
  ({ label, name, value, placeholder, onChange, className, error }, ref) => {
  const inputId = useId();
  return (
    <div className={className || 'mb-6'}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-0">
        <label htmlFor={inputId} className="font-medium text-gray-700 sm:w-48 sm:shrink-0 sm:h-11 sm:flex sm:items-center">{label}</label>

        <div className="min-w-0 flex-1">
          <input
            id={inputId}
            ref={ref}
            type="text"
            name={name}
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full h-11 border rounded-lg p-3 outline-none transition-colors
              ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-700'}`}
          />

          <div className="min-h-5 mt-1">
            {error && <p id={`${inputId}-error`} className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
 }
)

PartyInput.displayName = 'PartyInput';

export default PartyInput;
