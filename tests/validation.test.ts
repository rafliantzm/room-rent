import { describe, it, expect } from "vitest";
import {
  roomFormSchema,
  bookingFormSchema,
  rejectBookingSchema,
  cancelBookingSchema,
  validatePdfMetadata,
  validatePdfBytes,
  validateImageMetadata,
  validateImageBytes,
} from "@/lib/validation";
import { getBookingDateBounds } from "@/lib/dates";

describe("PRD Validation Schemas (v1.2)", () => {
  describe("Room Form Schema (FR-08)", () => {
    it("should accept valid room input and uppercase the code", () => {
      const valid = {
        code: "r-101",
        name: "Ruang Teori 101",
        building: "Gedung Kuliah Bersama A",
        floor: "Lantai 1",
        capacity: 40,
        description: "Dilengkapi AC dan proyektor",
        is_active: true,
        image_path: "rooms/a0000000-0000-0000-0000-000000000001/photo.jpg",
      };

      const result = roomFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("R-101");
        expect(result.data.image_path).toBe("rooms/a0000000-0000-0000-0000-000000000001/photo.jpg");
      }
    });

    it("should accept valid room input with null/undefined image_path", () => {
      const valid = {
        code: "R-102",
        name: "Ruang Teori 102",
        building: "Gedung A",
        floor: "Lantai 1",
        capacity: 35,
      };

      const result = roomFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid code containing special characters", () => {
      const invalid = {
        code: "R_101!",
        name: "Ruang Teori",
        building: "Gedung A",
        floor: "1",
        capacity: 40,
      };
      const result = roomFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject capacity < 1 or > 1000", () => {
      expect(
        roomFormSchema.safeParse({
          code: "R-101",
          name: "Ruang Teori",
          building: "Gedung A",
          floor: "1",
          capacity: 0,
        }).success
      ).toBe(false);

      expect(
        roomFormSchema.safeParse({
          code: "R-101",
          name: "Ruang Teori",
          building: "Gedung A",
          floor: "1",
          capacity: 1001,
        }).success
      ).toBe(false);
    });

    it("should reject description > 500 characters", () => {
      const longDesc = "a".repeat(501);
      const result = roomFormSchema.safeParse({
        code: "R-101",
        name: "Ruang Teori",
        building: "Gedung A",
        floor: "1",
        capacity: 30,
        description: longDesc,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Booking Submission Schema (FR-04, BR-03 to BR-07, BR-19)", () => {
    const { maxDate } = getBookingDateBounds();
    const validBooking = {
      room_id: "a0000000-0000-4000-8000-000000000001",
      borrower_name: "Aditya Bagas",
      borrower_nim: "24.01.53.0003",
      date: maxDate,
      start_time: "14:00",
      end_time: "16:00",
      purpose: "Rapat koordinasi praktikum algoritma semester ganjil",
      participant_count: 25,
      request_key: "b0000000-0000-4000-8000-000000000002",
      letter_path: "user-123/b0000000-0000-4000-8000-000000000002.pdf",
    };

    it("should accept valid booking input with borrower name and NIM", () => {
      const result = bookingFormSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.borrower_name).toBe("Aditya Bagas");
        expect(result.data.borrower_nim).toBe("24.01.53.0003");
      }
    });

    it("should accept NIM with dot, hyphen, or alphanumeric", () => {
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "24.01.53.0003" }).success
      ).toBe(true);
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "24-01-53-0003" }).success
      ).toBe(true);
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "A1220260001" }).success
      ).toBe(true);
    });

    it("should reject submission without borrower_name or name < 3 characters", () => {
      const withoutName = { ...validBooking };
      // @ts-expect-error Testing missing mandatory borrower_name
      delete withoutName.borrower_name;
      expect(bookingFormSchema.safeParse(withoutName).success).toBe(false);

      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_name: "Ad" }).success
      ).toBe(false);

      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_name: "   " }).success
      ).toBe(false);
    });

    it("should reject borrower_name > 100 characters", () => {
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_name: "A".repeat(101) }).success
      ).toBe(false);
    });

    it("should reject submission without borrower_nim or NIM < 5 characters", () => {
      const withoutNim = { ...validBooking };
      // @ts-expect-error Testing missing mandatory borrower_nim
      delete withoutNim.borrower_nim;
      expect(bookingFormSchema.safeParse(withoutNim).success).toBe(false);

      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "1234" }).success
      ).toBe(false);

      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "     " }).success
      ).toBe(false);
    });

    it("should reject borrower_nim > 25 characters", () => {
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "12345678901234567890123456" }).success
      ).toBe(false);
    });

    it("should reject borrower_nim with invalid special characters", () => {
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "24@01#53" }).success
      ).toBe(false);
      expect(
        bookingFormSchema.safeParse({ ...validBooking, borrower_nim: "24 01 53 0003" }).success
      ).toBe(false);
    });

    it("should reject submission without letter_path (BR-19)", () => {
      const withoutLetter = { ...validBooking };
      // @ts-expect-error Testing missing mandatory property
      delete withoutLetter.letter_path;
      const result = bookingFormSchema.safeParse(withoutLetter);
      expect(result.success).toBe(false);
    });

    it("should reject empty letter_path", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        letter_path: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject purpose < 10 characters", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        purpose: "Rapat",
      });
      expect(result.success).toBe(false);
    });

    it("should reject purpose > 200 characters", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        purpose: "R".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration < 30 minutes (BR-04)", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        start_time: "10:00",
        end_time: "10:00",
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration > 4 hours (BR-04)", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        start_time: "08:00",
        end_time: "13:00", // 5 hours
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-operational hours (before 07.00 or after 21.00) (BR-03)", () => {
      const resultEarly = bookingFormSchema.safeParse({
        ...validBooking,
        start_time: "06:30",
        end_time: "08:00",
      });
      expect(resultEarly.success).toBe(false);

      const resultLate = bookingFormSchema.safeParse({
        ...validBooking,
        start_time: "20:00",
        end_time: "21:30",
      });
      expect(resultLate.success).toBe(false);
    });

    it("should reject end_time earlier than start_time", () => {
      const result = bookingFormSchema.safeParse({
        ...validBooking,
        start_time: "14:00",
        end_time: "12:00",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("File Validation Helpers (PRD v1.2 FR-04 & FR-08)", () => {
    it("should validate PDF metadata (accept valid PDF under 5 MB)", () => {
      const result = validatePdfMetadata({
        name: "surat-permohonan.pdf",
        size: 1024 * 1024, // 1 MB
        type: "application/pdf",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject PDF larger than 5 MB", () => {
      const result = validatePdfMetadata({
        name: "surat-besar.pdf",
        size: 6 * 1024 * 1024, // 6 MB
        type: "application/pdf",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("5 MB");
    });

    it("should reject non-PDF file extension or MIME", () => {
      const result1 = validatePdfMetadata({
        name: "surat.docx",
        size: 50000,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      expect(result1.valid).toBe(false);

      const result2 = validatePdfMetadata({
        name: "surat.pdf.exe",
        size: 50000,
        type: "application/x-msdownload",
      });
      expect(result2.valid).toBe(false);
    });

    it("should validate PDF magic bytes (%PDF-)", () => {
      const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      expect(validatePdfBytes(validPdfBytes).valid).toBe(true);

      const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
      expect(validatePdfBytes(invalidBytes).valid).toBe(false);
    });

    it("should validate image metadata (accept JPEG, PNG, WebP under 3 MB)", () => {
      expect(
        validateImageMetadata({
          name: "aula.jpg",
          size: 2 * 1024 * 1024,
          type: "image/jpeg",
        }).valid
      ).toBe(true);

      expect(
        validateImageMetadata({
          name: "lab.png",
          size: 1.5 * 1024 * 1024,
          type: "image/png",
        }).valid
      ).toBe(true);

      expect(
        validateImageMetadata({
          name: "seminar.webp",
          size: 500 * 1024,
          type: "image/webp",
        }).valid
      ).toBe(true);
    });

    it("should reject image larger than 3 MB", () => {
      const result = validateImageMetadata({
        name: "foto.jpg",
        size: 4 * 1024 * 1024,
        type: "image/jpeg",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("3 MB");
    });

    it("should reject unsupported image formats (e.g. GIF, SVG, BMP)", () => {
      const result = validateImageMetadata({
        name: "animasi.gif",
        size: 100000,
        type: "image/gif",
      });
      expect(result.valid).toBe(false);
    });

    it("should validate image magic bytes (JPEG, PNG, WebP)", () => {
      // JPEG
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(validateImageBytes(jpegBytes).valid).toBe(true);

      // PNG
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(validateImageBytes(pngBytes).valid).toBe(true);

      // WebP (RIFF....WEBP)
      const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      expect(validateImageBytes(webpBytes).valid).toBe(true);

      // Invalid
      const fakeBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      expect(validateImageBytes(fakeBytes).valid).toBe(false);
    });
  });

  describe("Admin Decision Schemas (FR-09)", () => {
    it("should require rejection reason between 10 and 300 characters", () => {
      expect(rejectBookingSchema.safeParse({ reason: "pendek" }).success).toBe(false);
      expect(rejectBookingSchema.safeParse({ reason: "Ruangan sedang digunakan untuk ujian fakultas" }).success).toBe(true);
      expect(rejectBookingSchema.safeParse({ reason: "A".repeat(301) }).success).toBe(false);
    });

    it("should require cancellation reason between 10 and 300 characters", () => {
      expect(cancelBookingSchema.safeParse({ reason: "singkat" }).success).toBe(false);
      expect(
        cancelBookingSchema.safeParse({
          reason: "Terdapat perbaikan instalasi proyektor mendadak di ruangan ini.",
        }).success
      ).toBe(true);
      expect(cancelBookingSchema.safeParse({ reason: "A".repeat(301) }).success).toBe(false);
    });
  });
});
