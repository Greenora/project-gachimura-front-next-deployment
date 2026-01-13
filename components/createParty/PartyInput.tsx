'use client';

interface Props {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export default function PartyInput({ label, name, value, placeholder, onChange, className }: Props) {
  return (
    <div className={`flex items-center ${className || 'mb-10'}`}>
      <label className="w-49 font-medium text-gray-700">{label}</label>
      <input 
        type="text" 
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-700 bg-white"
      />
    </div>
  );
}