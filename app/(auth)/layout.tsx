export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] [color-scheme:light]">
      {children}
    </div>
  );
}
