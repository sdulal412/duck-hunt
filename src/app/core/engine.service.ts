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
    LERP: 0.05,
    FALL_SPEED: 8,
    BOUNDS_X: 730,
    BOUNDS_Y: 350,
    RANDOM_TURN_CHANCE: 0.6,
    DIRECTION_CHANGE_RATE: 45,
  },
  ANIMATION: { DUCK: 6, DOG_WALK: 10, DOG_ALERT: 15 },
};

@Injectable 
({ providedIn: 'root' })

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

  updateDuckPhysics(duck: Duck, frameCount: number): Duck {
    const { FALL_SPEED } = PHYSICS.DUCK;

    switch (duck.state) {
      case DuckState.FALLING:
        duck.y += FALL_SPEED;
        break;

      case DuckState.FLY_AWAY:
        duck.x += duck.vX;
        duck.y += duck.vY;
        break;

      case DuckState.FLYING:
        this.applySteering(duck);
        this.applyRandomMovement(duck, frameCount);
        this.constrainToBounds(duck);
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

    dog.frame = dog.state === DogState.CELEBRATING 
      ? 9 
      : (frameCount % 20 < 10 ? 10 : 11);

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

  private applySteering(duck: Duck): void {
    const { LERP } = PHYSICS.DUCK;
    duck.vX += (duck.targetX - duck.vX) * LERP;
    duck.vY += (duck.targetY - duck.vY) * LERP;
  }

  private applyRandomMovement(duck: Duck, frameCount: number): void {
    const { DIRECTION_CHANGE_RATE, RANDOM_TURN_CHANCE } = PHYSICS.DUCK;
    if (frameCount % DIRECTION_CHANGE_RATE === 0 && Math.random() > RANDOM_TURN_CHANCE) {

      duck.targetX = (Math.random() - 0.5) * 6;
      duck.targetY = (Math.random() - 0.5) * 6;
    }
  }

  private constrainToBounds(duck: Duck): void {
    const { BOUNDS_X, BOUNDS_Y } = PHYSICS.DUCK;

    if (duck.x > BOUNDS_X || duck.x < 0) {
      duck.vX *= -1;
      duck.targetX *= -1;
      duck.x = duck.x < 0 ? 1 : BOUNDS_X - 1;
    }

    if (duck.y < 0 || duck.y > BOUNDS_Y) {
      duck.vY *= -1;
      duck.targetY *= -1;
      duck.y = duck.y < 0 ? 1 : BOUNDS_Y - 1;
      duck.targetX = (Math.random() - 0.5) * 4;
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