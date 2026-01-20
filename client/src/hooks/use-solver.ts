import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type SolveResponse } from "@shared/routes";

// Define the shape of our tubes for the frontend
// Tubes are arrays of numbers (color IDs)
export type Tube = number[];

export function useSolvePuzzle() {
  return useMutation({
    mutationFn: async (tubes: Tube[]) => {
      // Validate with shared schema input first if needed, or just send JSON
      // The API expects { tubes: number[][] }
      const res = await fetch(api.solver.solve.path, {
        method: api.solver.solve.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tubes }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid puzzle configuration");
        }
        throw new Error("Failed to solve puzzle");
      }

      // Parse response with Zod schema
      return api.solver.solve.responses[200].parse(await res.json());
    },
  });
}
    
