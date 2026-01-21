import { Injectable } from '@angular/core';
import { Dog } from '../models/dog.model';
import { Duck } from '../models/duck.model';
import { DuckState, DogState } from '../models/constants';

@Injectable({ providedIn: 'root' })
export class EngineService {
  updateDogLogic(dog: Dog, frameCount: number) {
    switch (dog.state) {
      case DogState.SNIFFING:
        dog.y = 350;
        dog.x += 1.5;

        if (frameCount % 10 === 0) dog.frame = (dog.frame + 1) % 4;
        if (dog.x >= 320) {
          dog.state = DogState.FOUND;
          dog.frame = 4;
        }
        break;

      case DogState.FOUND:
        if (frameCount % 15 === 0) dog.frame = dog.frame === 4 ? 5 : 4;
        if (frameCount % 60 === 0) {
          dog.state = DogState.JUMPING;
          dog.vY = -12;
          dog.frame = 7;
        }
        break;

      case DogState.JUMPING:
        dog.frame = 7;
        dog.y += dog.vY;
        dog.vY += 0.6;
        dog.x += 1.2;
        break;
    }
  }

  updateDuckPhysics(duck: Duck): Duck {
    switch (duck.state) {
      case DuckState.FLYING:
        duck.x += duck.vX;
        duck.y += duck.vY;

        if (duck.x <= 0 || duck.x >= 740) duck.vX *= -1;
        if (duck.y <= 0 || duck.y >= 350) duck.vY *= -1;
        break;

      case DuckState.HIT:
        duck.vX = 0;
        duck.vY = 0;
        break;

      case DuckState.FALLING:
        duck.y += 8;
        break;
    }
    return duck;
  }

  updateAnimation(duck: Duck, frameCount: number) {
    if (frameCount % 6 === 0) {
      duck.frame++;
    }
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