import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PrintPreviewLoading,
  PrintPreviewError,
  PrintPreviewEmpty,
} from './PrintPreviewStates';

describe('PrintPreviewLoading', () => {
  it('should render loading spinner', () => {
    const { container } = render(<PrintPreviewLoading isMobile={false} />);
    const spinner = container.querySelector('.loading');
    expect(spinner).toBeInTheDocument();
  });

  it('should have desktop classes when not mobile', () => {
    const { container } = render(<PrintPreviewLoading isMobile={false} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
  });

  it('should have mobile classes when mobile', () => {
    const { container } = render(<PrintPreviewLoading isMobile={true} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('py-8');
  });
});

describe('PrintPreviewError', () => {
  it('should render error message', () => {
    render(<PrintPreviewError isMobile={false} error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should have alert-error class', () => {
    const { container } = render(<PrintPreviewError isMobile={false} error="Error" />);
    const alert = container.querySelector('.alert-error');
    expect(alert).toBeInTheDocument();
  });

  it('should have desktop classes when not mobile', () => {
    const { container } = render(<PrintPreviewError isMobile={false} error="Error" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
  });

  it('should have mobile classes when mobile', () => {
    const { container } = render(<PrintPreviewError isMobile={true} error="Error" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('py-8');
  });
});

describe('PrintPreviewEmpty', () => {
  it('should render message', () => {
    render(<PrintPreviewEmpty isMobile={false} message="No content available" />);
    expect(screen.getByText('No content available')).toBeInTheDocument();
  });

  it('should have desktop classes when not mobile', () => {
    const { container } = render(<PrintPreviewEmpty isMobile={false} message="Empty" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-1');
  });

  it('should have mobile classes when mobile', () => {
    const { container } = render(<PrintPreviewEmpty isMobile={true} message="Empty" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('py-8');
  });

  it('should have text styling', () => {
    const { container } = render(<PrintPreviewEmpty isMobile={false} message="Empty" />);
    const textContainer = container.querySelector('.text-base-content\\/40');
    expect(textContainer).toBeInTheDocument();
  });
});
