import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataProvider, useData } from './DataContext.jsx';

beforeEach(() => {
  localStorage.clear();
});

function TestConsumer() {
  const { matters, entries, addMatter, addEntry, confirmEntry, confirmDay, updateEntry, deleteEntry } = useData();
  const nonSeedMatters = matters.filter((m) => !m.isPotentialClient);
  return (
    <div>
      <p data-testid="matter-count">{nonSeedMatters.length}</p>
      <p data-testid="entry-count">{entries.length}</p>
      <button onClick={() => addMatter({ name: 'Nuevo Matter', caseNumber: '001', rate: 50, isPotentialClient: false })}>
        add matter
      </button>
      <button
        onClick={() =>
          addEntry({ matterId: 'potential-client', date: '2026-07-21', task: 't', detailDescription: 'd', timeSpent: '10 min', costAssociated: '' })
        }
      >
        add entry
      </button>
      {entries.map((e) => (
        <div key={e.id}>
          <span data-testid={`status-${e.id}`}>{e.status}</span>
          <span data-testid="entry-task">{e.task}</span>
          <button data-testid="update-entry" onClick={() => updateEntry(e.id, { task: 'editada' })}>update</button>
          <button data-testid="delete-entry" onClick={() => deleteEntry(e.id)}>delete</button>
          <button data-testid="confirm-entry" onClick={() => confirmEntry(e.id)}>confirm {e.id}</button>
          <button data-testid="confirm-day" onClick={() => confirmDay(e.date)}>confirm day {e.date}</button>
        </div>
      ))}
    </div>
  );
}

describe('DataContext', () => {
  test('addMatter returns the created matter with its new id', () => {
    let returned = null;
    function Probe() {
      const { addMatter, matters } = useData();
      return (
        <div>
          <button
            onClick={() => {
              returned = addMatter({ name: 'Creado Inline', caseNumber: '', rate: null, isPotentialClient: false });
            }}
          >
            create
          </button>
          <p data-testid="names">{matters.map((m) => m.name).join('|')}</p>
        </div>
      );
    }
    render(
      <DataProvider>
        <Probe />
      </DataProvider>
    );

    fireEvent.click(screen.getByText('create'));

    expect(returned).toMatchObject({ name: 'Creado Inline' });
    expect(returned.id).toEqual(expect.any(String));
    expect(screen.getByTestId('names')).toHaveTextContent('Creado Inline');
  });

  test('adds a matter and it appears in state', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add matter'));
    expect(screen.getByTestId('matter-count').textContent).toBe('1');
  });

  test('adds an entry with draft status by default', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    expect(screen.getByTestId('entry-count').textContent).toBe('1');
    const statusEl = screen.getByText(/draft/);
    expect(statusEl).toBeInTheDocument();
  });

  test('confirmEntry moves a single entry to confirmed', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByTestId('confirm-entry'));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });

  test('confirmDay moves all entries on that date to confirmed', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByText(/^confirm day/));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });

  test('updateEntry replaces the given fields', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByTestId('update-entry'));
    expect(screen.getByTestId('entry-task').textContent).toBe('editada');
  });

  test('deleteEntry removes the entry', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByTestId('delete-entry'));
    expect(screen.getByTestId('entry-count').textContent).toBe('0');
  });
});

describe('DataContext save failures', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows a Spanish alert banner when persisting fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/no se pudo guardar/i);
    expect(alert).toHaveTextContent(/no se haya guardado/i);
  });

  test('renders no banner when persisting succeeds', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
