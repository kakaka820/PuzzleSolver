//APIの型、パス定義

import { z } from 'zod';
import { insertPuzzleSchema, puzzles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  solver: {
    solve: {
      method: 'POST' as const,
      path: '/api/solve',
      input: z.object({
        tubes: z.array(z.array(z.number()))
      }),
      responses: {
        200: z.object({
          solvable: z.boolean(),
          moves: z.array(z.object({ from: z.number(), to: z.number() })),
          error: z.string().optional()
        }),
        400: errorSchemas.validation,
      },
    }
  },
  puzzles: {
    list: {
      method: 'GET' as const,
      path: '/api/puzzles',
      responses: {
        200: z.array(z.custom<typeof puzzles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/puzzles',
      input: insertPuzzleSchema,
      responses: {
        201: z.custom<typeof puzzles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/puzzles/:id',
      responses: {
        200: z.custom<typeof puzzles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export type SolveResponse = z.infer<typeof api.solver.solve.responses[200]>;

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
