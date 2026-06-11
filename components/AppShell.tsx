"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { SidebarNav } from "@/components/SidebarNav";

type NavItem = {
  href: string;
  label: string;
  prominent?: boolean;
};

type AppShellProps = {
  homeHref: string;
  mainLinks: NavItem[];
  otherLinks: NavItem[];
  username?: string;
  children: React.ReactNode;
};

export function AppShell({
  homeHref,
  mainLinks,
  otherLinks,
  username,
  children
}: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className={`app-shell ${menuOpen ? "app-shell--menu-open" : ""}`}>
      {menuOpen ? (
        <button
          aria-label="Fechar menu"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      ) : null}

      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-header">
            <Link className="sidebar-brand" href={homeHref} onClick={() => setMenuOpen(false)}>
              <span className="brand-mark">26</span>
              <span>
                <strong>Bolao da Copa</strong>
                <small>Copa 2026</small>
              </span>
            </Link>
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              className="sidebar-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? "Fechar" : "Menu"}
            </button>
          </div>

          <div className="sidebar-collapsible">
            <SidebarNav
              onNavigate={() => setMenuOpen(false)}
              sections={[
                { label: "Principal", items: mainLinks },
                { label: "Ver tambem", items: otherLinks }
              ]}
            />

            <div className="sidebar-footer">
              {username ? (
                <div className="sidebar-user">
                  <div>
                    <strong>{username}</strong>
                  </div>
                  <form action={logoutAction}>
                    <button className="button secondary small" type="submit">
                      Sair
                    </button>
                  </form>
                </div>
              ) : (
                <Link className="button" href="/login" onClick={() => setMenuOpen(false)}>
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="content-shell">
        <div className="content-main">{children}</div>
      </div>
    </div>
  );
}
