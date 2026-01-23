import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-scoreboard',
    templateUrl: './scoreboard.component.html',
    styleUrls: ['./scoreboard.component.scss']
})

export class ScoreboardComponent {
    @Input() ammo: number = 3;
    @Input() score: number = 0;
    @Input() round: number = 1;
    @Input() hitHistory: (boolean | null)[] = [];
}