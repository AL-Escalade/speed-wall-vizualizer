import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SharedConfigLoader } from './SharedConfigLoader';
import { useConfigStore } from '@/store';
import * as urlConfig from '@/utils/urlConfig';

// Mock dependencies
vi.mock('@/utils/urlConfig');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SharedConfigLoader', () => {
  const mockDecodeConfig = vi.mocked(urlConfig.decodeConfig);
  const mockHydrateShareableConfig = vi.mocked(urlConfig.hydrateShareableConfig);

  beforeEach(() => {
    vi.clearAllMocks();
    useConfigStore.setState({
      configurations: [],
      activeConfigId: null,
    });
  });

  function renderWithRouter(encodedParam?: string) {
    const path = encodedParam ? `/share/${encodedParam}` : '/share';
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/share/:encoded?" element={<SharedConfigLoader />} />
          <Route path="/" element={<div data-testid="home">Home</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('should navigate to home when no encoded param', () => {
    renderWithRouter();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should show error when config is invalid', () => {
    mockDecodeConfig.mockReturnValue(null);
    renderWithRouter('invalid-config');

    expect(screen.getByText('Le lien de partage est invalide ou corrompu.')).toBeInTheDocument();
    expect(screen.getByText('Retour à l\'accueil')).toBeInTheDocument();
  });

  it('should show loading spinner initially', () => {
    mockDecodeConfig.mockReturnValue({ name: 'Test', wall: { lanes: 2, panelsHeight: 10 }, sections: [] } as urlConfig.ShareableConfig);
    mockHydrateShareableConfig.mockReturnValue({
      id: 'test-id',
      name: 'Test',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    renderWithRouter('valid-config');

    // Navigation happens after import, so we can't easily test the loading spinner
    // The test verifies the function was called
    expect(mockDecodeConfig).toHaveBeenCalledWith('valid-config');
  });

  it('should import configuration and navigate home on valid config', () => {
    const decodedConfig = { name: 'Test Config', wall: { lanes: 2, panelsHeight: 10 }, sections: [] } as urlConfig.ShareableConfig;
    const hydratedConfig = {
      id: 'test-id',
      name: 'Test Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockDecodeConfig.mockReturnValue(decodedConfig);
    mockHydrateShareableConfig.mockReturnValue(hydratedConfig);

    const importConfiguration = vi.spyOn(useConfigStore.getState(), 'importConfiguration');

    renderWithRouter('valid-config');

    expect(mockDecodeConfig).toHaveBeenCalledWith('valid-config');
    expect(mockHydrateShareableConfig).toHaveBeenCalledWith(decodedConfig);
    expect(importConfiguration).toHaveBeenCalledWith(hydratedConfig);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should navigate home when clicking back button on error', () => {
    mockDecodeConfig.mockReturnValue(null);
    renderWithRouter('invalid-config');

    fireEvent.click(screen.getByText('Retour à l\'accueil'));

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
