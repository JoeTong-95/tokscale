/** @vitest-environment jsdom */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BreakdownPanel } from "@/components/BreakdownPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { Tooltip } from "@/components/Tooltip";
import { exportDay, localExport } from "../support/localExport";

afterEach(() => {
  cleanup();
});

describe("local viewer tooltip", () => {
  it("shows the day, its token mix, cost and messages", () => {
    const day = localExport().contributions[1];
    const html = renderToStaticMarkup(<Tooltip day={day} position={{ x: 100, y: 80 }} visible />);
    expect(html).toContain('role="tooltip"');
    expect(html).toContain("Mar 2, 2026");
    for (const label of ["Total tokens", "Input", "Output", "Cache read", "Cache write", "Reasoning", "Cost", "Messages"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("$39.00");
    expect(html).toContain("184");
    expect(html).not.toContain("--color-");
  });

  it("renders nothing while hidden", () => {
    const day = localExport().contributions[1];
    expect(renderToStaticMarkup(<Tooltip day={day} position={null} visible={false} />)).toBe("");
  });
});

describe("local viewer day breakdown", () => {
  it("groups the day by client, lists each model, and sums the day", () => {
    const day = localExport().contributions[1];
    render(<BreakdownPanel day={day} onClose={() => {}} />);

    const panel = screen.getByRole("region", { name: "Day breakdown" });
    expect(within(panel).getByRole("heading", { name: "March 2, 2026" })).toBeTruthy();
    expect(panel.textContent).toContain("Claude Code");
    expect(panel.textContent).toContain("Codex CLI");
    expect(panel.textContent).toContain("claude-sonnet-4-5");
    expect(panel.textContent).toContain("gpt-5.1-codex");
    expect(panel.textContent).toContain("Total: $39.00");
    expect(panel.textContent).toContain("across 2 clients");
    expect(panel.textContent).toContain("2 models");
  });

  it("closes from its button", () => {
    const onClose = vi.fn();
    render(<BreakdownPanel day={localExport().contributions[1]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close breakdown panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("says so when the day has no client detail", () => {
    render(<BreakdownPanel day={exportDay("2026-03-04", [], 0)} onClose={() => {}} />);
    expect(screen.getByText("No activity on this day")).toBeTruthy();
  });
});

describe("local viewer statistics", () => {
  it("lists the export's totals, streaks and clients", () => {
    render(<StatsPanel data={localExport()} mcpServers={["github", "linear"]} />);
    const panel = screen.getByRole("region", { name: "Statistics" });
    for (const label of ["Total cost", "Total tokens", "Active days", "Avg / day", "Current streak", "Longest streak", "Best day", "Models"]) {
      expect(within(panel).getByText(label)).toBeTruthy();
    }
    expect(within(panel).getByText("$56.00")).toBeTruthy();
    expect(within(panel).getByText("3 / 3")).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Clients" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "claude",
      "codex",
    ]);
    expect(screen.getByRole("list", { name: "MCPs" }).textContent).toContain("linear");
  });
});
