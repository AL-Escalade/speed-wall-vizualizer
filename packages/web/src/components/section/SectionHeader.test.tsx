import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';
import type { Section } from '@/store';
import { renderWithIntl } from '@/test/intlWrapper';

const mockSection: Section = {
  id: 'section-1',
  name: 'Test Section',
  source: 'ifsc',
  lane: 0,
  fromHold: 'P1',
  toHold: 'TOP',
  color: '#FF0000',
};

describe('SectionHeader', () => {
  describe('rendering', () => {
    it('should render section name', () => {
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('should render color indicator with section color', () => {
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      const colorIndicator = container.querySelector('.rounded-full');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF0000' });
    });

    it('should render displayColor when provided', () => {
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
          displayColor="#00FF00"
        />
      );

      const colorIndicator = container.querySelector('.rounded-full');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#00FF00' });
    });

    it('should render rename button', () => {
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      expect(screen.getByTitle('Renommer')).toBeInTheDocument();
    });

    it('should render delete button', () => {
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      expect(screen.getByTitle('Supprimer')).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('should show ChevronRight when collapsed', () => {
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      expect(container.querySelector('.lucide-chevron-right')).toBeInTheDocument();
    });

    it('should show ChevronDown when expanded', () => {
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={true}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      expect(container.querySelector('.lucide-chevron-down')).toBeInTheDocument();
    });

    it('should call onToggle when header is clicked', () => {
      const handleToggle = vi.fn();
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={handleToggle}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByText('Test Section').closest('div')!);

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('renaming', () => {
    it('should show edit input when rename button is clicked', () => {
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test Section');
    });

    it('should call onRename when Enter is pressed', () => {
      const handleRename = vi.fn();
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={handleRename}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleRename).toHaveBeenCalledWith('New Name');
    });

    it('should cancel edit when Escape is pressed', () => {
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should show original name again
      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should show save and cancel buttons during edit', () => {
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));

      // Save button has text-success class, cancel has text-error
      expect(container.querySelector('.text-success')).toBeInTheDocument();
      expect(container.querySelector('.text-error')).toBeInTheDocument();
    });

    it('should save when clicking save button', () => {
      const handleRename = vi.fn();
      const { container } = renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={handleRename}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });

      // Find and click the save button (text-success class)
      const saveButton = container.querySelector('.text-success');
      fireEvent.click(saveButton!);

      expect(handleRename).toHaveBeenCalledWith('New Name');
    });

    it('should not rename with empty name', () => {
      const handleRename = vi.fn();
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={handleRename}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleRename).not.toHaveBeenCalled();
    });

    it('should trim whitespace when renaming', () => {
      const handleRename = vi.fn();
      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={handleRename}
          onRemove={() => {}}
        />
      );

      fireEvent.click(screen.getByTitle('Renommer'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '  Trimmed Name  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleRename).toHaveBeenCalledWith('Trimmed Name');
    });
  });

  describe('deletion', () => {
    it('should call onRemove when delete is confirmed', () => {
      const handleRemove = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={handleRemove}
        />
      );

      fireEvent.click(screen.getByTitle('Supprimer'));

      expect(handleRemove).toHaveBeenCalledTimes(1);
      vi.restoreAllMocks();
    });

    it('should not call onRemove when delete is cancelled', () => {
      const handleRemove = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithIntl(
        <SectionHeader
          section={mockSection}
          isExpanded={false}
          onToggle={() => {}}
          onRename={() => {}}
          onRemove={handleRemove}
        />
      );

      fireEvent.click(screen.getByTitle('Supprimer'));

      expect(handleRemove).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });
});
