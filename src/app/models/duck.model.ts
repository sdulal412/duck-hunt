import { DuckState } from './constants';

export interface Duck {
  id: number;
  width: number;
  frame: number;
  height: number;
  state: DuckState;

  y: number;
  x: number;
  vY: number;
  vX: number;
  targetX: number;
  targetY: number;
}
