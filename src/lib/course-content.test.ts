import { describe, expect, it } from "vitest";
import { isValidMediaPath, sanitizeContent } from "./course-content";

const q = (correctAnswer: number) => ({
  question: "Q?",
  options: ["a", "b", "c"],
  correctAnswer,
  explanation: "",
});

describe("course content rules", () => {
  it("rejects a correct answer that is not one of the options", () => {
    expect(() => sanitizeContent("b1100", { questions: [q(3)] })).toThrow();
  });

  it("accepts a valid question", () => {
    expect(sanitizeContent("b1100", { questions: [q(2)] }).questions[0]?.correctAnswer).toBe(2);
  });

  it("only allows files from the same course folder", () => {
    expect(isValidMediaPath("b1100", "b1100/x.mp4")).toBe(true);
    expect(isValidMediaPath("b1100", "c1100/x.mp4")).toBe(false);
    expect(isValidMediaPath("b1100", "b1100/../c1100/x.mp4")).toBe(false);
  });

  it("rejects unknown courses", () => {
    expect(() => sanitizeContent("zzz", {})).toThrow();
  });
});
