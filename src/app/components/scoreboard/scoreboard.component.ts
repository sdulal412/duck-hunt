import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../core/state.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent {
  ammo$ = this.state.ammo$;
  score$ = this.state.score$;

  constructor(private state: StateService) {}
}