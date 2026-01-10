'use client';

interface Props {
  label: string;
  name?: string;
  placeholder?: string;
  className?: string;
}

export default function PartyInput({ label, name, placeholder, className }: Props) {
  return (
    <div className={`flex items-center ${className || 'mb-10'}`}>
      <label className="w-49 font-medium text-gray-700">{label}</label>
      <input 
        type="text" 
        name={name}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-700 bg-white"
      />
    </div>
  );
}