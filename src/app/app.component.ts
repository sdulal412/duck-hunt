import { Component } from '@angular/core';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';

@Component({
  standalone: true,
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
  imports: [GameBoardComponent, ScoreboardComponent],
})
export class AppComponent {
  title = 'duck-hunt';
}