/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenGraph2D, moveGraphCell } from "@/components/TokenGraph2D";
import { getPalette } from "@/lib/themes";
import { localExport } from "../support/localExport";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("2D graph keyboard moves", () => {
  it("steps a week with Left and Right, a day with Up and Down, and stops at the edges", () => {
    expect(moveGraphCell([10, 3], "ArrowLeft", 53)).toEqual([9, 3]);
    expect(moveGraphCell([10, 3], "ArrowRight", 53)).toEqual([11, 3]);
    expect(moveGraphCell([10, 3], "ArrowUp", 53)).toEqual([10, 2]);
    expect(moveGraphCell([10, 3], "ArrowDown", 53)).toEqual([10, 4]);
    expect(moveGraphCell([10, 3], "Home", 53)).toEqual([0, 3]);
    expect(moveGraphCell([10, 3], "End", 53)).toEqual([52, 3]);
    expect(moveGraphCell([0, 0], "ArrowLeft", 53)).toEqual([0, 0]);
    expect(moveGraphCell([0, 0], "ArrowUp", 53)).toEqual([0, 0]);
    expect(moveGraphCell([52, 6], "ArrowRight", 53)).toEqual([52, 6]);
    expect(moveGraphCell([52, 6], "ArrowDown", 53)).toEqual([52, 6]);
    expect(moveGraphCell([10, 3], "a", 53)).toBeNull();
  });
});

describe("2D graph keyboard use", () => {
  function setup(selectedDate: string | null = "2026-03-02") {
    const onDayHover = vi.fn();
    const onDayClick = vi.fn();
    const contributions = localExport().contributions.filter((day) => day.date.startsWith("2026"));
    render(
      <TokenGraph2D
        contributions={contributions}
        palette={getPalette("blue")}
        year="2026"
        selectedDate={selectedDate}
        onDayHover={onDayHover}
        onDayClick={onDayClick}
      />,
    );
    const graph = screen.getByRole("application", { name: "Daily token usage in 2026" });
    return { graph, onDayHover, onDayClick };
  }

  it("is focusable and explains its keys", () => {
    const { graph } = setup();
    expect(graph.tabIndex).toBe(0);
    const instructions = document.getElementById(graph.getAttribute("aria-describedby") ?? "");
    expect(instructions?.textContent).toContain("arrow keys");
  });

  it("starts on the selected day, reads each day out, and selects with Enter", () => {
    const { graph, onDayHover, onDayClick } = setup();
    const live = document.querySelector("[aria-live=polite]");

    fireEvent.keyDown(graph, { key: "ArrowRight" });
    expect(live?.textContent).toBe("Monday, March 2, 2026: 2.0M tokens, $39.00, 184 messages, shown in the breakdown");
    expect(onDayHover).toHaveBeenLastCalledWith(expect.objectContaining({ date: "2026-03-02" }), expect.any(Object));

    fireEvent.keyDown(graph, { key: "ArrowDown" });
    expect(live?.textContent).toBe("Tuesday, March 3, 2026: 122.0K tokens, $4.50, 21 messages");
    fireEvent.keyDown(graph, { key: "Enter" });
    expect(onDayClick).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-03-03" }));

    fireEvent.keyDown(graph, { key: "ArrowDown" });
    expect(live?.textContent).toBe("Wednesday, March 4, 2026: no usage");
    expect(onDayHover).toHaveBeenLastCalledWith(null, null);
    fireEvent.keyDown(graph, { key: "Enter" });
    expect(onDayClick).toHaveBeenCalledTimes(1);
  });

  it("hides the tooltip on Escape and clears the ring on blur", () => {
    const { graph, onDayHover } = setup();
    const live = document.querySelector("[aria-live=polite]");
    fireEvent.keyDown(graph, { key: "ArrowLeft" });
    fireEvent.keyDown(graph, { key: "Escape" });
    expect(onDayHover).toHaveBeenLastCalledWith(null, null);
    fireEvent.blur(graph);
    expect(live?.textContent).toBe("");
  });

  it("starts on the latest day with data when no day is selected", () => {
    const { graph } = setup(null);
    fireEvent.keyDown(graph, { key: "Enter" });
    expect(document.querySelector("[aria-live=polite]")?.textContent).toContain("Tuesday, March 3, 2026");
  });
});
