import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSettingsPage from './AdminSettingsPage';
import api, { clearRequestCache } from '../api/axios';

jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
  clearRequestCache: jest.fn(),
}));

jest.mock('../context/useAppContext', () => ({
  __esModule: true,
  default: () => ({
    setError: jest.fn(),
    setSuccess: jest.fn(),
  }),
}));

jest.mock('../utils/getCookie', () => ({
  __esModule: true,
  default: () => 'csrf-token',
}));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.patch.mockReset();
    clearRequestCache.mockReset();

    api.get.mockResolvedValue({ data: { initial_window_days: 14, reopen_window_days: 7 } });
    api.patch.mockResolvedValue({ data: { initial_window_days: 10, reopen_window_days: 5 } });
  });

  it('fetches settings without cache and clears cache after saving', async () => {
    render(<AdminSettingsPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/api/admin/settings/',
        expect.objectContaining({ withCredentials: true, cache: false })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(clearRequestCache).toHaveBeenCalledWith('/api/admin/settings/');
    });
  });
});
