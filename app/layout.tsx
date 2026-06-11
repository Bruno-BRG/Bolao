import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/actions/auth.actions";
import { SidebarNav } from "@/components/SidebarNav";
import { getCurrentUser } from "@/services/auth.service";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolao da Copa",
  description: "Palpites, Top 4 e ranking do bolao da Copa."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const publicLinks = [
    { href: "/", label: "Visao geral" },
    { href: "/ranking", label: "Ranking" },
    { href: "/comunidade", label: "Palpites da galera" },
    { href: "/selecoes", label: "Selecoes e grupos" },
    { href: "/chaveamento", label: "Chaveamento" }
  ];
  const playerLinks = user
    ? [
        { href: "/dashboard", label: "Painel" },
        { href: "/palpites", label: "Meus palpites" },
        { href: "/top-4", label: "Top 4" }
      ]
    : [{ href: "/login", label: "Entrar" }];

  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-panel">
              <Link className="sidebar-brand" href="/">
                <span className="brand-mark">26</span>
                <span>
                  <strong>Bolao da Copa</strong>
                  <small>World Cup board</small>
                </span>
              </Link>
              <p className="sidebar-copy">
                Palpites por jogo, Top 4 valendo mais pontos e ranking geral em
                tempo real.
              </p>

              <SidebarNav
                sections={[
                  { label: "Acompanhar", items: publicLinks },
                  { label: "Jogar", items: playerLinks }
                ]}
              />

              <div className="sidebar-footer">
                {user ? (
                  <div className="sidebar-user">
                    <div>
                      <span className="eyebrow">Conta ativa</span>
                      <strong>{user.username}</strong>
                    </div>
                    <form action={logoutAction}>
                      <button className="button ghost small" type="submit">
                        Sair
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="sidebar-user">
                    <div>
                      <span className="eyebrow">Pronto para entrar</span>
                      <strong>Monte seus palpites</strong>
                    </div>
                    <Link className="button small" href="/login">
                      Entrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="content-shell">
            <header className="topbar">
              <div>
                <span className="eyebrow">Copa do Mundo 2026</span>
                <strong>{user ? `Ola, ${user.username}` : "Ranking, jogos e Top 4"}</strong>
              </div>
              <div className="topbar-actions">
                <span className="status-pill">Feed dinamico</span>
                {user ? (
                  <Link className="button secondary small" href="/palpites">
                    Ver meus jogos
                  </Link>
                ) : (
                  <Link className="button small" href="/login">
                    Entrar
                  </Link>
                )}
              </div>
            </header>
            <div className="content-main">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
