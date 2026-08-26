import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataProvider, useData } from './DataContext.jsx';

beforeEach(() => {
  localStorage.clear();
});

function TestConsumer() {
  const { matters, entries, addMatter, addEntry, confirmEntry, confirmDay } = useData();
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
          <button onClick={() => confirmEntry(e.id)}>confirm {e.id}</button>
          <button onClick={() => confirmDay(e.date)}>confirm day {e.date}</button>
        </div>
      ))}
    </div>
  );
}

describe('DataContext', () => {
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
    fireEvent.click(screen.getByText(/^confirm [^d]/));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });

  test('confirmDay moves all entries on that date to confirmed', () => {
    render(<DataProvider><TestConsumer /></DataProvider>);
    fireEvent.click(screen.getByText('add entry'));
    fireEvent.click(screen.getByText(/^confirm day/));
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });
});
