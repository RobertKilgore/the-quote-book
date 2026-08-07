// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => {
  const React = require('react');

  return {
    BrowserRouter: ({ children }) => React.createElement('div', null, children),
    MemoryRouter: ({ children }) => React.createElement('div', null, children),
    Router: ({ children }) => React.createElement('div', null, children),
    Routes: ({ children }) => React.createElement('div', null, children),
    Route: () => null,
    Navigate: ({ to }) => React.createElement('div', null, `Navigate:${to}`),
    Link: ({ children, ...props }) => React.createElement('a', props, children),
    NavLink: ({ children, ...props }) => React.createElement('a', props, children),
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  };
});
