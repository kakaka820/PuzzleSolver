
//APIルート定義

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { solvePuzzle } from "@shared/solver";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.solver.solve.path, async (req, res) => {
    try {
      const { tubes } = api.solver.solve.input.parse(req.body);
      
      // Run the solver
      // Default capacity 4 for standard puzzles
      const result = solvePuzzle(tubes, 4);
      
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error during solving" });
      }
    }
  });

  app.get(api.puzzles.list.path, async (req, res) => {
    const puzzles = await storage.getPuzzles();
    res.json(puzzles);
  });

  app.post(api.puzzles.create.path, async (req, res) => {
    try {
      const input = api.puzzles.create.input.parse(req.body);
      const puzzle = await storage.createPuzzle(input);
      res.status(201).json(puzzle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.puzzles.get.path, async (req, res) => {
    const puzzle = await storage.getPuzzle(Number(req.params.id));
    if (!puzzle) {
      return res.status(404).json({ message: "Puzzle not found" });
    }
    res.json(puzzle);
  });

  return httpServer;
}
