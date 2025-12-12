import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Mock hooks
vi.mock('@/hooks/useUrlSync', () => ({
  useUrlSync: vi.fn(),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(),
}));

// Mock layout components
vi.mock('./DesktopLayout', () => ({
  DesktopLayout: () => <div data-testid="desktop-layout">DesktopLayout</div>,
}));

vi.mock('./MobileLayout', () => ({
  MobileLayout: () => <div data-testid="mobile-layout">MobileLayout</div>,
}));

describe('MainLayout', () => {
  const mockUseIsMobile = vi.mocked(useIsMobile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render DesktopLayout on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    render(<MainLayout />);

    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-layout')).not.toBeInTheDocument();
  });

  it('should render MobileLayout on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    render(<MainLayout />);

    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
  });
});
