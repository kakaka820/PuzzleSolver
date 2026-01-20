//データベースの型定義

import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Initial state: [[1, 1, 2, 2], [2, 2, 1, 1], [], []] where numbers represent colors
  initialState: jsonb("initial_state").notNull().$type<number[][]>(),
  // Solution steps: [{from: 0, to: 2}, {from: 1, to: 3}, ...]
  solution: jsonb("solution").$type<{from: number, to: number}[]>(),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  isSolvable: boolean("is_solvable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertPuzzleSchema = createInsertSchema(puzzles).omit({ 
  id: true, 
  createdAt: true, 
  solution: true,
  isSolvable: true 
});

// === TYPES ===
export type Puzzle = typeof puzzles.$inferSelect;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;

// Solver specific types
export type Tube = number[]; // [1, 1, 2, 2] - Bottom to Top
export type PuzzleState = Tube[];
export type Move = { from: number; to: number };

export type SolveRequest = {
  tubes: PuzzleState;
};

export type SolveResponse = {
  solvable: boolean;
  moves: Move[];
  error?: string;
};
