import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { GameStatus, GAME_CONF } from '../models/constants';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly HIGH_SCORE_KEY = 'duckHunt_highScore';

  private _round = new BehaviorSubject<number>(1);
  private _score = new BehaviorSubject<number>(0);
  private _ducksHit = new BehaviorSubject<number>(0);
  private _highScore = new BehaviorSubject<number>(0);
  private _ducksProcessed = new BehaviorSubject<number>(0);
  private _status = new BehaviorSubject<GameStatus>(GameStatus.INTRO);
  private _ammo = new BehaviorSubject<number>(GAME_CONF.BULLETS_PER_ROUND);

  ammo$ = this._ammo.asObservable();
  round$ = this._round.asObservable();
  score$ = this._score.asObservable();
  status$ = this._status.asObservable();
  ducksHit$ = this._ducksHit.asObservable();
  highScore$ = this._highScore.asObservable();
  ducksProcessed$ = this._ducksProcessed.asObservable();

  get currentAmmo() {
    return this._ammo.value;
  }
  get roundNumber() {
    return this._round.value;
  }
  get currentScore() {
    return this._score.value;
  }
  get ducksHitInRound() {
    return this._ducksHit.value;
  }
  get currentHighScore() {
    return this._highScore.value;
  }
  get ducksProcessed() {
    return this._ducksProcessed.value;
  }

  setGameStatus(status: GameStatus) {
    this._status.next(status);
  }

  constructor() {
    this.loadHighScore();
  }

  updateScore(points: number) {
    const newScore = this._score.value + points;
    this._score.next(newScore);
    this._ducksHit.next(this._ducksHit.value + 1);

    if (newScore > this._highScore.value) {
      this.saveHighScore(newScore);
    }
  }

  incrementProcessed() {
    this._ducksProcessed.next(this._ducksProcessed.value + 1);
  }

  useAmmo() {
    const remaining = Math.max(0, this._ammo.value - 1);
    this._ammo.next(remaining);
  }

  resetAmmo() {
    this._ammo.next(GAME_CONF.BULLETS_PER_ROUND);
  }

  reloadWithPenalty(): boolean {
    const penalty = 500;
    if (this._score.value >= penalty) {
      this._score.next(this._score.value - penalty);
      this.resetAmmo();
      return true;
    }
    return false;
  }

  checkRoundResult(): boolean {
    return this._ducksHit.value >= 6;
  }

  nextRound() {
    this._round.next(this._round.value + 1);
    this.resetRoundProgress();
  }

  resetGame() {
    this._score.next(0);
    this._round.next(1);
    this.resetRoundProgress();
  }

  private resetRoundProgress() {
    this._ducksHit.next(0);
    this._ducksProcessed.next(0);
    this.resetAmmo();
  }

  private loadHighScore() {
    const saved = localStorage.getItem(this.HIGH_SCORE_KEY);
    if (saved) {
      this._highScore.next(parseInt(saved, 10));
    }
  }

  private saveHighScore(score: number) {
    this._highScore.next(score);
    localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
  }
}
