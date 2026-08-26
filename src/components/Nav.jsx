import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/review', label: 'Revisión diaria' },
  { to: '/matters', label: 'Matters' },
  { to: '/search', label: 'Buscar' },
  { to: '/summary', label: 'Resumen mensual' },
  { to: '/export', label: 'Exportar' },
  { to: '/settings', label: 'Configuración' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="nav__bar">
        <span className="nav__brand">Dockets Tracker</span>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-list"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
          <span className="nav__toggle-bar" />
        </button>
      </div>
      <ul id="nav-list" className={open ? 'nav__list nav__list--open' : 'nav__list'}>
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive ? 'nav__link is-active' : 'nav__link'
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
