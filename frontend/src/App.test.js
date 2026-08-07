import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./context/useAppContext', () => ({
  __esModule: true,
  default: () => ({
    user: null,
    loading: false,
    setLoading: jest.fn(),
  }),
}));

jest.mock('./context/UnapprovedUserContext', () => ({
  __esModule: true,
  useUnapprovedUserCount: () => ({ refreshUnapprovedUserCount: jest.fn() }),
}));

jest.mock('./utils/refreshAllQuoteContexts', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock('./components/ErrorBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="error-banner" />,
}));

jest.mock('./components/SuccessBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="success-banner" />,
}));

jest.mock('./components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}));

jest.mock('./components/AdminRoute', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('./components/PrivateRoute', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

test('renders the app shell without crashing', () => {
  render(<App />);
  expect(screen.getByTestId('navbar')).toBeInTheDocument();
});
