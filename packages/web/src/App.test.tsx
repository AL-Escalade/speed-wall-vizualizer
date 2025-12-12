import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the router components to avoid nested router issues
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  };
});

// Mock layout components
vi.mock('@/components/layouts', () => ({
  MainLayout: () => <div data-testid="main-layout">MainLayout</div>,
  SharedConfigLoader: () => <div data-testid="shared-config-loader">SharedConfigLoader</div>,
}));

// Mock pages
vi.mock('@/pages', () => ({
  PrintPage: () => <div data-testid="print-page">PrintPage</div>,
}));

// Mock ErrorBoundary
vi.mock('@/components', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should render MainLayout by default', () => {
    render(<App />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('should wrap content in ErrorBoundary', () => {
    render(<App />);
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toContainElement(screen.getByTestId('main-layout'));
  });
});
