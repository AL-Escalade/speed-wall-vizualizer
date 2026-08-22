import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { SectionItem } from './SectionItem';
import { useConfigStore, type Section, type SavedConfiguration } from '@/store';
import { renderWithIntl } from '@/test/intlWrapper';

/** u15-it declares { RED: '#FF0000', DARKGREEN: '#006400' } */
const MULTI_COLOR_SOURCE = 'u15-it';
/** ifsc declares a single '#FF0000' */
const SINGLE_COLOR_SOURCE = 'ifsc';

function seedStore(section: Partial<Section> = {}): Section {
  const built: Section = {
    id: 'sec-1',
    name: 'Section 1',
    source: MULTI_COLOR_SOURCE,
    lane: 0,
    fromHold: 'F1',
    toHold: 'PAD',
    color: '#FF0000',
    colors: {},
    ...section,
  };

  const config: SavedConfiguration = {
    id: 'cfg-1',
    name: 'Config',
    wall: { lanes: 2, panelsHeight: 10 },
    sections: [built],
    createdAt: 1,
    updatedAt: 1,
  };

  useConfigStore.setState({ configurations: [config], activeConfigId: 'cfg-1' });
  return built;
}

function renderItem(section: Section) {
  return renderWithIntl(
    <SectionItem
      section={section}
      isExpanded
      onToggle={() => {}}
      lanesCount={2}
      coordinateDisplaySystem="ABC"
    />
  );
}

/** The section as the store currently holds it */
const stored = () =>
  useConfigStore.getState().configurations[0].sections[0];

describe('SectionItem colors', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    useConfigStore.setState({ configurations: [], activeConfigId: null });
  });

  it('should render one picker per color declared by the route', () => {
    const { container } = renderItem(seedStore());

    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(2);
    expect(screen.getByText('Prises IFSC')).toBeInTheDocument();
    expect(screen.getByText('Prises ajoutées')).toBeInTheDocument();
  });

  it('should render the single legacy picker for a single-color route', () => {
    const { container } = renderItem(seedStore({ source: SINGLE_COLOR_SOURCE }));

    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(1);
    expect(screen.getByText('Couleur')).toBeInTheDocument();
  });

  it('should write only the edited tag to the store, after the debounce', () => {
    const { container } = renderItem(seedStore());
    const inputs = container.querySelectorAll('input[type="color"]');

    fireEvent.input(inputs[1], { target: { value: '#123456' } });
    expect(stored().colors).toEqual({}); // still debounced

    act(() => { vi.advanceTimersByTime(150); });

    expect(stored().colors).toEqual({ DARKGREEN: '#123456' });
    // The untouched tag keeps following the route, and the mirror tracks RED
    expect(stored().color).toBe('#FF0000');
  });

  it('should not lose the first tag when two pickers move within one debounce window', () => {
    const { container } = renderItem(seedStore());
    const inputs = container.querySelectorAll('input[type="color"]');

    fireEvent.input(inputs[0], { target: { value: '#111111' } });
    act(() => { vi.advanceTimersByTime(50); });
    fireEvent.input(inputs[1], { target: { value: '#222222' } });
    act(() => { vi.advanceTimersByTime(150); });

    expect(stored().colors).toEqual({ RED: '#111111', DARKGREEN: '#222222' });
    expect(stored().color).toBe('#111111');
  });

  it('should offer a reset only once a color is overridden, and clear overrides', () => {
    const { container, rerender } = renderItem(seedStore());
    expect(screen.queryByText('Réinitialiser les couleurs')).not.toBeInTheDocument();

    fireEvent.input(container.querySelectorAll('input[type="color"]')[0], {
      target: { value: '#111111' },
    });
    act(() => { vi.advanceTimersByTime(150); });

    rerender(
      <SectionItem
        section={stored()}
        isExpanded
        onToggle={() => {}}
        lanesCount={2}
        coordinateDisplaySystem="ABC"
      />
    );

    fireEvent.click(screen.getByText('Réinitialiser les couleurs'));
    expect(stored().colors).toEqual({});
    expect(stored().color).toBe('#FF0000');
  });

  it('should drop overrides when the source route changes', () => {
    const { container } = renderItem(seedStore({ colors: { RED: '#111111' } }));

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, {
      target: { value: SINGLE_COLOR_SOURCE },
    });

    // Color tags are route-specific, so they cannot survive the swap
    expect(stored().colors).toEqual({});
    expect(stored().source).toBe(SINGLE_COLOR_SOURCE);
  });

  it('should stop shadowing the store once the debounced write lands', () => {
    const { container, rerender } = renderItem(seedStore());

    fireEvent.input(container.querySelectorAll('input[type="color"]')[0], {
      target: { value: '#111111' },
    });
    act(() => { vi.advanceTimersByTime(150); });

    // Simulate the section being swapped underneath by an import that reuses
    // its id: a persistent local overlay would keep showing #111111
    rerender(
      <SectionItem
        section={{ ...stored(), colors: { RED: '#999999' } }}
        isExpanded
        onToggle={() => {}}
        lanesCount={2}
        coordinateDisplaySystem="ABC"
      />
    );

    const first = container.querySelectorAll('input[type="color"]')[0] as HTMLInputElement;
    expect(first.value).toBe('#999999');
  });
});
