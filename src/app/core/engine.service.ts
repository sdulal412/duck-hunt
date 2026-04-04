import { Dog } from '../models/dog.model';
import { Injectable } from '@angular/core';
import { Duck } from '../models/duck.model';
import { DuckState, DogState } from '../models/constants';

const PHYSICS = {
  DOG: {
    GRAVITY: 0.6,
    JUMP_ARC: 1.2,
    GROUND_Y: 350,
    JUMP_POWER: -12,
    WALK_SPEED: 1.5,
    POPUP_LIMIT_Y: 450,
    POPUP_TARGET_Y: 265,
  },
  DUCK: {
    FALL_SPEED: 8,
    BOUNDS_Y: 340,
    BOUNDS_X: 730,
    BASE_LERP: 0.06,
    ESCAPE_SPEED: -3,
    BASE_MAX_SPEED: 4.5,
    BASE_CHANGE_RATE: 40,
    BASE_TURN_CHANCE: 0.5,
  },
  ANIMATION: { DUCK: 6, DOG_WALK: 10, DOG_ALERT: 15 },
};

@Injectable({ providedIn: 'root' })
export class EngineService {
  updateDogLogic(dog: Dog, frameCount: number): void {
    switch (dog.state) {
      case DogState.SNIFFING:
        this.handleDogSniffing(dog, frameCount);
        break;
      case DogState.FOUND:
        this.handleDogFound(dog, frameCount);
        break;
      case DogState.JUMPING:
        this.handleDogJumping(dog);
        break;
      case DogState.CELEBRATING:
      case DogState.LAUGHING:
        this.handleDogPopup(dog, frameCount);
        break;
    }
  }

  updateDuckPhysics(duck: Duck, frameCount: number, round: number = 1): Duck {
    const factor = 1 + (round - 1) * 0.25;
    const { FALL_SPEED, ESCAPE_SPEED, BOUNDS_Y } = PHYSICS.DUCK;

    switch (duck.state) {
      case DuckState.FALLING:
        duck.y += FALL_SPEED;
        break;

      case DuckState.FLY_AWAY:
        duck.targetY = ESCAPE_SPEED * factor;
        this.applyDuckSteering(duck, factor);
        duck.x += duck.vX;
        duck.y += duck.vY;
        break;

      case DuckState.FLYING:
        if (duck.vX === 0 && duck.vY === 0) {
          duck.y = BOUNDS_Y - 15;
          duck.vY = -5 * factor;
          duck.targetY = -6 * factor;
          duck.targetX = (Math.random() - 0.5) * 8;
        }

        this.applyDuckSteering(duck, factor);
        this.applyDuckRandomMovement(duck, frameCount, factor);
        this.constrainDuckBounds(duck, factor);

        duck.x += duck.vX;
        duck.y += duck.vY;
        break;
    }
    return duck;
  }

  private handleDogSniffing(dog: Dog, frameCount: number): void {
    dog.y = PHYSICS.DOG.GROUND_Y;
    dog.x += PHYSICS.DOG.WALK_SPEED;
    if (frameCount % PHYSICS.ANIMATION.DOG_WALK === 0) {
      dog.frame = (dog.frame + 1) % 4;
    }
    if (dog.x >= 320) {
      dog.state = DogState.FOUND;
      dog.frame = 4;
    }
  }

  private handleDogFound(dog: Dog, frameCount: number): void {
    if (frameCount % PHYSICS.ANIMATION.DOG_ALERT === 0) {
      dog.frame = dog.frame === 4 ? 5 : 4;
    }
    if (frameCount % 60 === 0) {
      dog.state = DogState.JUMPING;
      dog.vY = PHYSICS.DOG.JUMP_POWER;
      dog.frame = 7;
    }
  }

  private handleDogJumping(dog: Dog): void {
    dog.y += dog.vY;
    dog.vY += PHYSICS.DOG.GRAVITY;
    dog.x += PHYSICS.DOG.JUMP_ARC;
  }

  private handleDogPopup(dog: Dog, frameCount: number): void {
    dog.frame =
      dog.state === DogState.CELEBRATING ? 9 : frameCount % 20 < 10 ? 10 : 11;
    dog.y += dog.vY;

    if (dog.vY < 0 && dog.y <= PHYSICS.DOG.POPUP_TARGET_Y) {
      dog.vY = 0;
      dog.y = PHYSICS.DOG.POPUP_TARGET_Y;
      setTimeout(() => (dog.vY = 3), 2000);
    }
    if (dog.vY > 0 && dog.y > PHYSICS.DOG.POPUP_LIMIT_Y) {
      dog.state = DogState.HIDDEN;
      dog.vY = 0;
    }
  }

  private applyDuckSteering(duck: Duck, factor: number): void {
    const { BASE_LERP, BASE_MAX_SPEED } = PHYSICS.DUCK;
    const lerp = Math.min(BASE_LERP * factor, 0.3);
    const maxSpeed = BASE_MAX_SPEED * factor;

    duck.vX += (duck.targetX - duck.vX) * lerp;
    duck.vY += (duck.targetY - duck.vY) * lerp;

    duck.vX = Math.max(Math.min(duck.vX, maxSpeed), -maxSpeed);
    duck.vY = Math.max(Math.min(duck.vY, maxSpeed), -maxSpeed);
  }

  private applyDuckRandomMovement(
    duck: Duck,
    frameCount: number,
    factor: number,
  ): void {
    const { BASE_CHANGE_RATE, BASE_TURN_CHANCE } = PHYSICS.DUCK;
    const rate = Math.max(Math.floor(BASE_CHANGE_RATE / factor), 12);

    if (frameCount % rate === 0 && Math.random() > BASE_TURN_CHANCE / factor) {
      duck.targetX = (Math.random() - 0.5) * (12 * factor);
      duck.targetY = (Math.random() - 0.5) * (10 * factor);
    }
  }

  private constrainDuckBounds(duck: Duck, factor: number): void {
    if (duck.state === DuckState.FLY_AWAY) return;
    const { BOUNDS_X, BOUNDS_Y } = PHYSICS.DUCK;

    if (duck.x > BOUNDS_X || duck.x < 0) {
      duck.targetX *= -1;
      duck.x = duck.x < 0 ? 1 : BOUNDS_X - 1;
    }

    if (duck.y > BOUNDS_Y) {
      duck.y = BOUNDS_Y - 2;
      duck.vY = -2 * factor;
      duck.targetY = -4 * factor;
    } else if (duck.y < 0) {
      duck.y = 2;
      duck.vY = 2 * factor;
      duck.targetY = 4 * factor;
    }
  }

  updateAnimation(duck: Duck, frameCount: number): void {
    if (frameCount % PHYSICS.ANIMATION.DUCK === 0) duck.frame++;
  }

  checkHit(mx: number, my: number, duck: Duck): boolean {
    return (
      mx >= duck.x &&
      mx <= duck.x + duck.width &&
      my >= duck.y &&
      my <= duck.y + duck.height
    );
  }
}
