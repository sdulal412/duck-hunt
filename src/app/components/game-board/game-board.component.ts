import { Dog } from '../../models/dog.model';
import { CommonModule } from '@angular/common';
import { Duck } from '../../models/duck.model';
import { StateService } from '../../core/state.service';
import { AudioService } from '../../core/audio.service';
import { EngineService } from '../../core/engine.service';
import { DuckState, DogState, GameStatus } from '../../models/constants';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private frameCount = 0;
  private animationId?: number;
  private ctx!: CanvasRenderingContext2D;

  private dogSprite = new Image();
  private duckSprite = new Image();
  private backgroundImg = new Image();

  public duck?: Duck;
  public status: GameStatus = GameStatus.INTRO;

  public dog: Dog = {
    vY: 0,
    x: -75,
    y: 320,
    frame: 0,
    width: 150,
    height: 120,
    state: DogState.SNIFFING,
  };

  constructor(
    private audio: AudioService,
    private state: StateService,
    private engine: EngineService,
  ) {
    this.initAssets();
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
  }

  private initAssets() {
    this.dogSprite.src = 'assets/sprites/dog_sheet.png';
    this.duckSprite.src = 'assets/sprites/duck_sheet.png';
    this.backgroundImg.src = 'assets/sprites/background.png';

    const loads = [
      new Promise((r) => (this.dogSprite.onload = r)),
      new Promise((r) => (this.duckSprite.onload = r)),
      new Promise((r) => (this.backgroundImg.onload = r)),
    ];

    Promise.all(loads).then(() => this.startIntro());
  }

  private startIntro() {
    this.status = GameStatus.INTRO;
    this.dog = {
      vY: 0,
      x: -75,
      y: 350,
      frame: 0,
      width: 150,
      height: 120,
      state: DogState.SNIFFING,
    };
    this.startGameLoop();
  }

  private startGameLoop() {
    const loop = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private update() {
    this.frameCount++;

    if (this.status === GameStatus.INTRO) {
      this.engine.updateDogLogic(this.dog, this.frameCount);
      if (this.dog.state === DogState.JUMPING && this.dog.y > 450) {
        this.status = GameStatus.PLAYING;
        this.spawnDuck();
      }
    }

    if (this.status === GameStatus.PLAYING && this.duck) {
      this.duck = this.engine.updateDuckPhysics(this.duck);
      this.engine.updateAnimation(this.duck, this.frameCount);

      if (this.duck.state === DuckState.FALLING && this.duck.y > 380) {
        this.spawnDuck();
        this.state.resetAmmo();
      }
    }

    if (
      this.status === GameStatus.INTRO &&
      this.dog.state === DogState.JUMPING
    ) {

      if (this.dog.y > 450) {
        this.status = GameStatus.PLAYING;
        this.spawnDuck();
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

    const isRising = this.dog.state === DogState.JUMPING && this.dog.vY < 0;

    const isWalking =
      this.dog.state === DogState.SNIFFING || this.dog.state === DogState.FOUND;

    const isFalling = this.dog.state === DogState.JUMPING && this.dog.vY >= 0;

    if (this.status === GameStatus.INTRO && isFalling) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(0, 0, w, grassLine);
      this.ctx.clip();

      this.renderDog();

      this.ctx.restore();
    }

    if (this.duck && this.status === GameStatus.PLAYING) {
      this.renderDuck();
    }

    if (this.backgroundImg.complete) {
      this.ctx.drawImage(
        this.backgroundImg,
        0,
        grassLine,
        w,
        h - grassLine,
        0,
        grassLine,
        w,
        h - grassLine,
      );
    }

    if (this.status === GameStatus.INTRO && (isWalking || isRising)) {
      this.renderDog();
    }
  }

  private renderDog() {
    if (!this.dogSprite.complete) return;

    const sw = this.dogSprite.naturalWidth / 4;
    const sh = this.dogSprite.naturalHeight / 3;

    const col = this.dog.frame % 4;
    const row = Math.floor(this.dog.frame / 4);

    const sx = col * sw;
    const sy = row * sh;

    this.ctx.save();

    const drawX = Math.floor(this.dog.x);
    const drawY = Math.floor(this.dog.y);

    this.ctx.drawImage(
      this.dogSprite,
      sx,
      sy,
      sw - 0.1,
      sh - 0.1,
      drawX,
      drawY,
      this.dog.width,
      this.dog.height,
    );

    this.ctx.restore();
  }

  private renderDuck() {
    if (!this.duck) return;
    const spriteMap = [
      [0, 48],
      [48, 48],
      [96, 48],
      [144, 48],
      [192, 48],
      [240, 48],
      [288, 48],
      [336, 48],
    ];

    let frameIndex = 0;
    if (this.duck.state === DuckState.FLYING) {
      frameIndex =
        this.duck.vY < -1 ? this.duck.frame % 3 : 3 + (this.duck.frame % 3);
    } else if (this.duck.state === DuckState.HIT) frameIndex = 6;
    else if (this.duck.state === DuckState.FALLING) frameIndex = 7;

    const [sx, sw] = spriteMap[frameIndex];
    this.ctx.save();
    const drawX = Math.floor(this.duck.x);
    const drawY = Math.floor(this.duck.y);

    if (this.duck.vX < 0 && this.duck.state === DuckState.FLYING) {
      this.ctx.translate(drawX + this.duck.width, drawY);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        this.duckSprite,
        sx,
        0,
        sw,
        48,
        0,
        0,
        this.duck.width,
        this.duck.height,
      );
    } else {
      this.ctx.drawImage(
        this.duckSprite,
        sx,
        0,
        sw,
        48,
        drawX,
        drawY,
        this.duck.width,
        this.duck.height,
      );
    }
    this.ctx.restore();
  }

  private spawnDuck() {
    this.duck = {
      y: 350,
      vY: -4,
      frame: 0,
      width: 64,
      height: 64,
      targetX: 0,
      targetY: 0,
      id: Math.random(),
      state: DuckState.FLYING,
      x: 200 + Math.random() * 400,
      vX: Math.random() > 0.5 ? 3 : -3,
    };
  }

  public handleShoot(event: MouseEvent) {
    if (this.status !== GameStatus.PLAYING || !this.duck) return;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.state.currentAmmo <= 0 || this.duck.state !== DuckState.FLYING)
      return;

    this.state.useAmmo();
    this.audio.play('shot');
    if (this.engine.checkHit(x, y, this.duck)) {
      this.duck.state = DuckState.HIT;
      this.audio.play('hit');
      setTimeout(() => {
        if (this.duck) this.duck.state = DuckState.FALLING;
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}