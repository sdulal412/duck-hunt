import { Dog } from '../../models/dog.model';
import { Duck } from '../../models/duck.model';
import { CommonModule } from '@angular/common';
import { StateService } from '../../core/state.service';
import { AudioService } from '../../core/audio.service';
import { EngineService } from '../../core/engine.service';
import { DuckState, DogState, GameStatus } from '../../models/constants';
import { IntroScreenComponent } from '../intro-screen/intro-screen.component';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss'],
  imports: [CommonModule, IntroScreenComponent],
})

export class GameBoardComponent implements AfterViewInit, OnDestroy {

  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private frameCount = 0;
  private flashFrames = 0;
  private escapeTimer: any;
  private animationId?: number;
  private ctx!: CanvasRenderingContext2D;

  private dogSprite = new Image();
  private duckSprite = new Image();
  private backgroundImg = new Image();

  public duck?: Duck;
  public status: GameStatus = GameStatus.MENU;
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
    private zone: NgZone,
    public state: StateService,
    public audio: AudioService,
    public engine: EngineService,
  ) {
    this.initAssets();
  }

  // --- INITIALIZATION & ASSETS ---

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
  }

  private initAssets() {
    this.dogSprite.src = 'assets/sprites/dog_sheet.png';
    this.duckSprite.src = 'assets/sprites/duck_sheet.png';
    this.backgroundImg.src = 'assets/sprites/background.png';

    Promise.all([
      new Promise((r) => (this.dogSprite.onload = r)),
      new Promise((r) => (this.duckSprite.onload = r)),
      new Promise((r) => (this.backgroundImg.onload = r)),
      document.fonts.load('10pt "Press Start 2P"'),
    ]);
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.escapeTimer) clearTimeout(this.escapeTimer);
  }

  // --- GAME FLOW CONTROL ---

  get isMenu(): boolean {
    return this.status === GameStatus.MENU;
  }

  public onIntroStart() {
    this.zone.run(() => {
      this.status = GameStatus.INTRO;
      this.startIntro();
    });
  }

  private startIntro() {
    this.audio.resume();
    this.zone.run(() => {
      this.status = GameStatus.INTRO;
      this.state.setGameStatus(GameStatus.INTRO);
    });
    this.dog.x = -75;
    this.dog.y = 350;
    this.dog.state = DogState.SNIFFING;
    this.startGameLoop();
  }

  private spawnDuck() {
    this.dog.state = DogState.HIDDEN;
    this.dog.y = 500;

    const baseSpeed = 1.0 + this.state.roundNumber * 0.5;
    this.duck = {
      x: 100 + Math.random() * 600,
      y: 350,
      vX: (Math.random() > 0.5 ? 1 : -1) * baseSpeed,
      vY: -baseSpeed,
      targetX: (Math.random() > 0.5 ? 1 : -1) * baseSpeed,
      targetY: -baseSpeed,
      frame: 0,
      width: 64,
      height: 64,
      id: Math.random(),
      state: DuckState.FLYING,
    };

    this.escapeTimer = setTimeout(() => {
      if (this.duck?.state === DuckState.FLYING) {
        this.duck.state = DuckState.FLY_AWAY;
        this.duck.vX = (Math.random() - 0.5) * 16;
        this.duck.vY = -(12 + Math.random() * 6);
        this.duck.targetX = this.duck.vX;
        this.duck.targetY = this.duck.vY;
      }
    }, 8000);
  }

  private processDuckResult(isHit: boolean) {
    if (this.escapeTimer) clearTimeout(this.escapeTimer);

    const lastX = this.duck ? this.duck.x : 400;
    this.duck = undefined;
    this.state.incrementProcessed();

    if (isHit) {
      this.dog.state = DogState.CELEBRATING;
      this.dog.x = Math.max(0, Math.min(lastX - 40, 650));
    } else {
      this.dog.state = DogState.LAUGHING;
      this.dog.x = 325;
    }
    this.dog.y = 380;
    this.dog.vY = -4;
  }

  private handleRoundEnd() {
    if (this.state.checkRoundResult()) {
      this.state.nextRound();
      this.startIntro();
    } else {
      this.zone.run(() => {
        this.status = GameStatus.GAME_OVER;
        this.state.setGameStatus(GameStatus.GAME_OVER);
      });
    }
  }

  // --- CORE LOOP & PHYSICS ---

  private startGameLoop() {
    this.zone.runOutsideAngular(() => {
      const loop = () => {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(loop);
      };
      this.animationId = requestAnimationFrame(loop);
    });
  }

  private update() {
    this.frameCount++;

    if (this.status === GameStatus.INTRO) {
      this.engine.updateDogLogic(this.dog, this.frameCount);
      if (
        this.dog.state === DogState.JUMPING &&
        this.dog.vY > 0 &&
        this.dog.y > 450
      ) {
        this.zone.run(() => {
          this.status = GameStatus.PLAYING;
          this.state.setGameStatus(GameStatus.PLAYING);
          this.spawnDuck();
        });
      }
    } else {
      if (this.duck) {
        this.engine.updateDuckPhysics(this.duck, this.frameCount);
        this.engine.updateAnimation(this.duck, this.frameCount);

        if (this.duck.state === DuckState.FALLING && this.duck.y > 380)
          this.processDuckResult(true);
        else if (this.duck.y < -100) this.processDuckResult(false);
      } else if (this.dog.state !== DogState.HIDDEN) {
        this.engine.updateDogLogic(this.dog, this.frameCount);
      } else if (this.status === GameStatus.PLAYING) {
        this.zone.run(() => {
          if (this.state.ducksProcessed >= 10) this.handleRoundEnd();
          else {
            this.state.resetAmmo();
            this.spawnDuck();
          }
        });
      }
    }
  }

  // --- INPUT HANDLING ---

  get showReloadUI(): boolean {
    return (
      this.status === GameStatus.PLAYING &&
      this.state.currentAmmo === 0 &&
      this.duck?.state === DuckState.FLYING
    );
  }

  onReloadClick(event: MouseEvent) {
    event.stopPropagation();
    this.state.reloadWithPenalty();
  }

  public handleShoot(event: MouseEvent) {
    this.zone.run(() => {
      if (this.status === GameStatus.GAME_OVER) {
        this.state.resetGame();
        this.startIntro();
        return;
      }

      if (
        this.status !== GameStatus.PLAYING ||
        !this.duck ||
        this.state.currentAmmo <= 0 ||
        this.duck.state !== DuckState.FLYING
      )
        return;

      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (800 / rect.width);
      const y = (event.clientY - rect.top) * (600 / rect.height);

      this.state.useAmmo();
      this.audio.play('shot');
      this.flashFrames = 2;

      if (this.engine.checkHit(x, y, this.duck)) {
        this.duck.state = DuckState.HIT;
        this.audio.play('hit');
        this.state.updateScore(
          400 + Math.min(this.state.roundNumber * 100, 500),
        );
        if (this.escapeTimer) clearTimeout(this.escapeTimer);

        setTimeout(() => {
          if (this.duck) {
            this.duck.state = DuckState.FALLING;
            this.audio.play('fall');
          }
        }, 500);
      }
    });
  }

  // --- RENDERING ---

  private draw() {
    if (!this.ctx) return;
    const w = 800,
      h = 600,
      grassLine = 375;

    // Background Layer
    this.ctx.fillStyle = '#64b0ff';
    this.ctx.fillRect(0, 0, w, h);
    if (this.backgroundImg.complete)
      this.ctx.drawImage(this.backgroundImg, 0, 0, w, h);

    const isDogBehind =
      this.dog.state === DogState.CELEBRATING ||
      this.dog.state === DogState.LAUGHING ||
      (this.dog.state === DogState.JUMPING && this.dog.vY >= 0);

    // Middle Layer (Clipped behind grass)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, w, grassLine);
    this.ctx.clip();
    if (isDogBehind && this.dog.state !== DogState.HIDDEN) this.renderDog();
    if (this.duck) this.renderDuck();
    this.ctx.restore();

    // Foreground Grass Layer
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

    // Top Layer (Dog in front of grass)
    if (!isDogBehind && this.dog.state !== DogState.HIDDEN) this.renderDog();

    this.renderHUD();
    if (this.status === GameStatus.INTRO)
      this.drawCenterText(`ROUND ${this.state.roundNumber}`);
    if (this.status === GameStatus.GAME_OVER)
      this.drawCenterText('GAME OVER', '#ff4d4d');

    if (this.flashFrames > 0) {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, w, h);
      this.flashFrames--;
    }
  }

  private renderHUD() {
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px "Press Start 2P"';
    this.ctx.fillText(this.state.roundNumber.toString(), 145, 495);

    const ammoUsed = 3 - this.state.currentAmmo;
    this.ctx.fillStyle = 'black';
    for (let i = 0; i < ammoUsed; i++)
      this.ctx.fillRect(80 + (2 - i) * 26 - 2, 520, 16, 22);

    for (let i = 0; i < 10; i++) {
      const curX = 310 + i * 25.5;
      if (i < this.state.ducksProcessed && i < this.state.ducksHitInRound)
        this.drawRedX(curX, 525);
    }

    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'right';
    this.ctx.font = '20px "Press Start 2P"';
    this.ctx.fillText(
      this.state.currentScore.toString().padStart(6, '0'),
      715,
      534,
    );
    this.ctx.restore();
  }

  private drawRedX(x: number, y: number) {
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 8, y);
    this.ctx.lineTo(x + 8, y + 16);
    this.ctx.moveTo(x + 8, y);
    this.ctx.lineTo(x - 8, y + 16);
    this.ctx.stroke();
  }

  private renderDog() {
    const sw = this.dogSprite.naturalWidth / 4,
      sh = this.dogSprite.naturalHeight / 3;
    const col = this.dog.frame % 4,
      row = Math.floor(this.dog.frame / 4);
    this.ctx.drawImage(
      this.dogSprite,
      col * sw,
      row * sh,
      sw - 0.1,
      sh - 0.1,
      Math.floor(this.dog.x),
      Math.floor(this.dog.y),
      150,
      120,
    );
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
    let idx = 0;
    if (
      this.duck.state === DuckState.FLYING ||
      this.duck.state === DuckState.FLY_AWAY
    ) {
      idx = this.duck.vY < -1 ? this.duck.frame % 3 : 3 + (this.duck.frame % 3);
    } else if (this.duck.state === DuckState.HIT) idx = 6;
    else idx = 7;

    const [sx, sw] = spriteMap[idx];
    this.ctx.save();
    const dx = Math.floor(this.duck.x),
      dy = Math.floor(this.duck.y);
    if (
      this.duck.vX < 0 &&
      (this.duck.state === DuckState.FLYING ||
        this.duck.state === DuckState.FLY_AWAY)
    ) {
      this.ctx.translate(dx + 64, dy);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.duckSprite, sx, 0, sw, 48, 0, 0, 64, 64);
    } else {
      this.ctx.drawImage(this.duckSprite, sx, 0, sw, 48, dx, dy, 64, 64);
    }
    this.ctx.restore();
  }

  private drawCenterText(text: string, color: string = 'white') {
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.fillText(text, 400, 250);
  }
}