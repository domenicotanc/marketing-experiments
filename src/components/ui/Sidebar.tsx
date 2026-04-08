"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar navigation — fixed on desktop, hidden on mobile.
 * Mirrors the reference design's glass-panel sidebar.
 */

const NAV_ITEMS = [
  { href: "/", label: "Experiments", icon: "science" },
  { href: "/knowledge-base", label: "Knowledge Base", icon: "menu_book" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 w-64 glass-panel rounded-2xl z-50 p-6 space-y-8">
      {/* Brand */}
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
          <span className="material-symbols-outlined">science</span>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground leading-tight">
            Marketing<br />Experiments
          </h1>
        </div>
      </div>

      {/* New Experiment button */}
      <Link
        href="/experiments/new"
        className="bg-primary text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>New Experiment</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-all ${
              isActive(item.href)
                ? "text-primary font-bold bg-primary/5 border border-primary/10"
                : "text-muted hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {item.icon}
            </span>
            <span className="font-semibold text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
