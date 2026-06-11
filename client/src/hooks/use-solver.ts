import { useMutation } from "@tanstack/react-query";
import { solvePuzzle } from "@shared/solver";
import type { SolveResponse } from "@shared/routes";

export type Tube = number[];

export function useSolvePuzzle() {
  return useMutation({
    mutationFn: async (tubes: Tube[]): Promise<SolveResponse> => {
      const result = solvePuzzle(tubes, 4);
      return result;
    },
  });
}
