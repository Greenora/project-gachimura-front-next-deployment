export default function TitleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Title placeholder */}
      <header className="p-4 border-b font-bold text-center">
        Page Title
      </header>
      {children}
    </div>
  );
}
