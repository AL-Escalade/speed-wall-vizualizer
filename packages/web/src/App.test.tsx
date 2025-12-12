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
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  };
});

// Mock useUrlSync to avoid router context issues
vi.mock('@/hooks/useUrlSync', () => ({
  useUrlSync: vi.fn(),
}));

// Mock layout components
vi.mock('@/components/layouts', () => ({
  MainLayout: () => <div data-testid="main-layout">MainLayout</div>,
  SharedConfigLoader: () => <div data-testid="shared-config-loader">SharedConfigLoader</div>,
}));

// Mock pages
vi.mock('@/pages', () => ({
  PrintPage: () => <div data-testid="print-page">PrintPage</div>,
}));

// Mock components
vi.mock('@/components', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  Header: () => <div data-testid="header">Header</div>,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
  Viewer: () => <div data-testid="viewer">Viewer</div>,
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}));

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should render main view components by default', () => {
    render(<App />);
    // App renders Header, Sidebar, and Viewer through DesktopLayout in MainView
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
  });

  it('should wrap content in ErrorBoundary', () => {
    render(<App />);
    const errorBoundary = screen.getByTestId('error-boundary');
    // The main view components should be inside the ErrorBoundary
    expect(errorBoundary).toContainElement(screen.getByTestId('header'));
  });
});
