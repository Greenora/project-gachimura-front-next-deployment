'use client';

import { forwardRef } from "react";

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
  return (
    <div className={className || 'mb-6'}>
      <div className="flex items-start">
        <label className="w-48 font-medium text-gray-700 h-10 flex items-center">{label}</label>

        <div className="flex-1">
          <input 
            ref={ref}
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full h-10 border rounded-lg p-3 outline-none transition-colors"
              ${error ? 'border-red-500' : 'border-gray-300 focus:border-green-700'}`}
          />

          <div className="min-h-5 mt-1">
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
 }
)

PartyInput.displayName = 'PartyInput';

export default PartyInput;