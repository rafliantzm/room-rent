import { describe, it, expect } from "vitest";
import {
  wibToUTCISO,
  getWIBDateString,
  getWIBTimeString,
  formatTimeIntervalWIB,
  getBookingDateBounds,
} from "@/lib/dates";

describe("Business Rules & Date Utilities (BR-03 to BR-08, BR-17)", () => {
  it("should convert WIB date & time correctly to UTC ISO (UTC+7)", () => {
    // 08:00 WIB on 2026-11-02 is 01:00 UTC on 2026-11-02
    const utcIso = wibToUTCISO("2026-11-02", "08:00");
    const dateObj = new Date(utcIso);
    expect(dateObj.toISOString()).toBe("2026-11-02T01:00:00.000Z");
  });

  it("should format time interval in WIB notation correctly", () => {
    const start = "2026-11-02T01:00:00.000Z"; // 08:00 WIB
    const end = "2026-11-02T03:00:00.000Z";   // 10:00 WIB
    const intervalStr = formatTimeIntervalWIB(start, end);
    expect(intervalStr).toBe("08.00 – 10.00 WIB");

    expect(getWIBDateString(start)).toBe("2026-11-02");
    expect(getWIBTimeString(start)).toBe("08:00");
  });

  it("should calculate booking date bounds: today and +30 days", () => {
    const { minDate, maxDate } = getBookingDateBounds();
    expect(minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(maxDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const minTime = new Date(minDate).getTime();
    const maxTime = new Date(maxDate).getTime();
    const diffDays = Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  describe("PRD State Transitions Validation", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "rejected", "cancelled"],
      approved: ["cancelled"],
      rejected: [],
      cancelled: [],
    };

    function isValidTransition(from: string, to: string): boolean {
      return validTransitions[from]?.includes(to) ?? false;
    }

    it("should allow legal transitions per PRD §8 state diagram", () => {
      expect(isValidTransition("pending", "approved")).toBe(true);
      expect(isValidTransition("pending", "rejected")).toBe(true);
      expect(isValidTransition("pending", "cancelled")).toBe(true);
      expect(isValidTransition("approved", "cancelled")).toBe(true);
    });

    it("should reject illegal transitions per PRD §8 state diagram", () => {
      expect(isValidTransition("rejected", "approved")).toBe(false);
      expect(isValidTransition("rejected", "pending")).toBe(false);
      expect(isValidTransition("cancelled", "approved")).toBe(false);
      expect(isValidTransition("cancelled", "pending")).toBe(false);
      expect(isValidTransition("approved", "rejected")).toBe(false);
      expect(isValidTransition("approved", "pending")).toBe(false);
    });
  });
});
