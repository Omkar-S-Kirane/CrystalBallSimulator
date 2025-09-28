// src/types/solver.ts
export type SolverState = {
  sequence: number[];
  drops: number[];
  foundFloor: number | null;
  totalDrops: number;
  finished: boolean;
};
