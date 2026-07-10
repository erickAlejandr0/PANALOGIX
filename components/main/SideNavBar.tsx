"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  User,
  Plus,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/authActions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/Publicaciones", label: "Publicaciones", icon: FileText },
  { href: "/entregas", label: "Entregas", icon: ClipboardCheck },
  { href: "/Perfil", label: "Perfil", icon: User },
];

type SideNavBarProps = {
  email: string;
  displayName: string;
  open: boolean;
  
};

export function SideNavBar({ email, displayName,  open }: SideNavBarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-hidden={!open}
      className={`fixed bottom-0 left-0 top-20 z-30 flex w-[271px] flex-col justify-between overflow-hidden border-r border-[rgba(196,198,210,0.15)] bg-[#fbf9f8] py-6 transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-8 pb-8">
        <h2 className="text-xl font-bold text-[#1b1c1c]">{displayName}</h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-[1.2px] text-[#434750]">
          {email}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition ${
                    active
                      ? "bg-[#001b44] text-white"
                      : "text-[#434750] hover:bg-[rgba(0,27,68,0.05)]"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 px-4">
        <Link
          href="/Publicaciones/nuevo"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#001b44] px-4 py-4 text-base font-semibold text-white transition hover:bg-[#002f6c]"
        >
          <Plus className="size-4" />
          Nuevo Flete
        </Link>

        <div className="border-t border-[rgba(196,198,210,0.15)] pt-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-[#434750] transition hover:bg-[rgba(0,27,68,0.05)]"
            >
              <LogOut className="size-4" />
              Log Out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
