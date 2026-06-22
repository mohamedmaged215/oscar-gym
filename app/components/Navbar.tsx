"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const GYM_CONFIG = { name: "ULTRA GYM" };

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const links = [
    {
      href: "/dashboard",
      label: "الرئيسية",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: "/customers",
      label: "الاشتراكات",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      href: "/sales",
      label: "المبيعات",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      href: "/reports",
      label: "التقارير",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const allDesktopLinks = [
    { href: "/dashboard", label: "الرئيسية" },
    { href: "/customers", label: "الاشتراكات" },
    { href: "/sales", label: "المبيعات" },
    { href: "/inventory", label: "المشتريات" },
    { href: "/expenses", label: "المصاريف" },
    { href: "/treasury", label: "الخزينة" },
    { href: "/reports", label: "التقارير" },
  ];

  return (
    <>
      {/* Desktop Header Nav (sm and above) */}
      <header className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-800 tracking-wide">{GYM_CONFIG.name}</span>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-1">
              {allDesktopLinks.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                      active
                        ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (sm hidden) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-150 h-16 shadow-[0_-3px_15px_rgba(0,0,0,0.06)] flex items-center justify-around pb-safe">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center w-full h-full group py-1"
            >
              <div className="mb-1 transition-transform duration-200 active:scale-95">
                {icon(active)}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors leading-none tracking-wide ${
                  active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full group py-1"
        >
          <div className="mb-1 transition-transform duration-200 active:scale-95">
            <svg className={`w-5 h-5 transition-colors ${moreOpen ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className={`text-[10px] font-bold leading-none tracking-wide ${moreOpen ? "text-blue-600" : "text-gray-400"}`}>
            المزيد
          </span>
        </button>
      </nav>

      {/* Mobile Drawer Menu Overlay */}
      {moreOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMoreOpen(false)}
          />
          {/* Menu Drawer */}
          <div className="relative bg-white w-64 h-full shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                <span className="font-black text-gray-800 text-base">{GYM_CONFIG.name}</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { href: "/inventory", label: "المشتريات" },
                  { href: "/expenses", label: "المصاريف" },
                  { href: "/treasury", label: "الخزينة" },
                ].map(({ href, label }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-bold transition ${
                        active
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              className="w-full py-3.5 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm text-center active:scale-95 transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </>
  );
}
