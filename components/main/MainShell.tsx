"use client";

import { useState } from "react";
import { SideNavBar } from "@/components/main/SideNavBar";
import { TopNavBar } from "@/components/main/TopNavBar";
import { EmpresaRealtimeProvider } from "@/components/realtime/EmpresaRealtimeProvider";
import { EmpresaTripNotifications } from "@/components/realtime/EmpresaTripNotifications";

type MainShellProps = {
  children: React.ReactNode;
  email: string;
  displayName: string;
  empresaId?: number | null;
};

export function MainShell({
  children,
  email,
  displayName,
  empresaId = null,
}: MainShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <EmpresaRealtimeProvider empresaId={empresaId}>
      <EmpresaTripNotifications />
      <div className="min-h-screen bg-[#f8f9ff] text-[#121c27]">
        <TopNavBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <SideNavBar
          email={email}
          displayName={displayName}
          open={sidebarOpen}
        />
        <main
          className={`min-h-screen pt-20 transition-[margin] duration-300 ease-in-out ${
            sidebarOpen ? "ml-[271px]" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </EmpresaRealtimeProvider>
  );
}
