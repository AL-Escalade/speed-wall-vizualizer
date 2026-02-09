import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PrintPageHeader } from './PrintPageHeader';
import { renderWithIntl } from '@/test/intlWrapper';

describe('PrintPageHeader', () => {
  const defaultProps = {
    onBack: vi.fn(),
    isMobile: false,
    configName: undefined,
  };

  it('should render back button', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderWithIntl(<PrintPageHeader {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onBack).toHaveBeenCalled();
  });

  it('should show full title on desktop', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={false} />);
    expect(screen.getByText('Impression multi-pages')).toBeInTheDocument();
  });

  it('should show short title on mobile', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={true} />);
    expect(screen.getByText('Impression')).toBeInTheDocument();
  });

  it('should show config name on desktop when provided', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={false} configName="My Config" />);
    expect(screen.getByText('My Config')).toBeInTheDocument();
  });

  it('should not show config name on mobile', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={true} configName="My Config" />);
    expect(screen.queryByText('My Config')).not.toBeInTheDocument();
  });

  it('should not show config name when not provided', () => {
    renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={false} configName={undefined} />);

    // There should be no text-base-content/70 element (config name container)
    const { container } = renderWithIntl(<PrintPageHeader {...defaultProps} isMobile={false} />);
    const configNameContainer = container.querySelector('.text-base-content\\/70');
    expect(configNameContainer).toBeNull();
  });
});
