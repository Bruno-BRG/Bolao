import { loginAction, registerAction } from "@/actions/auth.actions";

export function AuthForms({ error }: { error?: string }) {
  return (
    <main className="container container--narrow">
      <section className="page-header">
        <div>
          <h1>Entrar no bolao</h1>
          <p className="muted">Use seu usuario e senha para comecar os palpites.</p>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <div className="auth-simple-grid">
        <section className="card auth-card">
          <h2>Ja tenho conta</h2>
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

        <section className="card auth-card">
          <h2>Criar conta</h2>
          <form className="form" action={registerAction}>
            <div className="field">
              <label htmlFor="register-username">Usuario</label>
              <input
                id="register-username"
                name="username"
                autoComplete="username"
                placeholder="seu nome"
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
      </div>
    </main>
  );
}
