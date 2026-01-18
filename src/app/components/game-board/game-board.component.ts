import { CommonModule } from '@angular/common';
import { Duck } from '../../models/duck.model';
import { StateService } from '../../core/state.service';
import { AudioService } from '../../core/audio.service';
import { EngineService } from '../../core/engine.service';
import { DuckState, GameStatus } from '../../models/constants';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationId?: number;
  private frameCount = 0;

  private duckSprite = new Image();
  private backgroundImg = new Image();

  public duck?: Duck;
  public status: GameStatus = GameStatus.INTRO;

  constructor(
    private engine: EngineService, 
    private state: StateService,
    private audio: AudioService
  ) {
    this.initAssets();
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  private initAssets() {
    this.duckSprite.src = 'assets/sprites/duck_sheet.png';
    this.backgroundImg.src = 'assets/sprites/background.png';

    const bgLoad = new Promise((resolve) => this.backgroundImg.onload = () => resolve(true));
    const duckLoad = new Promise((resolve) => this.duckSprite.onload = () => resolve(true));

    Promise.all([bgLoad, duckLoad]).then(() => {
      this.startIntro();
    });
  }

  private startIntro() {
    this.status = GameStatus.INTRO;
    this.startGameLoop();
    
    setTimeout(() => {
      this.spawnDuck();
      this.status = GameStatus.PLAYING;
    }, 1500);
  }

  private startGameLoop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    const loop = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private update() {
    this.frameCount++;
    
    if (this.status === GameStatus.PLAYING && this.duck) {
      this.duck = this.engine.updateDuckPhysics(this.duck);
      this.engine.updateAnimation(this.duck, this.frameCount);

      if ((this.duck.state === DuckState.FALLING && this.duck.y > 350) || 
          (this.duck.state === DuckState.ESCAPED)) {
        this.spawnDuck();
        this.state.resetAmmo();
      }
    }
  }

  private draw() {
    if (!this.ctx) return;
    const w = 800;
    const h = 600;
    const grassLine = 375;

    this.ctx.fillStyle = '#64b0ff';
    this.ctx.fillRect(0, 0, w, h);

    if (this.backgroundImg.complete) {
      this.ctx.drawImage(this.backgroundImg, 0, 0, w, h);
    }

    if (this.duck) {
      this.renderDuck();
    }

    if (this.backgroundImg.complete) {
      this.ctx.drawImage(
        this.backgroundImg, 
        0, grassLine, w, h - grassLine, 
        0, grassLine, w, h - grassLine 
      );
    }
  }

  private renderDuck() {
    if (!this.duck) return;
    const spriteSize = 40;
    let spriteX = 0;

    if (this.duck.state === DuckState.FLYING) {
      spriteX = this.duck.frame * spriteSize;
    } else if (this.duck.state === DuckState.HIT) {
      spriteX = 3 * spriteSize; 
    } else if (this.duck.state === DuckState.FALLING) {
      spriteX = (4 + (this.duck.frame % 2)) * spriteSize;
    }

    this.ctx.save();
    if (this.duck.vX < 0 && this.duck.state === DuckState.FLYING) {
      this.ctx.translate(this.duck.x + this.duck.width, this.duck.y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.duckSprite, spriteX, 0, spriteSize, spriteSize, 0, 0, this.duck.width, this.duck.height);
    } else {
      this.ctx.drawImage(this.duckSprite, spriteX, 0, spriteSize, spriteSize, this.duck.x, this.duck.y, this.duck.width, this.duck.height);
    }
    this.ctx.restore();
  }

  public handleShoot(event: MouseEvent) {
    if (this.status !== GameStatus.PLAYING || !this.duck) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.state.currentAmmo <= 0 || this.duck.state !== DuckState.FLYING) return;
    
    this.state.useAmmo();
    this.audio.play('shot');

    if (this.engine.checkHit(x, y, this.duck)) {
      this.processHit();
    }
  }

  private processHit() {
    if (!this.duck) return;
    this.duck.state = DuckState.HIT;
    this.audio.play('hit');
    this.state.updateScore(500);

    setTimeout(() => {
      if (this.duck && this.duck.state === DuckState.HIT) {
        this.duck.state = DuckState.FALLING;
        this.audio.play('fall');
      }
    }, 500);
  }

  private spawnDuck() {
    this.duck = {
      vY: -4,
      y: 350,
      frame: 0,
      width: 64,
      targetX: 0,
      targetY: 0,
      height: 64,
      id: Math.random(),
      state: DuckState.FLYING,
      x: 200 + Math.random() * 400,
      vX: (Math.random() > 0.5 ? 3 : -3),
    };
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}