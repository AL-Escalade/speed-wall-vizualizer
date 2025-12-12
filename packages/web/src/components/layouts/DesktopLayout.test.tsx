import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesktopLayout } from './DesktopLayout';

// Mock child components
vi.mock('@/components', () => ({
  Header: () => <div data-testid="header">Header</div>,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
  Viewer: () => <div data-testid="viewer">Viewer</div>,
}));

describe('DesktopLayout', () => {
  it('should render Header component', () => {
    render(<DesktopLayout />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render Sidebar component', () => {
    render(<DesktopLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should render Viewer component', () => {
    render(<DesktopLayout />);
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<DesktopLayout />);

    // Root container should have flex column layout
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('h-screen');
    expect(root.className).toContain('flex');
    expect(root.className).toContain('flex-col');
  });
});
