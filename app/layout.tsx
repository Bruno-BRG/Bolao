import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
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
    { href: "/comunidade", label: "Palpites da galera" }
  ];

  return (
    <html lang="pt-BR">
      <body>
        <AppShell
          homeHref={homeHref}
          mainLinks={mainLinks}
          otherLinks={otherLinks}
          username={user?.username}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
