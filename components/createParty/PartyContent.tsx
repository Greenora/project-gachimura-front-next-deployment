'use client';

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

  return (
    <div className="flex mb-6">
      <label className="w-48 font-medium text-gray-700 h-10 flex items-center">{label}</label>
      <div className="flex-1">
        <div className="relative">
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`w-full h-36 border rounded-lg p-4 resize-none bg-white text-sm outline-none transition-colors
              ${error ? 'border-red-500' : 'border border-gray-300 focus:border-green-700'}`}
          />
          <div className="absolute bottom-3 right-4 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        </div>

        <div className="min-h-5 mt-1">
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}