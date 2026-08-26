import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatterCombobox } from './MatterCombobox.jsx';

const matters = [
  { id: 'm1', name: 'Gabriel Gonzalez Ocampo - Immigration Negligence', caseNumber: '0024-002' },
  { id: 'm2', name: 'Hector Vega - FTA Work Permit', caseNumber: '0053-001' },
  { id: 'm3', name: 'Auto Exotica - Demand Letter', caseNumber: '0060-001' },
];

function Wrapper({ initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  return <MatterCombobox matters={matters} value={value} onChange={setValue} label="Matter" />;
}

describe('MatterCombobox', () => {
  test('typing filters suggestions by matter name', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    expect(screen.getAllByRole('option')).toHaveLength(3);

    await user.type(screen.getByLabelText('Matter'), 'hector');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Hector Vega - FTA Work Permit');
  });

  test('typing filters suggestions by case number too', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), '0060-001');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Auto Exotica - Demand Letter');
  });

  test('shows a "sin resultados" message when nothing matches', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'no existe este cliente');
    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  test('clicking a suggestion selects it and closes the list', async () => {
    const onChange = vi.fn();
    render(<MatterCombobox matters={matters} value="" onChange={onChange} label="Matter" />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.click(screen.getByRole('option', { name: /hector vega/i }));

    expect(onChange).toHaveBeenCalledWith('m2');
    expect(screen.getByLabelText('Matter')).toHaveValue('Hector Vega - FTA Work Permit');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('keyboard: ArrowDown then Enter selects the highlighted suggestion', async () => {
    const onChange = vi.fn();
    render(<MatterCombobox matters={matters} value="" onChange={onChange} label="Matter" />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('Matter');
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');

    // focusing the input highlights index 0; one ArrowDown moves to index 1 (Hector Vega)
    expect(onChange).toHaveBeenCalledWith('m2');
  });

  test('blurring without selecting reverts the text to the previously selected matter', async () => {
    render(<Wrapper initialValue="m1" />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('Matter');
    expect(input).toHaveValue('Gabriel Gonzalez Ocampo - Immigration Negligence');

    await user.click(input);
    await user.clear(input);
    await user.type(input, 'algo que no selecciono');
    await user.tab();

    await waitFor(() =>
      expect(screen.getByLabelText('Matter')).toHaveValue('Gabriel Gonzalez Ocampo - Immigration Negligence')
    );
  });
});
