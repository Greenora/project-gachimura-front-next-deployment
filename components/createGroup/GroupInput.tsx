'use client';

interface Props {
  label: string;
  name: string;
  placeholder?: string;
}

export default function GroupInput({ label, name, placeholder }: Props) {
  return (
    <div className="flex items-center mb-10">
      <label className="w-50 font-medium text-gray-700">{label}</label>
      <input 
        type="text" 
        name={name}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-700 bg-white"
      />
    </div>
  );
}