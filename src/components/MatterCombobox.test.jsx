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

  test('offers no create option when onCreateMatter is not provided', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'Cliente Nuevo');
    expect(screen.queryByText(/crear matter/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
  });

  test('creating a matter asks for its case number, then selects the new matter', async () => {
    const onChange = vi.fn();
    const onCreateMatter = vi.fn((name, caseNumber) => ({ id: 'new-id', name, caseNumber }));
    render(
      <MatterCombobox
        matters={matters}
        value=""
        onChange={onChange}
        onCreateMatter={onCreateMatter}
        label="Matter"
      />
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'Cliente Nuevo');
    await user.click(screen.getByRole('option', { name: /crear matter/i }));

    // the typed name carries over, and the case number is what still needs typing
    expect(screen.getByLabelText(/nombre del nuevo matter/i)).toHaveValue('Cliente Nuevo');
    expect(screen.getByLabelText(/número de caso del nuevo matter/i)).toHaveFocus();

    await user.type(screen.getByLabelText(/número de caso del nuevo matter/i), '0099-001');
    await user.click(screen.getByRole('button', { name: /crear matter/i }));

    expect(onCreateMatter).toHaveBeenCalledWith('Cliente Nuevo', '0099-001');
    expect(onChange).toHaveBeenCalledWith('new-id');
    expect(screen.getByLabelText('Matter')).toHaveValue('Cliente Nuevo');
    expect(screen.queryByLabelText(/número de caso del nuevo matter/i)).not.toBeInTheDocument();
  });

  test('the case number is optional and the name can still be corrected', async () => {
    const onCreateMatter = vi.fn((name, caseNumber) => ({ id: 'new-id', name, caseNumber }));
    render(
      <MatterCombobox
        matters={matters}
        value=""
        onChange={vi.fn()}
        onCreateMatter={onCreateMatter}
        label="Matter"
      />
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'Cliente Nuevo');
    await user.click(screen.getByRole('option', { name: /crear matter/i }));

    const nameField = screen.getByLabelText(/nombre del nuevo matter/i);
    await user.clear(nameField);
    await user.type(nameField, 'Cliente Corregido');
    await user.click(screen.getByRole('button', { name: /crear matter/i }));

    expect(onCreateMatter).toHaveBeenCalledWith('Cliente Corregido', '');
  });

  test('Enter inside the create panel confirms it', async () => {
    const onCreateMatter = vi.fn((name, caseNumber) => ({ id: 'new-id', name, caseNumber }));
    render(
      <MatterCombobox
        matters={matters}
        value=""
        onChange={vi.fn()}
        onCreateMatter={onCreateMatter}
        label="Matter"
      />
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'Cliente Nuevo');
    await user.click(screen.getByRole('option', { name: /crear matter/i }));
    await user.type(screen.getByLabelText(/número de caso del nuevo matter/i), '0099-001{Enter}');

    expect(onCreateMatter).toHaveBeenCalledWith('Cliente Nuevo', '0099-001');
  });

  test('cancelling the create panel creates nothing and restores the previous matter', async () => {
    const onCreateMatter = vi.fn();
    const onChange = vi.fn();
    render(
      <MatterCombobox
        matters={matters}
        value="m1"
        onChange={onChange}
        onCreateMatter={onCreateMatter}
        label="Matter"
      />
    );
    const user = userEvent.setup();
    const input = screen.getByLabelText('Matter');
    await user.clear(input);
    await user.type(input, 'Cliente Nuevo');
    await user.click(screen.getByRole('option', { name: /crear matter/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCreateMatter).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/número de caso del nuevo matter/i)).not.toBeInTheDocument();
    expect(input).toHaveValue('Gabriel Gonzalez Ocampo - Immigration Negligence');
  });

  test('does not offer to create a matter whose name already exists', async () => {
    render(
      <MatterCombobox matters={matters} value="" onChange={vi.fn()} onCreateMatter={vi.fn()} label="Matter" />
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'hector vega - fta work permit');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.queryByText(/crear matter/i)).not.toBeInTheDocument();
  });

  test('the create option is reachable by keyboard as the last option', async () => {
    render(
      <MatterCombobox matters={matters} value="" onChange={vi.fn()} onCreateMatter={vi.fn()} label="Matter" />
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Matter'));
    await user.type(screen.getByLabelText('Matter'), 'hector');

    // one matching matter, then the create option
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByLabelText(/nombre del nuevo matter/i)).toHaveValue('hector');
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
