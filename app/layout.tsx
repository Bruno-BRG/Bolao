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
        { href: "/chaveamento", label: "Chaveamento", prominent: true },
        { href: "/top-4", label: "Top 4", prominent: true }
      ]
    : [{ href: "/login", label: "Entrar", prominent: true }];

  const otherLinks = [
    { href: "/ranking", label: "Ranking" },
    { href: "/chaveamento", label: "Chaveamento" },
    { href: "/comunidade", label: "Palpites da galera" }
  ];

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bolao-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}})();`
          }}
        />
      </head>
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
