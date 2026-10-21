"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import type { DailyContribution, GraphColorPalette, TooltipPosition } from "@/lib/types";
import { getDarkGraphColor } from "@/lib/darkGraphColors";
import { groupByWeek } from "@/lib/utils";
import { CELL_SIZE, FONT_FAMILY, DAY_LABELS_SHORT, MONTH_LABELS_SHORT } from "@/lib/constants";
import { parseISO, getMonth } from "date-fns";

/* Canvas layout, in CSS pixels. Cells grow with the card up to MAX_CELL_SIZE and never shrink below
   the original 12px pitch; narrower cards scroll sideways instead. */
const MAX_CELL_SIZE = 24;
const LABEL_FONT_SIZE = 11;
const DAY_LABEL_WIDTH = 32;
const MONTH_LABEL_HEIGHT = 22;
const RIGHT_PADDING = 24;
const BOTTOM_PADDING = 2;

export function getGraphCellSize(availableWidth: number, weeks: number): number {
  if (weeks <= 0 || !Number.isFinite(availableWidth) || availableWidth <= 0) return CELL_SIZE;
  const fit = Math.floor((availableWidth - DAY_LABEL_WIDTH - RIGHT_PADDING) / weeks);
  return Math.max(CELL_SIZE, Math.min(MAX_CELL_SIZE, fit));
}

const Container = styled.div`
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
  scrollbar-width: thin;
`;

const GraphCanvas = styled.canvas`
  display: block;
  max-width: none;
  cursor: pointer;
`;

interface TokenGraph2DProps {
  contributions: DailyContribution[];
  palette: GraphColorPalette;
  year: string;
  /** Day under the pointer; drawn with a thin outline. */
  hoveredDate?: string | null;
  /** Day shown in the breakdown panel; drawn with the focus colour. */
  selectedDate?: string | null;
  onDayHover: (day: DailyContribution | null, position: TooltipPosition | null) => void;
  onDayClick: (day: DailyContribution | null) => void;
}

export function TokenGraph2D({ contributions, palette, year, hoveredDate = null, selectedDate = null, onDayHover, onDayClick }: TokenGraph2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const weeksData = useMemo(() => groupByWeek(contributions, year), [contributions, year]);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  const cellSize = getGraphCellSize(availableWidth, weeksData.length);
  const gap = cellSize < 16 ? 2 : 3;
  const boxSize = cellSize - gap;
  const radius = cellSize < 16 ? 2 : 3;
  const canvasWidth = DAY_LABEL_WIDTH + weeksData.length * cellSize + RIGHT_PADDING;
  const canvasHeight = MONTH_LABEL_HEIGHT + 7 * cellSize + BOTTOM_PADDING;

  const cellIndexByDate = useMemo(() => {
    const index = new Map<string, [number, number]>();
    weeksData.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        if (day) index.set(day.date, [weekIndex, dayIndex]);
      });
    });
    return index;
  }, [weeksData]);

  // Size the cells to the card: the observer reports the width before the first paint.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setAvailableWidth((previous) => (Math.abs(previous - width) < 0.5 ? previous : width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Month and day labels use the page font; draw again once it has loaded.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // On a phone the year is wider than the card: start at the latest weeks, where the activity is.
  useEffect(() => {
    const container = containerRef.current;
    if (container && container.scrollWidth > container.clientWidth) {
      container.scrollLeft = container.scrollWidth;
    }
  }, [year, canvasWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(canvasWidth * dpr);
    const pixelHeight = Math.round(canvasHeight * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const styles = getComputedStyle(canvas);
    const labelColor = styles.getPropertyValue("--service-text-muted").trim() || "#a8b3c5";
    const focusColor = styles.getPropertyValue("--service-focus").trim() || "#75b6ff";
    const fontFamily = styles.fontFamily || FONT_FAMILY;

    ctx.font = `500 ${LABEL_FONT_SIZE}px ${fontFamily}`;
    ctx.fillStyle = labelColor;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    let lastMonth = -1;
    for (let weekIndex = 0; weekIndex < weeksData.length; weekIndex++) {
      const week = weeksData[weekIndex];
      const firstDay = week.days.find((d) => d !== null);
      if (firstDay) {
        const month = getMonth(parseISO(firstDay.date));
        if (month !== lastMonth) {
          const x = DAY_LABEL_WIDTH + weekIndex * cellSize;
          ctx.fillText(MONTH_LABELS_SHORT[month], x, MONTH_LABEL_HEIGHT - 8);
          lastMonth = month;
        }
      }
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const dayIndex of [1, 3, 5]) {
      const y = MONTH_LABEL_HEIGHT + dayIndex * cellSize + boxSize / 2;
      ctx.fillText(DAY_LABELS_SHORT[dayIndex], DAY_LABEL_WIDTH - 8, y);
    }

    for (let weekIndex = 0; weekIndex < weeksData.length; weekIndex++) {
      const week = weeksData[weekIndex];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = week.days[dayIndex];
        const x = DAY_LABEL_WIDTH + weekIndex * cellSize;
        const y = MONTH_LABEL_HEIGHT + dayIndex * cellSize;

        ctx.fillStyle = getDarkGraphColor(palette, day?.intensity ?? 0);
        roundRect(ctx, x, y, boxSize, boxSize, radius);
        ctx.fill();
      }
    }

    const outline = (date: string | null, color: string, width: number) => {
      const cell = date ? cellIndexByDate.get(date) : undefined;
      if (!cell) return;
      const [weekIndex, dayIndex] = cell;
      const x = DAY_LABEL_WIDTH + weekIndex * cellSize;
      const y = MONTH_LABEL_HEIGHT + dayIndex * cellSize;
      const inset = width / 2 + 0.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      roundRect(ctx, x - inset, y - inset, boxSize + inset * 2, boxSize + inset * 2, radius + 1);
      ctx.stroke();
    };
    if (hoveredDate && hoveredDate !== selectedDate) outline(hoveredDate, "rgba(244, 247, 251, 0.85)", 1);
    outline(selectedDate, focusColor, 1.5);
  }, [palette, weeksData, cellIndexByDate, cellSize, boxSize, radius, canvasWidth, canvasHeight, hoveredDate, selectedDate, fontsReady]);

  const getDayAtPosition = useCallback(
    (clientX: number, clientY: number): { day: DailyContribution | null; position: TooltipPosition } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const gridX = x - DAY_LABEL_WIDTH;
      const gridY = y - MONTH_LABEL_HEIGHT;

      if (gridX < 0 || gridY < 0) return null;

      const weekIndex = Math.floor(gridX / cellSize);
      const dayIndex = Math.floor(gridY / cellSize);

      if (weekIndex < 0 || weekIndex >= weeksData.length || dayIndex < 0 || dayIndex >= 7) return null;

      const day = weeksData[weekIndex]?.days[dayIndex] ?? null;
      return { day, position: { x: clientX, y: clientY } };
    },
    [weeksData, cellSize]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const result = getDayAtPosition(e.clientX, e.clientY);
      if (result) {
        onDayHover(result.day, result.position);
      } else {
        onDayHover(null, null);
      }
    },
    [getDayAtPosition, onDayHover]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const result = getDayAtPosition(e.clientX, e.clientY);
      if (result?.day) onDayClick(result.day);
    },
    [getDayAtPosition, onDayClick]
  );

  return (
    <Container ref={containerRef}>
      <GraphCanvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onDayHover(null, null)}
        onClick={handleClick}
        style={{ minWidth: canvasWidth }}
      />
    </Container>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
