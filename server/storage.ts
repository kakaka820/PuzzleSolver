//データの保存、取得ロジック


import { db } from "./db";
import {
  puzzles,
  type InsertPuzzle,
  type Puzzle
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPuzzles(): Promise<Puzzle[]>;
  getPuzzle(id: number): Promise<Puzzle | undefined>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
}

export class DatabaseStorage implements IStorage {
  async getPuzzles(): Promise<Puzzle[]> {
    return await db.select().from(puzzles);
  }

  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, id));
    return puzzle;
  }

  async createPuzzle(insertPuzzle: InsertPuzzle): Promise<Puzzle> {
    const [puzzle] = await db.insert(puzzles).values(insertPuzzle).returning();
    return puzzle;
  }
}

export const storage = new DatabaseStorage();
