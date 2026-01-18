import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { GameStatus, GAME_CONF } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _score = new BehaviorSubject<number>(0);
  score$ = this._score.asObservable();

  private _ammo = new BehaviorSubject<number>(GAME_CONF.BULLETS_PER_ROUND);
  ammo$ = this._ammo.asObservable();

  private _status = new BehaviorSubject<GameStatus>(GameStatus.INTRO);
  status$ = this._status.asObservable();

  private _round = new BehaviorSubject<number>(1);
  round$ = this._round.asObservable();

  get currentAmmo() { return this._ammo.value; }
  get currentStatus() { return this._status.value; }

  updateScore(points: number) {
    this._score.next(this._score.value + points);
  }

  useAmmo() {
    if (this._ammo.value > 0) {
      this._ammo.next(this._ammo.value - 1);
    }
  }

  resetAmmo() {
    this._ammo.next(GAME_CONF.BULLETS_PER_ROUND);
  }

  setGameStatus(status: GameStatus) {
    this._status.next(status);
  }

  nextRound() {
    this._round.next(this._round.value + 1);
  }
}