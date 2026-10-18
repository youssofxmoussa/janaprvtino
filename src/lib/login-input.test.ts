import { expect, it } from "vitest";
import { validateLogin } from "./login-input";

it("rejects oversized passwords instead of silently truncating them", () => {
  expect(() => validateLogin({ email: "student@example.com", password: "a".repeat(73) })).toThrow();
  expect(validateLogin({ email: "student@example.com", password: "a".repeat(72) }).password).toHaveLength(72);
});