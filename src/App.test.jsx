import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders the app heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /dockets tracker/i })).toBeInTheDocument();
});
