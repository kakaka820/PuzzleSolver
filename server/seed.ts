//初期データ投入スクリプト

import { db } from "./db";
import { puzzles } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Clear existing puzzles (optional, but good for dev)
  // await db.delete(puzzles); 

  // Check if we have puzzles
  const existing = await db.select().from(puzzles);
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  // Easy Puzzle
  // Tube 0: [1, 1, 2, 2] (Red, Red, Blue, Blue)
  // Tube 1: [2, 2, 1, 1] (Blue, Blue, Red, Red)
  // Tube 2: []
  // Tube 3: []
  await db.insert(puzzles).values({
    name: "Easy Start",
    difficulty: "easy",
    initialState: [
      [1, 1, 2, 2], 
      [2, 2, 1, 1], 
      [], 
      []
    ],
    isSolvable: true,
  });

  // Medium Puzzle (Nut Sort Style)
  // 3 Colors, 5 Tubes
  await db.insert(puzzles).values({
    name: "Triple Mix",
    difficulty: "medium",
    initialState: [
      [1, 2, 3, 1],
      [2, 3, 1, 2],
      [3, 1, 2, 3],
      [],
      []
    ],
    isSolvable: true,
  });

  console.log("Seeding complete!");
}

seed().catch(console.error);
