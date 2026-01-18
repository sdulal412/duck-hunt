import { Injectable } from '@angular/core';
import { Duck } from '../models/duck.model';
import { DuckState } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class EngineService {

  updateAnimation(duck: Duck, frameCount: number) {
    if (frameCount % 5 === 0 && duck.state === DuckState.FLYING) {
      duck.frame = (duck.frame + 1) % 3;
    }
  }

updateDuckPhysics(duck: Duck): Duck {
  switch (duck.state) {
    case DuckState.FLYING:
      this.moveZigZag(duck);
      break;
    case DuckState.HIT:
      break;
    case DuckState.FALLING:
      duck.y += 8;
      break;
    case DuckState.ESCAPED:
      duck.y -= 8;
      break;
  }
  return duck;
}

private moveZigZag(duck: Duck) {
  duck.x += duck.vX;
  duck.y += duck.vY;
  const grassLine = 375;

  if (duck.x <= 0 || duck.x >= 800 - duck.width) {
    duck.vX *= -1;
  }
  if (duck.y <= 0) {
    duck.vY = Math.abs(duck.vY); 
  }
  if (duck.y < grassLine && (duck.y + duck.height) >= grassLine && duck.vY > 0) {
    duck.vY *= -1;
  }
}

  checkHit(mouseX: number, mouseY: number, duck: Duck): boolean {
    return (
      mouseX >= duck.x && mouseX <= duck.x + duck.width &&
      mouseY >= duck.y && mouseY <= duck.y + duck.height &&
      duck.state === DuckState.FLYING
    );
  }
}