import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { ApiError, checkIn, expiringSubscriptions, listMembers, logout } from './api';
import { Footer } from './Footer';
import { Join } from './Join';
import { Logo } from './Logo';
import { Deco, Rip } from './Paint';
import type { ExpiringSubscription, Member, Session } from './types';

type Props = {
  session: Session | null;
  onLeave: () => void;
};

const statusTone: Record<Member['status'], string> = {
  active: 'var(--c-stretch)',
  inactive: 'var(--c-lift)',
  suspended: 'var(--c-sweat)',
};

function initials(member: Member): string {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}

function formatDay(value: string | null): string {
  if (!value) return 'No end date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export function Floor({ session, onLeave }: Props) {
  const role = session?.user.role ?? 'staff';
  const isStaff = role === 'admin' || role === 'staff';
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [expiring, setExpiring] = useState<ExpiringSubscription[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(isStaff);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [desk, setDesk] = useState<'floor' | 'join' | 'enroll'>('floor');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listMembers(search), expiringSubscriptions()])
      .then(([memberPage, expiringPage]) => {
        if (cancelled) return;
        setMembers(memberPage.rows);
        setExpiring(expiringPage.rows);
        setSelected((current) =>
          memberPage.rows.some((member) => member.id === current) ? current : (memberPage.rows[0]?.id ?? ''),
        );
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof ApiError ? caught.message : 'The floor could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isStaff, search, revision]);

  async function submitCheckIn(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setPending(true);
    try {
      await checkIn(isStaff ? selected : undefined);
      const person = members.find((member) => member.id === selected);
      setNotice(
        person ? `${person.firstName} ${person.lastName} is checked in.` : 'You are checked in.',
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Check-in failed.');
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    try {
      await logout();
    } catch {
      /* Local session still ends if the API is unreachable. */
    }
    onLeave();
  }

  const name = session ? `${session.user.firstName} ${session.user.lastName}` : 'Signed in';
  const selectedMember = members.find((member) => member.id === selected) ?? null;
  const hero =
    desk === 'join'
      ? {
          title: 'Write them in',
          sub: 'Create the member, then put them on a plan or leave it for later.',
        }
      : desk === 'enroll'
        ? {
            title: 'Choose a plan',
            sub: selectedMember
              ? `${selectedMember.firstName} ${selectedMember.lastName} can start a plan today.`
              : 'Pick a plan for this member.',
          }
        : {
            title: isStaff ? "Who's walking in" : 'Your pass',
            sub: isStaff
              ? 'Find the member at the door and check them in.'
              : 'Your membership is on this account. Check yourself in at the door.',
          };

  function finishDesk(message: string, memberId: string) {
    setNotice(message);
    setError(null);
    setSelected(memberId);
    setDesk('floor');
    setRevision((current) => current + 1);
  }

  return (
    <div className="shell">
      <header className="nav">
        <div className="wrap nav__in">
          <Logo />
          <p className="who">
            {name}
            {role ? ` · ${role}` : ''}
          </p>
          <button type="button" className="btn btn--ghost btn--small" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <div className="hero hero--short dark">
        <Deco name="leaf" style={{ left: -36, top: -14, width: 190, height: 190, transform: 'rotate(-8deg)' }} />
        <Deco name="tomato" style={{ right: '4%', top: 16, width: 92, height: 92 }} />
        <Deco name="orange" hideOnSmall style={{ right: '20%', bottom: 56, width: 70, height: 70 }} />
        <div className="wrap hero__in">
          <h1>{hero.title}</h1>
          <p className="hero__sub">{hero.sub}</p>
        </div>
        <Rip edge="bottom" />
      </div>
      <main className={desk === 'floor' ? 'wrap floor' : 'wrap join'}>
        {desk !== 'floor' && isStaff ? (
          <Join
            member={desk === 'enroll' ? selectedMember : null}
            onCancel={() => setDesk('floor')}
            onDone={finishDesk}
          />
        ) : (
        <section className="floor-main">
          <div className="floor-head">
            <h2 className="h2">{isStaff ? 'Check a member in' : 'Check in'}</h2>
            {isStaff ? (
              <button type="button" className="btn btn--ghost" onClick={() => setDesk('join')}>
                Add a member
              </button>
            ) : null}
          </div>
          {isStaff ? (
            <form className="check-form" onSubmit={submitCheckIn}>
              <div className="field">
                <label htmlFor="member-search">Find a member</label>
                <input
                  id="member-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {loading ? <p role="status">Loading the floor…</p> : null}
              {error ? (
                <p className="alert" role="alert">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p className="notice" role="status">
                  {notice}
                </p>
              ) : null}
              {!loading && members.length === 0 ? (
                <p className="empty">
                  <b>No members match.</b>
                  Try another name or email.
                </p>
              ) : null}
              <ul className="member-list">
                {members.map((member, index) => (
                  <li key={member.id}>
                    <label
                      className="ticket ticket--in"
                      style={{ '--tc': statusTone[member.status], '--i': index } as CSSProperties}
                    >
                      <input
                        type="radio"
                        name="member"
                        value={member.id}
                        checked={selected === member.id}
                        onChange={() => setSelected(member.id)}
                      />
                      <span className="ticket__mark" aria-hidden="true">
                        {initials(member)}
                      </span>
                      <span>
                        <span className="name">
                          {member.firstName} {member.lastName}
                        </span>
                        <span className="meta">{member.email}</span>
                      </span>
                      <span className="tag">{member.status}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={!selected}
                  onClick={() => setDesk('enroll')}
                >
                  Enroll on a plan
                </button>
                <button className="btn btn--primary" type="submit" disabled={pending || !selected}>
                  {pending ? 'Checking in…' : 'Check in'}
                </button>
              </div>
            </form>
          ) : (
            <form className="check-form" onSubmit={submitCheckIn}>
              {error ? (
                <p className="alert" role="alert">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p className="notice" role="status">
                  {notice}
                </p>
              ) : null}
              <button className="btn btn--primary" type="submit" disabled={pending}>
                {pending ? 'Checking in…' : 'Check in'}
              </button>
            </form>
          )}
        </section>
        )}
        {isStaff && desk === 'floor' ? (
          <aside className="aside">
            <div className="board">
              <h2>Lapsing this week</h2>
              {expiring.length === 0 ? (
                <p className="empty">
                  <b>Nobody ends this week.</b>
                  No active plans close in the next 7 days.
                </p>
              ) : (
                <ul className="lapse-list">
                  {expiring.map((item) => (
                    <li key={item.subscriptionId}>
                      <span className="who-name">
                        {item.firstName} {item.lastName}
                      </span>
                      <span className="meta">{formatDay(item.endDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
