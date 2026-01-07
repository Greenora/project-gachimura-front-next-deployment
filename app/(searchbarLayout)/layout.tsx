export default function SearchbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Searchbar placeholder */}
      <header className="p-4 border-b">
        <div className="w-full h-10 bg-slate-100 rounded-lg animate-pulse" />
      </header>
      {children}
    </div>
  );
}
