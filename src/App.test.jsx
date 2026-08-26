import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders the Inicio screen by default with navigation present', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /inicio/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /matters/i })).toBeInTheDocument();
});
