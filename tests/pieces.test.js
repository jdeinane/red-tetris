import { generateBag, generateSequence } from "../shared/pieces.js";

test("generateBag produces 7 unique pieces", () => {
  const b = generateBag();
  expect(b.length).toBe(7);
  expect(new Set(b).size).toBe(7);
});

test("generateSequence returns expected length", () => {
  const seq = generateSequence(50);
  expect(seq.length).toBe(50);
});
