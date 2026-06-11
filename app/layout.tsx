import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/actions/auth.actions";
import { SidebarNav } from "@/components/SidebarNav";
import { getCurrentUser } from "@/services/auth.service";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao da Copa",
  description: "Palpites e Top 4 da Copa do Mundo."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const homeHref = user ? "/palpites" : "/login";

  const mainLinks = user
    ? [
        { href: "/palpites", label: "Meus palpites", prominent: true },
        { href: "/top-4", label: "Top 4", prominent: true }
      ]
    : [{ href: "/login", label: "Entrar", prominent: true }];

  const otherLinks = [
    { href: "/ranking", label: "Ranking" },
    { href: "/comunidade", label: "Palpites da galera" },
    { href: "/selecoes", label: "Grupos" },
    { href: "/chaveamento", label: "Chaveamento" }
  ];

  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-panel">
              <Link className="sidebar-brand" href={homeHref}>
                <span className="brand-mark">26</span>
                <span>
                  <strong>Bolao da Copa</strong>
                  <small>Copa 2026</small>
                </span>
              </Link>

              <SidebarNav
                sections={[
                  { label: "Principal", items: mainLinks },
                  { label: "Ver tambem", items: otherLinks }
                ]}
              />

              <div className="sidebar-footer">
                {user ? (
                  <div className="sidebar-user">
                    <div>
                      <strong>{user.username}</strong>
                    </div>
                    <form action={logoutAction}>
                      <button className="button secondary small" type="submit">
                        Sair
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link className="button" href="/login">
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </aside>

          <div className="content-shell">
            <div className="content-main">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
