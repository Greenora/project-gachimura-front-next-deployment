'use client';

import { useId } from "react";

interface Props {
  label: string;
  name?: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function PartyContent({ label, name, value, placeholder, onChange, error }: Props) {
  const maxLength = 200;
  const inputId = useId();

  return (
    <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:gap-0">
      <label htmlFor={inputId} className="font-medium text-gray-700 sm:w-48 sm:shrink-0 sm:h-11 sm:flex sm:items-center">{label}</label>
      <div className="min-w-0 flex-1">
        <div className="relative">
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full h-36 border rounded-lg p-4 pb-8 resize-none bg-white text-base sm:text-sm outline-none transition-colors
              ${error ? 'border-red-500' : 'border border-gray-300 focus:border-green-700'}`}
          />
          <div className="absolute bottom-3 right-4 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        </div>

        <div className="min-h-5 mt-1">
          {error && <p id={`${inputId}-error`} className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
