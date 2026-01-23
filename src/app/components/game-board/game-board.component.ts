import { Dog } from '../../models/dog.model';
import { CommonModule } from '@angular/common';
import { Duck } from '../../models/duck.model';
import { StateService } from '../../core/state.service';
import { AudioService } from '../../core/audio.service';
import { EngineService } from '../../core/engine.service';
import { DuckState, DogState, GameStatus } from '../../models/constants';
import { ScoreboardComponent } from '../scoreboard/scoreboard.component';
import { IntroScreenComponent } from '../intro-screen/intro-screen.component';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss'],
  imports: [CommonModule, IntroScreenComponent, ScoreboardComponent],
})

export class GameBoardComponent implements AfterViewInit, OnDestroy {

  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private frameCount = 0;
  private flashFrames = 0;
  private escapeTimer: any;
  private animationId?: number;
  private ctx!: CanvasRenderingContext2D;

  public DuckState = DuckState;
  public GameStatus = GameStatus;

  private dogSprite = new Image();
  private duckSprite = new Image();
  private backgroundImg = new Image();

  public duck?: Duck;
  public status: GameStatus = GameStatus.MENU;
  public dog: Dog = { 
    state: DogState.SNIFFING,
    vY: 0, x: -75, y: 320, frame: 0, width: 150, height: 120,
  };

  constructor(
    private zone: NgZone,
    public audio: AudioService,
    public state: StateService,
    public engine: EngineService,
  ) {
    this.initAssets();
  }
  public scaleFactor: number = 1;

