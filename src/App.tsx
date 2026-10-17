import { useEffect, useState } from 'react';
import { clearTokens, me, readTokens, writeTokens } from './api';
import { Floor } from './Floor';
import { PaintDefs } from './Paint';
import { SignIn } from './SignIn';
import type { Session } from './types';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(readTokens().access !== null);

  useEffect(() => {
    if (!readTokens().access) return;
    let cancelled = false;
    me()
      .then((profile) => {
        if (cancelled) return;
        const tokens = readTokens();
        setSession({
          accessToken: tokens.access ?? '',
          refreshToken: tokens.refresh ?? '',
          expiresIn: '',
          user: profile.user,
          member: profile.member,
        });
      })
      .catch(() => {
        if (!cancelled) clearTokens();
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function enter(next: Session) {
    writeTokens(next.accessToken, next.refreshToken);
    setSession(next);
    setBooting(false);
  }

  function leave() {
    clearTokens();
    setSession(null);
  }

  let screen;
  if (booting) {
    screen = (
      <main className="boot dark">
        <p role="status">Opening the floor…</p>
      </main>
    );
  } else if (!session) {
    screen = <SignIn onEnter={enter} />;
  } else {
    screen = <Floor session={session} onLeave={leave} />;
  }

  return (
    <>
      <PaintDefs />
      {screen}
    </>
  );
}
