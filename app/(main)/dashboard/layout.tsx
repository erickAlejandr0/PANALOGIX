export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f8fafc] [color-scheme:light]">
      {children}
    </div>
  );
}
