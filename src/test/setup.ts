import "@testing-library/jest-dom/vitest";

Object.defineProperty(window.URL, "createObjectURL", {
  value: vi.fn(() => "blob:mock-pdf"),
  writable: true,
});

Object.defineProperty(window.URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});
