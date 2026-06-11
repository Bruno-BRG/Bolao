"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  href: string;
  label: string;
  prominent?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

export function SidebarNav({
  sections,
  onNavigate
}: {
  sections: SidebarSection[];
  onNavigate?: () => void;
}) {
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
                  className={`sidebar-link ${link.prominent ? "sidebar-link--prominent" : ""} ${
                    isActive ? "active" : ""
                  }`}
                  href={link.href}
                  onClick={onNavigate}
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
