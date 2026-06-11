import { loginAction, registerAction } from "@/actions/auth.actions";

export function AuthForms({ error }: { error?: string }) {
  return (
    <main className="container">
      <section className="login-shell">
        <div className="auth-intro">
          <span className="eyebrow">Bolao da Copa</span>
          <h1>Entre para jogar com leitura clara, ranking forte e palpite rapido.</h1>
          <p className="muted">
            A mesma plataforma concentra os jogos oficiais, o Top 4 e a corrida
            geral de pontos. Entre com sua conta ou crie uma agora.
          </p>
          <div className="glass-list">
            <article>
              <h3>Bloqueio automatico</h3>
              <p>Os palpites fecham no horario exato de cada jogo.</p>
            </article>
            <article>
              <h3>Ranking consolidado</h3>
              <p>Placares exatos, resultados certos e Top 4 entram na mesma conta.</p>
            </article>
          </div>
        </div>

        <div className="auth-stack">
          <section className="auth-card">
            <div>
              <span className="eyebrow">Acessar conta</span>
              <h2>Entrar</h2>
            </div>
            <form className="form" action={loginAction}>
              <div className="field">
                <label htmlFor="login-username">Usuario</label>
                <input id="login-username" name="username" autoComplete="username" />
              </div>
              <div className="field">
                <label htmlFor="login-password">Senha</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>
              <button className="button" type="submit">
                Entrar
              </button>
            </form>
          </section>

          <section className="auth-card">
            <div>
              <span className="eyebrow">Primeira vez</span>
              <h2>Criar usuario</h2>
            </div>
            <form className="form" action={registerAction}>
              <div className="field">
                <label htmlFor="register-username">Usuario</label>
                <input
                  id="register-username"
                  name="username"
                  autoComplete="username"
                  placeholder="bruno"
                />
              </div>
              <div className="field">
                <label htmlFor="register-password">Senha</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <button className="button secondary" type="submit">
                Criar e entrar
              </button>
            </form>
          </section>

          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
