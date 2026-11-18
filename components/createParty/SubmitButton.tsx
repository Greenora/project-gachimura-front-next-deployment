'use client';

export default function SubmitButton({ text, disabled }: { text: string; disabled?: boolean }) {
  return (
    <button 
      type="submit"
      disabled={disabled}
      className="w-full bg-[#2D5A27] text-white py-4 rounded-full font-bold text-lg hover:bg-[#23471f] transition-colors mt-8 disabled:opacity-50"
    >
      {text}
    </button>
  );
}
