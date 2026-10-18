import { describe, expect, it } from "vitest";
import { gradeQuestion, studentQuestions } from "./quiz";

const questions = [{ id: 1, question: "2 + 2?", options: ["3", "4"], correctAnswer: 1, explanation: "Two plus two equals four." }];

describe("protected quiz answers", () => {
  it("does not disclose answers or explanations before submission", () => {
    expect(studentQuestions(questions)).toEqual([{ id: 1, question: "2 + 2?", options: ["3", "4"] }]);
  });
  it("grades the submitted option using the stored answer", () => {
    expect(gradeQuestion(questions, 1, 0).correct).toBe(false);
    expect(gradeQuestion(questions, 1, 1)).toEqual({ correct: true, correctAnswer: 1, explanation: questions[0]?.explanation });
  });
  it("rejects unknown questions and tampered options", () => {
    expect(() => gradeQuestion(questions, 2, 0)).toThrow();
    for (const option of [-1, 2, 0.5, NaN]) expect(() => gradeQuestion(questions, 1, option)).toThrow();
  });
});