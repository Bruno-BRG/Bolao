"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  href: string;
  label: string;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

export function SidebarNav({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => (
        <div key={section.label} className="sidebar-section">
          <span className="sidebar-label">{section.label}</span>
          <nav className="sidebar-nav" aria-label={section.label}>
            {section.items.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </>
  );
}
