export const GAME_CONF = {
  WIDTH: 800,
  HEIGHT: 600,
  GRAVITY: 0.5,
  MAX_DUCKS: 2,
  GRASS_LINE: 375,
  BULLETS_PER_ROUND: 3,
  COLORS: { SKY: '#64b0ff', GRASS: '#008000', UI_PANEL: '#000000' },
};

export enum GameStatus {
  INTRO,
  PLAYING,
  DUCK_HIT,
  GAME_OVER,
  DUCK_ESCAPE,
  MENU = 'MENU',
}

export enum DuckState {
  HIT,
  FLYING,
  FALLING,
  FLY_AWAY,
}

export enum DogState {
  IDLE = 'IDLE',
  FOUND = 'FOUND',
  HIDDEN = 'HIDDEN',
  JUMPING = 'JUMPING',
  LAUGHING = 'LAUGHING',
  SNIFFING = 'SNIFFING',
  CELEBRATING = 'CELEBRATING',
}
