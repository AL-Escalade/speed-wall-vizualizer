import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

/**
 * Basic rendering tests for Sidebar component.
 * Note: Sub-components (ColorPicker, LaneSelector, HoldRangeSelector,
 * SourceSelector, AnchorConfigurator) have their own comprehensive tests.
 */

describe('Sidebar', () => {
  describe('structure', () => {
    it('should render as aside element', () => {
      const { container } = render(<Sidebar />);
      expect(container.querySelector('aside')).toBeInTheDocument();
    });
  });

  describe('ConfigSelector section', () => {
    it('should render configuration label', () => {
      render(<Sidebar />);
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should render new configuration button', () => {
      render(<Sidebar />);
      expect(screen.getByTitle('Nouvelle')).toBeInTheDocument();
    });

    it('should render rename button', () => {
      render(<Sidebar />);
      // Use getAllByTitle since there may be multiple rename buttons (config + sections)
      const renameButtons = screen.getAllByTitle('Renommer');
      expect(renameButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render delete button', () => {
      render(<Sidebar />);
      // Use getAllByTitle since there may be multiple delete buttons
      const deleteButtons = screen.getAllByTitle('Supprimer');
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render configuration select', () => {
      render(<Sidebar />);
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('DisplayOptions section', () => {
    it('should render options header', () => {
      render(<Sidebar />);
      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should have expandable options button', () => {
      render(<Sidebar />);
      const optionsButton = screen.getByText('Options').closest('button');
      expect(optionsButton).toBeInTheDocument();
    });

    it('should toggle options content when clicked', () => {
      render(<Sidebar />);

      // Options should be collapsed initially
      expect(screen.queryByText('Système de coordonnées')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText('Options'));

      // Options should now be visible
      expect(screen.getByText('Système de coordonnées')).toBeInTheDocument();
      expect(screen.getByText("Afficher les flèches d'orientation")).toBeInTheDocument();
      expect(screen.getByText('Couleur de la grille')).toBeInTheDocument();
    });
  });
});
