// A* Search Algorithm for Water Sort / Ball Sort Puzzles
// 改良版：Nut Sort / Water Sort 両対応のソルバー
import { PuzzleState, Move } from "./schema";

export type GameMode = "nut" | "water";

function isValidMove(
  state: PuzzleState, 
  fromIdx: number, 
  toIdx: number, 
  capacity: number,
  mode: GameMode
): boolean {
  const fromTube = state[fromIdx];
  const toTube = state[toIdx];

  if (fromTube.length === 0) return false;
  if (toTube.length >= capacity) return false;

  const colorToMove = fromTube[fromTube.length - 1];
  if (toTube.length === 0) return true;

  const topOfDest = toTube[toTube.length - 1];
  return colorToMove === topOfDest;
}

// 移動処理：モードによって「まとめて動かす数」が変わる
function applyMove(state: PuzzleState, move: Move, capacity: number, mode: GameMode): PuzzleState {
  const newState = state.map(tube => [...tube]);
  const fromTube = newState[move.from];
  const toTube = newState[move.to];
  const color = fromTube[fromTube.length - 1];

  let moveCount = 1;
  if (mode === "water") {
    // 同じ色が連続している数を確認
    let continuous = 0;
    for (let i = fromTube.length - 1; i >= 0; i--) {
      if (fromTube[i] === color) continuous++;
      else break;
    }
    // 移動先の空き容量と、連続している数の小さい方が移動可能数
    const space = capacity - toTube.length;
    moveCount = Math.min(continuous, space);
  }

  for (let i = 0; i < moveCount; i++) {
    toTube.push(fromTube.pop()!);
  }
  return newState;
}

function heuristic(state: PuzzleState, tubeCapacity: number): number {
  let score = 0;
  for (const tube of state) {
    if (tube.length === 0) continue;
    
    // Penalty for mixed colors
    let switches = 0;
    for (let i = 0; i < tube.length - 1; i++) {
      if (tube[i] !== tube[i + 1]) switches++;
    }
    score += switches * 10;

    // Penalty for non-full tubes that are homogeneous (should be full)
    if (switches === 0 && tube.length < tubeCapacity) {
      score += (tubeCapacity - tube.length) * 2;
    }
  }
  return score;
}

function serializeState(state: PuzzleState): string {
  return JSON.stringify(state);
}

function isSolved(state: PuzzleState, tubeCapacity: number): boolean {
  for (const tube of state) {
    if (tube.length === 0) continue;
    if (tube.length !== tubeCapacity) return false;
    // Check if all same color
    const firstColor = tube[0];
    for (let i = 1; i < tube.length; i++) {
      if (tube[i] !== firstColor) return false;
    }
  }
  return true;
}

export function solvePuzzle(initialState: PuzzleState, tubeCapacity: number = 4, mode: GameMode = "nut"): { moves: Move[], solvable: boolean } {
  // Priority Queue would be better, but simple array sort for this scale is OK
  type Node = {
    state: PuzzleState;
    g: number; // Cost from start
    h: number; // Heuristic cost to goal
    f: number; // g + h
    moves: Move[];
    stateKey: string;
  };

  const startNode: Node = {
    state: initialState,
    g: 0,
    h: heuristic(initialState, tubeCapacity),
    f: heuristic(initialState, tubeCapacity),
    moves: [],
    stateKey: serializeState(initialState)
  };

  const openSet: Node[] = [startNode];
  const closedSet = new Set<string>();

  const MAX_ITERATIONS = 50000; 
  let iterations = 0;

  while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (isSolved(current.state, tubeCapacity)) {
      return { moves: current.moves, solvable: true };
    }

    closedSet.add(current.stateKey);

    for (let i = 0; i < current.state.length; i++) {
      for (let j = 0; j < current.state.length; j++) {
        if (i === j) continue;

        if (isValidMove(current.state, i, j, tubeCapacity, mode)) {
          const newState = applyMove(current.state, { from: i, to: j }, tubeCapacity, mode);
          const newStateKey = serializeState(newState);

          if (closedSet.has(newStateKey)) continue;

          const existingOpenNode = openSet.find(n => n.stateKey === newStateKey);
          const newG = current.g + 1;

          if (existingOpenNode && existingOpenNode.g <= newG) continue;

          const newH = heuristic(newState, tubeCapacity);
          const newNode: Node = {
            state: newState,
            g: newG,
            h: newH,
            f: newG + newH,
            moves: [...current.moves, { from: i, to: j }],
            stateKey: newStateKey
          };

          if (existingOpenNode) {
            existingOpenNode.g = newG;
            existingOpenNode.f = newG + newH;
            existingOpenNode.moves = newNode.moves;
          } else {
            openSet.push(newNode);
          }
        }
      }
    }
  }

  return { moves: [], solvable: false };
}

