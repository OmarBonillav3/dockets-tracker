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
  return (
    <nav>
      <ul>
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
