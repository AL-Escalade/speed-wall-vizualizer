import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileLayout } from './MobileLayout';
import { useMobileTab } from '@/hooks/useMobileTab';

// Mock child components
vi.mock('@/components', () => ({
  Header: () => <div data-testid="header">Header</div>,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
  Viewer: () => <div data-testid="viewer">Viewer</div>,
}));

vi.mock('@/components/MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}));

vi.mock('@/hooks/useMobileTab');

describe('MobileLayout', () => {
  const mockUseMobileTab = vi.mocked(useMobileTab);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMobileTab.mockReturnValue('config');
  });

  it('should render Header component', () => {
    render(<MobileLayout />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render Sidebar component', () => {
    render(<MobileLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should render Viewer component', () => {
    render(<MobileLayout />);
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
  });

  it('should render MobileNav component', () => {
    render(<MobileLayout />);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('should show sidebar and hide viewer when config tab is active', () => {
    mockUseMobileTab.mockReturnValue('config');
    const { container } = render(<MobileLayout />);

    const sidebarContainer = container.querySelector('[data-testid="sidebar"]')?.parentElement;
    const viewerContainer = container.querySelector('[data-testid="viewer"]')?.parentElement;

    expect(sidebarContainer?.className).not.toContain('hidden');
    expect(viewerContainer?.className).toContain('pointer-events-none');
  });

  it('should hide sidebar and show viewer when viewer tab is active', () => {
    mockUseMobileTab.mockReturnValue('viewer');
    const { container } = render(<MobileLayout />);

    const sidebarContainer = container.querySelector('[data-testid="sidebar"]')?.parentElement;
    const viewerContainer = container.querySelector('[data-testid="viewer"]')?.parentElement;

    expect(sidebarContainer?.className).toContain('hidden');
    expect(viewerContainer?.className).not.toContain('pointer-events-none');
  });
});
