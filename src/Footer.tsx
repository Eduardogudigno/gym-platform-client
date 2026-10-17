import { Logo } from './Logo';
import { Rip } from './Paint';

export function Footer() {
  return (
    <footer className="foot dark">
      <Rip edge="top" />
      <div className="wrap foot__in">
        <Logo />
        <p>Tempo Athletic Club · front desk</p>
      </div>
    </footer>
  );
}
