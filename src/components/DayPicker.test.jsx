import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayPicker } from './DayPicker.jsx';

function setup(props = {}) {
  const onChange = vi.fn();
  render(
    <DayPicker
      selectedDates={props.selectedDates ?? []}
      onChange={onChange}
      entryDates={props.entryDates ?? []}
      initialMonth={props.initialMonth ?? { year: 2026, month: 6 }}
    />
  );
  return { onChange, user: userEvent.setup() };
}

describe('DayPicker', () => {
  test('shows the initial month and year as a heading', () => {
    setup();
    expect(screen.getByText('Julio 2026')).toBeInTheDocument();
  });

  test('clicking an unselected day adds it to the selection', async () => {
    const { onChange, user } = setup({ selectedDates: [] });
    await user.click(screen.getByRole('button', { name: '15 de julio de 2026' }));
    expect(onChange).toHaveBeenCalledWith(['2026-07-15']);
  });

  test('clicking an already-selected day removes it', async () => {
    const { onChange, user } = setup({ selectedDates: ['2026-07-15', '2026-07-16'] });
    await user.click(screen.getByRole('button', { name: '15 de julio de 2026' }));
    expect(onChange).toHaveBeenCalledWith(['2026-07-16']);
  });

  test('a selected day is marked pressed', () => {
    setup({ selectedDates: ['2026-07-15'] });
    expect(screen.getByRole('button', { name: '15 de julio de 2026' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('navigating to the next month keeps the existing selection', async () => {
    const { onChange, user } = setup({ selectedDates: ['2026-07-15'] });
    await user.click(screen.getByRole('button', { name: /mes siguiente/i }));
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3 de agosto de 2026' }));
    expect(onChange).toHaveBeenCalledWith(['2026-07-15', '2026-08-03']);
  });

  test('"seleccionar todo el mes" adds only the visible days that have entries', async () => {
    const { onChange, user } = setup({
      selectedDates: [],
      entryDates: ['2026-07-02', '2026-07-20', '2026-08-01'],
    });
    await user.click(screen.getByRole('button', { name: /seleccionar todo el mes/i }));
    expect(onChange).toHaveBeenCalledWith(['2026-07-02', '2026-07-20']);
  });

  test('"limpiar" empties the selection', async () => {
    const { onChange, user } = setup({ selectedDates: ['2026-07-15', '2026-07-16'] });
    await user.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  test('lists every selected day, including days from months the grid is not showing', () => {
    setup({ selectedDates: ['2026-08-19', '2026-07-15', '2026-09-02'] });
    expect(screen.getByText(/3 días seleccionados de 3 meses distintos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar 15 de julio de 2026' })).toHaveTextContent('15 jul');
    expect(screen.getByRole('button', { name: 'Quitar 19 de agosto de 2026' })).toHaveTextContent('19 ago');
    expect(screen.getByRole('button', { name: 'Quitar 2 de septiembre de 2026' })).toHaveTextContent('2 sep');
  });

  test('does not mention several months when the selection is inside one', () => {
    setup({ selectedDates: ['2026-07-15', '2026-07-16'] });
    expect(screen.getByText('2 días seleccionados')).toBeInTheDocument();
  });

  test('a selected day can be removed from the list without navigating to its month', async () => {
    const { onChange, user } = setup({ selectedDates: ['2026-07-15', '2026-09-02'] });
    await user.click(screen.getByRole('button', { name: 'Quitar 2 de septiembre de 2026' }));
    expect(onChange).toHaveBeenCalledWith(['2026-07-15']);
  });

  test('shows no selection summary when nothing is selected', () => {
    setup({ selectedDates: [] });
    expect(screen.queryByText(/seleccionad/i)).not.toBeInTheDocument();
  });

  test('marks days that have entries', () => {
    setup({ entryDates: ['2026-07-10'] });
    expect(screen.getByRole('button', { name: '10 de julio de 2026' })).toHaveAttribute('data-has-entries', 'true');
    expect(screen.getByRole('button', { name: '11 de julio de 2026' })).not.toHaveAttribute('data-has-entries');
  });
});
