import type { Question } from "./course-content";

export type StudentQuestion = Pick<Question, "id" | "question" | "options">;

export function studentQuestions(questions: Question[]): StudentQuestion[] {
  return questions.map(({ id, question, options }) => ({ id, question, options }));
}

export function gradeQuestion(questions: Question[], questionId: number, option: number) {
  const question = questions.find((q) => q.id === questionId);
  if (!question || !Number.isInteger(option) || option < 0 || option >= question.options.length) {
    throw new Error("Invalid answer.");
  }
  return {
    correct: option === question.correctAnswer,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}