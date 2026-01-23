import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-intro-screen',
  templateUrl: './intro-screen.component.html',
  styleUrls: ['./intro-screen.component.scss'],
})

export class IntroScreenComponent {

  @Output() startGame = new EventEmitter<void>();

  onStart() {
    this.startGame.emit();
  }
}