'use client';

export default function SubmitButton({ text }: { text: string }) {
  return (
    <button 
      type="submit"
      className="w-full bg-[#2D5A27] text-white py-4 rounded-full font-bold text-lg hover:bg-[#23471f] transition-colors mt-8"
    >
      {text}
    </button>
  );
}