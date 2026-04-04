import { DogState } from './constants';

export interface Dog {
  x: number;
  y: number;
  vY: number;
  frame: number;
  width: number;
  height: number;
  state: DogState;
}