  @HostListener('window:load')
  @HostListener('window:resize')
  onResize() {
    const container = this.canvas.nativeElement.parentElement;
    if (container) {
      this.scaleFactor = container.offsetWidth / 800;
    }
  }

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    setTimeout(() => this.onResize(), 0);
  }

  private initAssets() {
    document.fonts.load('10pt "Press Start 2P"');
    this.dogSprite.src = 'assets/sprites/dog_sheet.png';
    this.duckSprite.src = 'assets/sprites/duck_sheet.png';
    this.backgroundImg.src = 'assets/sprites/background.png';
  }

  get hitHistory(): (boolean | null)[] {
    return Array.from({ length: 10 }, (_, i) => {
      if (i >= this.state.ducksProcessed) return null;
      return i < this.state.ducksHitInRound;
    });
  }

  get showReloadUI(): boolean {
    return (
      this.status === GameStatus.PLAYING &&
      this.state.currentAmmo === 0 &&
      this.duck?.state === DuckState.FLYING
    );
  }

  // --- GAME ACTIONS ---
  public onIntroStart() {
    this.zone.run(() => {
      this.status = GameStatus.INTRO;
      this.state.setGameStatus(GameStatus.INTRO);
      this.dog.x = -75;
      this.dog.y = 350;
      this.dog.state = DogState.SNIFFING;
      this.startGameLoop();
    });
  }

  public onReloadClick(event: MouseEvent) {
    event.stopPropagation();
    this.state.reloadWithPenalty();
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
      targetX: 0, targetY: 0,
      frame: 0, width: 64, height: 64, id: Math.random(),
      state: DuckState.FLYING,
    };
    
    this.escapeTimer = setTimeout(() => {
      if (this.duck?.state === DuckState.FLYING) {
        this.duck.state = DuckState.FLY_AWAY;
        this.duck.vY = -12;
      }
    }, 8000);
  }

  private processDuckResult(isHit: boolean) {
    if (this.escapeTimer) clearTimeout(this.escapeTimer);
    const lastX = this.duck?.x || 400;
    this.duck = undefined;
    this.state.incrementProcessed();

    this.dog.state = isHit ? DogState.CELEBRATING : DogState.LAUGHING;
    this.dog.x = isHit ? Math.max(0, Math.min(lastX - 40, 650)) : 325;
    this.dog.y = 380;
    this.dog.vY = -4;
  }

  private handleRoundEnd() {
    if (this.state.checkRoundResult()) {
      this.state.nextRound();
      this.onIntroStart();
    } else {
      this.zone.run(() => {
        this.status = GameStatus.GAME_OVER;
        this.state.setGameStatus(GameStatus.GAME_OVER);
      });
    }
  }

  // --- ENGINE LOOP ---
  private startGameLoop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
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
      if (this.dog.state === DogState.JUMPING && this.dog.vY > 0 && this.dog.y > 450) {
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
        if (this.duck.state === DuckState.FALLING && this.duck.y > 380) this.processDuckResult(true);
        else if (this.duck.y < -100) this.processDuckResult(false);
      } else if (this.dog.state !== DogState.HIDDEN) {
        this.engine.updateDogLogic(this.dog, this.frameCount);
      } else if (this.status === GameStatus.PLAYING) {
        this.zone.run(() => {
          if (this.state.ducksProcessed >= 10) this.handleRoundEnd();
          else { this.state.resetAmmo(); this.spawnDuck(); }
        });
      }
    }
  }

  public handleShoot(event: MouseEvent) {
    if (this.status !== GameStatus.PLAYING || !this.duck || this.state.currentAmmo <= 0 || this.duck.state !== DuckState.FLYING) {
      if (this.status === GameStatus.GAME_OVER) { this.state.resetGame(); this.onIntroStart(); }
      return;
    }

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (800 / rect.width);
    const y = (event.clientY - rect.top) * (600 / rect.height);

    this.zone.run(() => {
      this.state.useAmmo();
      this.audio.play('shot');
      this.flashFrames = 2;

      if (this.engine.checkHit(x, y, this.duck!)) {
        this.duck!.state = DuckState.HIT;
        this.audio.play('hit');
        this.state.updateScore(400 + Math.min(this.state.roundNumber * 100, 500));
        setTimeout(() => { if (this.duck) { this.duck.state = DuckState.FALLING; this.audio.play('fall'); } }, 500);
      }
    });
  }

  // --- DRAWING ---
  private draw() {
    if (!this.ctx) return;
    const w = 800, h = 600, grassLine = 375;

    this.ctx.fillStyle = '#64b0ff';
    this.ctx.fillRect(0, 0, w, h);
    if (this.backgroundImg.complete) this.ctx.drawImage(this.backgroundImg, 0, 0, w, h);

    const isDogBehind = this.dog.state === DogState.CELEBRATING || this.dog.state === DogState.LAUGHING || (this.dog.state === DogState.JUMPING && this.dog.vY >= 0);

    this.ctx.save();
    this.ctx.beginPath(); this.ctx.rect(0, 0, w, grassLine); this.ctx.clip();
    if (isDogBehind && this.dog.state !== DogState.HIDDEN) this.renderDog();
    if (this.duck) this.renderDuck();
    this.ctx.restore();

    if (this.backgroundImg.complete) {
      this.ctx.drawImage(this.backgroundImg, 0, grassLine, w, h - grassLine, 0, grassLine, w, h - grassLine);
    }

    if (!isDogBehind && this.dog.state !== DogState.HIDDEN) this.renderDog();

    if (this.status === GameStatus.INTRO) this.drawCenterText(`ROUND ${this.state.roundNumber}`);
    if (this.status === GameStatus.GAME_OVER) this.drawCenterText('GAME OVER', '#ff4d4d');

    if (this.flashFrames > 0) {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, w, h);
      this.flashFrames--;
    }
  }

  private renderDog() {
    const sw = this.dogSprite.naturalWidth / 4, sh = this.dogSprite.naturalHeight / 3;
    const col = this.dog.frame % 4, row = Math.floor(this.dog.frame / 4);
    this.ctx.drawImage(this.dogSprite, col * sw, row * sh, sw - 0.1, sh - 0.1, Math.floor(this.dog.x), Math.floor(this.dog.y), 150, 120);
  }

  private renderDuck() {
    if (!this.duck) return;
    const spriteMap = [[0, 48], [48, 48], [96, 48], [144, 48], [192, 48], [240, 48], [288, 48], [336, 48]];
    let idx = (this.duck.state === DuckState.HIT) ? 6 : (this.duck.state === DuckState.FALLING) ? 7 : (this.duck.vY < -1 ? this.duck.frame % 3 : 3 + (this.duck.frame % 3));

    const [sx, sw] = spriteMap[idx];
    this.ctx.save();
    const dx = Math.floor(this.duck.x), dy = Math.floor(this.duck.y);
    if (this.duck.vX < 0 && (this.duck.state === DuckState.FLYING || this.duck.state === DuckState.FLY_AWAY)) {
      this.ctx.translate(dx + 64, dy); this.ctx.scale(-1, 1);
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

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.escapeTimer) clearTimeout(this.escapeTimer);
  }
}