import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { AnchorConfigurator } from "./AnchorConfigurator";
import type { AnchorPosition } from "./types";
import type { PanelSide } from "@/constants/routes";
import { renderWithIntl } from "@/test/intlWrapper";

const DEFAULT_ANCHOR: AnchorPosition = {
  side: "SN",
  column: "A",
  row: 1,
};

describe("AnchorConfigurator", () => {
  it("should render all three selectors (side, column, row)", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("Côté")).toBeInTheDocument();
    expect(screen.getByText("Colonne")).toBeInTheDocument();
    expect(screen.getByText("Ligne")).toBeInTheDocument();
  });

  it("should render the header label", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    expect(
      screen.getByText("Position de la première prise"),
    ).toBeInTheDocument();
  });

  it("should render reset button", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("Réinitialiser")).toBeInTheDocument();
  });

  it("should use defaultAnchor values when anchor is undefined", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0].value).toBe("SN"); // side
    expect(selects[1].value).toBe("A"); // column
    expect(selects[2].value).toBe("1"); // row
  });

  it("should use anchor values when provided", () => {
    const customAnchor: AnchorPosition = {
      side: "DX",
      column: "F",
      row: 5,
    };

    renderWithIntl(
      <AnchorConfigurator
        anchor={customAnchor}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0].value).toBe("DX"); // side
    expect(selects[1].value).toBe("F"); // column
    expect(selects[2].value).toBe("5"); // row
  });

  it("should call onUpdate when side changes", () => {
    const handleUpdate = vi.fn();
    renderWithIntl(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "DX" } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      side: "DX",
    });
  });

  it("should call onUpdate when column changes", () => {
    const handleUpdate = vi.fn();
    renderWithIntl(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "E" } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      column: "E",
    });
  });

  it("should call onUpdate with parsed integer when row changes", () => {
    const handleUpdate = vi.fn();
    renderWithIntl(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2], { target: { value: "8" } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      row: 8,
    });
  });

  it("should call onReset when reset button is clicked", () => {
    const handleReset = vi.fn();
    renderWithIntl(
      <AnchorConfigurator
        anchor={{ side: "DX", column: "K", row: 10 }}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={handleReset}
      />,
    );

    fireEvent.click(screen.getByText("Réinitialiser"));

    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("should render side options (Gauche/Droite)", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    const sideOptions = selects[0].querySelectorAll("option");

    expect(sideOptions).toHaveLength(2);
    expect(sideOptions[0]).toHaveTextContent("Gauche");
    expect(sideOptions[1]).toHaveTextContent("Droit");
  });

  it("should render row options 0-11 (including virtual rows)", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    const rowOptions = selects[2].querySelectorAll("option");

    expect(rowOptions).toHaveLength(12);
    expect(rowOptions[0]).toHaveValue("0");
    expect(rowOptions[0]).toHaveTextContent("(0)");
    expect(rowOptions[1]).toHaveValue("1");
    expect(rowOptions[1]).toHaveTextContent("1");
    expect(rowOptions[10]).toHaveValue("10");
    expect(rowOptions[10]).toHaveTextContent("10");
    expect(rowOptions[11]).toHaveValue("11");
    expect(rowOptions[11]).toHaveTextContent("(11)");
  });

  it("should render column options A-1 through K+1 (including virtual columns)", () => {
    renderWithIntl(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    const columnOptions = selects[1].querySelectorAll("option");

    expect(columnOptions).toHaveLength(13);
    expect(columnOptions[0]).toHaveValue("A-1");
    expect(columnOptions[0]).toHaveTextContent("(A-1)");
    expect(columnOptions[1]).toHaveValue("A");
    expect(columnOptions[1]).toHaveTextContent("A");
    expect(columnOptions[11]).toHaveValue("K");
    expect(columnOptions[11]).toHaveTextContent("K");
    expect(columnOptions[12]).toHaveValue("K+1");
    expect(columnOptions[12]).toHaveTextContent("(K+1)");
  });

  describe("Arrow pad", () => {
    it("should render all four arrow buttons", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={DEFAULT_ANCHOR}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
        />,
      );

      expect(screen.getByLabelText("Monter d'une ligne")).toBeInTheDocument();
      expect(screen.getByLabelText("Descendre d'une ligne")).toBeInTheDocument();
      expect(screen.getByLabelText("Décaler d'une colonne à gauche")).toBeInTheDocument();
      expect(screen.getByLabelText("Décaler d'une colonne à droite")).toBeInTheDocument();
    });

    it("should move up (increment row)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 5 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Monter d'une ligne"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 6,
      });
    });

    it("should move down (decrement row)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 5 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Descendre d'une ligne"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 4,
      });
    });

    it("should move right (next column within same panel)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à droite"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "B",
        row: 1,
      });
    });

    it("should move left (previous column within same panel)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "B", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à gauche"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 1,
      });
    });

    it("should navigate into virtual column K+1", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "K", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à droite"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "K+1",
        row: 1,
      });
    });

    it("should navigate into virtual column A-1", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à gauche"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A-1",
        row: 1,
      });
    });

    it("should navigate out of virtual column A-1 to A", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A-1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à droite"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 1,
      });
    });

    it("should navigate into virtual row 11", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 10 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Monter d'une ligne"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 11,
      });
    });

    it("should navigate into virtual row 0", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
        />,
      );

      fireEvent.click(screen.getByLabelText("Descendre d'une ligne"));
      expect(handleUpdate).toHaveBeenCalledWith({
        side: "SN",
        column: "A",
        row: 0,
      });
    });

    it("should disable up arrow at row 11", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 11 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
        />,
      );

      expect(screen.getByLabelText("Monter d'une ligne")).toBeDisabled();
    });

    it("should disable down arrow at row 0", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A", row: 0 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
        />,
      );

      expect(screen.getByLabelText("Descendre d'une ligne")).toBeDisabled();
    });

    it("should disable right arrow at DX:K+1 on last lane", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "DX", column: "K+1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      expect(screen.getByLabelText("Décaler d'une colonne à droite")).toBeDisabled();
    });

    it("should NOT disable right arrow at SN:K+1 (can wrap to DX:A)", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "K+1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      expect(screen.getByLabelText("Décaler d'une colonne à droite")).not.toBeDisabled();
    });

    it("should disable left arrow at SN:A-1 on first lane", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A-1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      expect(screen.getByLabelText("Décaler d'une colonne à gauche")).toBeDisabled();
    });

    it("should NOT disable left arrow at DX:A-1 (can wrap to SN:K)", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "DX", column: "A-1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      expect(screen.getByLabelText("Décaler d'une colonne à gauche")).not.toBeDisabled();
    });

    it("right arrow at SN:K+1 should wrap to DX:A (same lane)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "K+1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à droite"));
      expect(handleUpdate).toHaveBeenCalledWith({ side: "DX", column: "A", row: 1 });
    });

    it("right arrow at DX:K+1 should wrap to SN:A of next lane", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "DX", column: "K+1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={0}
          lanesCount={2}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à droite"));
      expect(handleUpdate).toHaveBeenCalledWith({ side: "SN", column: "A", row: 1 });
      expect(handleLaneChange).toHaveBeenCalledWith(1);
    });

    it("left arrow at DX:A-1 should wrap to SN:K (same lane)", () => {
      const handleUpdate = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "DX", column: "A-1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à gauche"));
      expect(handleUpdate).toHaveBeenCalledWith({ side: "SN", column: "K", row: 1 });
    });

    it("left arrow at SN:A-1 should wrap to DX:K of previous lane", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "A-1", row: 1 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={1}
          lanesCount={2}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Décaler d'une colonne à gauche"));
      expect(handleUpdate).toHaveBeenCalledWith({ side: "DX", column: "K", row: 1 });
      expect(handleLaneChange).toHaveBeenCalledWith(0);
    });

    it("should not disable arrows at middle positions", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={{ side: "SN", column: "F", row: 5 }}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
        />,
      );

      expect(screen.getByLabelText("Monter d'une ligne")).not.toBeDisabled();
      expect(screen.getByLabelText("Descendre d'une ligne")).not.toBeDisabled();
      expect(screen.getByLabelText("Décaler d'une colonne à droite")).not.toBeDisabled();
      expect(screen.getByLabelText("Décaler d'une colonne à gauche")).not.toBeDisabled();
    });
  });

  describe("Panel (half-lane) navigation", () => {
    const anchorSN = { ...DEFAULT_ANCHOR, side: 'SN' as PanelSide };
    const anchorDX = { ...DEFAULT_ANCHOR, side: 'DX' as PanelSide };

    it("should not render panel buttons when lanesCount is 1", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={1}
        />,
      );

      expect(screen.queryByLabelText("Panneau précédent")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Panneau suivant")).not.toBeInTheDocument();
    });

    it("should render panel buttons when lanesCount > 1", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={3}
          onLaneChange={() => {}}
        />,
      );

      expect(screen.getByLabelText("Panneau précédent")).toBeInTheDocument();
      expect(screen.getByLabelText("Panneau suivant")).toBeInTheDocument();
    });

    it(">> from SN should change side to DX (same lane)", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={0}
          lanesCount={3}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Panneau suivant"));
      expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ side: 'DX' }));
      expect(handleLaneChange).not.toHaveBeenCalled();
    });

    it(">> from DX should change side to SN and move to next lane", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorDX}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={0}
          lanesCount={3}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Panneau suivant"));
      expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ side: 'SN' }));
      expect(handleLaneChange).toHaveBeenCalledWith(1);
    });

    it("<< from DX should change side to SN (same lane)", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorDX}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={1}
          lanesCount={3}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Panneau précédent"));
      expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ side: 'SN' }));
      expect(handleLaneChange).not.toHaveBeenCalled();
    });

    it("<< from SN should change side to DX and move to previous lane", () => {
      const handleUpdate = vi.fn();
      const handleLaneChange = vi.fn();
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={handleUpdate}
          onReset={() => {}}
          lane={2}
          lanesCount={3}
          onLaneChange={handleLaneChange}
        />,
      );

      fireEvent.click(screen.getByLabelText("Panneau précédent"));
      expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ side: 'DX' }));
      expect(handleLaneChange).toHaveBeenCalledWith(1);
    });

    it("should disable << when side=SN and lane=0", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={3}
          onLaneChange={() => {}}
        />,
      );

      expect(screen.getByLabelText("Panneau précédent")).toBeDisabled();
      expect(screen.getByLabelText("Panneau suivant")).not.toBeDisabled();
    });

    it("should NOT disable << when side=DX and lane=0 (can go DX→SN same lane)", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorDX}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={0}
          lanesCount={3}
          onLaneChange={() => {}}
        />,
      );

      expect(screen.getByLabelText("Panneau précédent")).not.toBeDisabled();
    });

    it("should disable >> when side=DX and lane=last", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorDX}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={2}
          lanesCount={3}
          onLaneChange={() => {}}
        />,
      );

      expect(screen.getByLabelText("Panneau suivant")).toBeDisabled();
      expect(screen.getByLabelText("Panneau précédent")).not.toBeDisabled();
    });

    it("should NOT disable >> when side=SN and lane=last (can go SN→DX same lane)", () => {
      renderWithIntl(
        <AnchorConfigurator
          anchor={anchorSN}
          defaultAnchor={DEFAULT_ANCHOR}
          onUpdate={() => {}}
          onReset={() => {}}
          lane={2}
          lanesCount={3}
          onLaneChange={() => {}}
        />,
      );

      expect(screen.getByLabelText("Panneau suivant")).not.toBeDisabled();
    });
  });
});
