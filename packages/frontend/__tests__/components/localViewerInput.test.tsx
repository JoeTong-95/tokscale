/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataInput } from "@/components/DataInput";
import { localExport } from "../support/localExport";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const onDataLoaded = vi.fn();
  render(<DataInput onDataLoaded={onDataLoaded} />);
  const textarea = screen.getByRole("textbox", { name: "Export JSON" });
  return { onDataLoaded, textarea };
}

describe("local viewer data input", () => {
  it("parses pasted `tokscale graph` JSON", () => {
    const { onDataLoaded, textarea } = setup();
    const parse = screen.getByRole("button", { name: "Parse JSON" });
    expect(parse).toHaveProperty("disabled", true);

    const data = localExport();
    fireEvent.change(textarea, { target: { value: JSON.stringify(data) } });
    expect(parse).toHaveProperty("disabled", false);
    fireEvent.click(parse);
    expect(onDataLoaded).toHaveBeenCalledWith(data);
  });

  it("parses with Ctrl+Enter or Cmd+Enter", () => {
    const { onDataLoaded, textarea } = setup();
    fireEvent.change(textarea, { target: { value: JSON.stringify(localExport()) } });
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    expect(onDataLoaded).toHaveBeenCalledTimes(2);
  });

  it("reports broken JSON and the wrong shape as alerts on the field", () => {
    const { onDataLoaded, textarea } = setup();
    fireEvent.change(textarea, { target: { value: "{not json" } });
    fireEvent.click(screen.getByRole("button", { name: "Parse JSON" }));
    expect(screen.getByRole("alert").textContent).toMatch(/^Invalid JSON: /);
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-describedby")).toContain(screen.getByRole("alert").id);

    fireEvent.change(textarea, { target: { value: JSON.stringify({ meta: {} }) } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Parse JSON" }));
    expect(screen.getByRole("alert").textContent).toContain("Invalid data format");
    expect(onDataLoaded).not.toHaveBeenCalled();
  });

  it("loads the sample data", async () => {
    const data = localExport();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => data })),
    );
    const { onDataLoaded } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Load sample data" }));
    await waitFor(() => expect(onDataLoaded).toHaveBeenCalledWith(data));
    expect(fetch).toHaveBeenCalledWith("/sample-data.json");
  });

  it("explains how to get an export", () => {
    setup();
    const steps = screen.getByRole("region", { name: "How to get your data" });
    expect(steps.textContent).toContain("bunx tokscale");
    expect(steps.textContent).toContain("tokscale graph");
  });
});
