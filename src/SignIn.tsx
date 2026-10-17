import { useState, type FormEvent } from 'react';
import { ApiError, login } from './api';
import { Footer } from './Footer';
import { Logo } from './Logo';
import { Deco, Rip } from './Paint';
import type { Session } from './types';

type Props = {
  onEnter: (session: Session) => void;
};

export function SignIn({ onEnter }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      onEnter(await login(email, password));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The floor could not be reached.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="nav">
        <div className="wrap nav__in">
          <Logo />
          <p className="who">Front desk</p>
        </div>
      </header>
      <div className="hero dark">
        <Deco name="leaf" style={{ left: -40, top: -10, width: 230, height: 230, transform: 'rotate(-8deg)' }} />
        <Deco name="orange" hideOnSmall style={{ left: '30%', top: 24, width: 84, height: 84 }} />
        <Deco name="tomato" style={{ right: '3%', top: 18, width: 110, height: 110 }} />
        <Deco name="beet" hideOnSmall style={{ left: '4%', bottom: 70, width: 84, height: 100 }} />
        <Deco name="kettle" hideOnSmall style={{ right: '14%', bottom: 64, width: 104, height: 104 }} />
        <div className="wrap hero__in">
          <h1>Open the floor</h1>
          <p className="hero__sub">Check a member in, and keep the people whose plans end this week in sight.</p>
        </div>
        <Rip edge="bottom" />
      </div>
      <main className="section">
        <div className="wrap welcome">
          <div>
            <h2 className="h2">Welcome to the desk</h2>
            <p className="lede">
              Sign in with your staff account to search members and check them in at the door. Members can sign in to
              check themselves in.
            </p>
            <ul className="facts">
              <li>Check-ins in one tap</li>
              <li>Plans ending this week</li>
              <li>Staff and member access</li>
            </ul>
          </div>
          <form className="card" onSubmit={submit}>
            <h2>Sign in</h2>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn--primary" type="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Enter the floor'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
