import { describe, expect, it } from "vitest";
import { addFailure, limitStatus, LOGIN_LIMITS, canManageAccount, canOpenCourse, hitLimit, tokenStillValid } from "./access";

describe("access rules", () => {
  it("admin accounts cannot be paused, edited or deleted from the list", () => {
    expect(canManageAccount({ role: "admin" }, "a", "me")).toBe(false);
  });
  it("an admin cannot change their own account from the list", () => {
    expect(canManageAccount({ role: "student" }, "me", "me")).toBe(false);
  });
  it("students can be managed", () => {
    expect(canManageAccount({ role: "student" }, "s1", "me")).toBe(true);
  });
  it("students are blocked from courses not on their account", () => {
    expect(canOpenCourse({ role: "student", courses: ["b1100"] }, "c1100")).toBe(false);
    expect(canOpenCourse({ role: "student", courses: ["b1100"] }, "b1100")).toBe(true);
  });
  it("students without a course list open every course", () => {
    expect(canOpenCourse({ role: "student" }, "c1100")).toBe(true);
  });
  it("sign out everywhere rejects older sessions", () => {
    expect(tokenStillValid(100, { session_epoch: 200 })).toBe(false);
    expect(tokenStillValid(300, { session_epoch: 200 })).toBe(true);
  });
  it("rate limit trips after the max", () => {
    for (let i = 0; i < 3; i++) expect(hitLimit("t", 3, 1000, 0)).toBe(false);
    expect(hitLimit("t", 3, 1000, 0)).toBe(true);
  });
});

describe("shared sign-in limit", () => {
  const now = 1_000_000;
  it("locks an account after 5 failed attempts within 15 minutes", () => {
    let s = null as ReturnType<typeof addFailure> | null;
    for (let i = 0; i < 4; i++) s = addFailure(s, LOGIN_LIMITS.email.windowMs, now);
    expect(limitStatus(s, LOGIN_LIMITS.email.max, now).blocked).toBe(false);
    s = addFailure(s, LOGIN_LIMITS.email.windowMs, now);
    expect(limitStatus(s, LOGIN_LIMITS.email.max, now).blocked).toBe(true);
  });
  it("unlocks once the 15 minute window passes", () => {
    let s = null as ReturnType<typeof addFailure> | null;
    for (let i = 0; i < 5; i++) s = addFailure(s, LOGIN_LIMITS.email.windowMs, now);
    expect(limitStatus(s, 5, now + 15 * 60_000).blocked).toBe(false);
  });
});
