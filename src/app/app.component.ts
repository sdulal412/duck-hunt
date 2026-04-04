import { Component } from '@angular/core';
import { GameBoardComponent } from './components/game-board/game-board.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [GameBoardComponent],
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'Duck Hunt';
}
