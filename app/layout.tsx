import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/actions/auth.actions";
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

  return (
    <html lang="pt-BR">
      <body>
        <div className="shell">
          <header className="nav">
            <div className="nav-inner">
              <Link className="brand" href="/">
                Bolao da Copa
              </Link>
              <nav className="nav-links" aria-label="Principal">
                <Link href="/ranking">Ranking</Link>
                <Link href="/top-4">Top 4</Link>
                {user ? (
                  <>
                    <Link href="/dashboard">Painel</Link>
                    <Link href="/palpites">Palpites</Link>
                    <form action={logoutAction}>
                      <button className="link-button" type="submit">
                        Sair
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/login">Entrar</Link>
                )}
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
