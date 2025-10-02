import { render, screen } from '@testing-library/react';

import App from './App';

test('renders BlackRent login form', () => {
  render(<App />);
  const loginElement = screen.getByText(/Prihlásenie do systému/i);
  const usernameField = screen.getByLabelText(/Používateľské meno/i);
  expect(loginElement).toBeInTheDocument();
  expect(usernameField).toBeInTheDocument();
});
