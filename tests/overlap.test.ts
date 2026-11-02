import { describe, it, expect } from "vitest";

// Overlap function mirroring PostgreSQL GiST exclusion constraint logic:
// tstzrange(A.start_at, A.end_at, '[)') && tstzrange(B.start_at, B.end_at, '[)')
// is equivalent to: A.start_at < B.end_at AND A.end_at > B.start_at
export function checkIntervalOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

describe("PRD §8 Formula Bentrok & Exclusion Constraint Logic", () => {
  it("should detect overlapping intervals (08:00-10:00 and 09:00-11:00)", () => {
    const aStart = new Date("2026-11-02T01:00:00Z"); // 08:00 WIB
    const aEnd = new Date("2026-11-02T03:00:00Z");   // 10:00 WIB
    const bStart = new Date("2026-11-02T02:00:00Z"); // 09:00 WIB
    const bEnd = new Date("2026-11-02T04:00:00Z");   // 11:00 WIB

    expect(checkIntervalOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    expect(checkIntervalOverlap(bStart, bEnd, aStart, aEnd)).toBe(true);
  });

  it("should NOT detect overlap for adjacent intervals (08:00-10:00 and 10:00-12:00)", () => {
    const aStart = new Date("2026-11-02T01:00:00Z"); // 08:00 WIB
    const aEnd = new Date("2026-11-02T03:00:00Z");   // 10:00 WIB
    const bStart = new Date("2026-11-02T03:00:00Z"); // 10:00 WIB
    const bEnd = new Date("2026-11-02T05:00:00Z");   // 12:00 WIB

    expect(checkIntervalOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
    expect(checkIntervalOverlap(bStart, bEnd, aStart, aEnd)).toBe(false);
  });

  it("should detect complete enclosure (08:00-12:00 and 09:00-10:00)", () => {
    const aStart = new Date("2026-11-02T01:00:00Z"); // 08:00 WIB
    const aEnd = new Date("2026-11-02T05:00:00Z");   // 12:00 WIB
    const bStart = new Date("2026-11-02T02:00:00Z"); // 09:00 WIB
    const bEnd = new Date("2026-11-02T03:00:00Z");   // 10:00 WIB

    expect(checkIntervalOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    expect(checkIntervalOverlap(bStart, bEnd, aStart, aEnd)).toBe(true);
  });

  it("should NOT detect overlap for completely separate intervals on same day", () => {
    const aStart = new Date("2026-11-02T01:00:00Z"); // 08:00 WIB
    const aEnd = new Date("2026-11-02T03:00:00Z");   // 10:00 WIB
    const bStart = new Date("2026-11-02T07:00:00Z"); // 14:00 WIB
    const bEnd = new Date("2026-11-02T09:00:00Z");   // 16:00 WIB

    expect(checkIntervalOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
  });
});
