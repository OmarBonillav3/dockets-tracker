import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav.jsx';

describe('Nav', () => {
  test('renders a link for each of the 7 top-level screens', () => {
    render(<MemoryRouter><Nav /></MemoryRouter>);
    const expectedLabels = ['Inicio', 'Revisión diaria', 'Matters', 'Buscar', 'Resumen mensual', 'Exportar', 'Configuración'];
    for (const label of expectedLabels) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});
