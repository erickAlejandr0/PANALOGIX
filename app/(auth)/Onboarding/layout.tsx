export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#000615] [color-scheme:dark]">
      {children}
    </div>
  );
}
