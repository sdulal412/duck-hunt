<div align="center">
  <br />
    <a>
      <img src="" alt="Project Banner">
    </a>

  <br />
  <h3 align="center"> Duck hunt </h3>
</div>

## <a name="table">Table of Contents</a>

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Quick Start](#quick-start)


## <a name="introduction">Introduction</a>

This project is a recreation of the 1984 NES classic. It utilizes Angular for component orchestration and HTML5 Canvas for high-performance rendering, ensuring a smooth 60FPS experience.


## <a name="project-structure">Project Structure</a>

```bash
duck-hunt/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── engine.service.ts
│   │   │   ├── state.service.ts
│   │   │   └── audio.service.ts
│   │   ├── components/
│   │   │   ├── game-board/
│   │   │   ├── scoreboard/
│   │   │   └── intro-screen/
│   │   ├── models/
│   │   │   ├── duck.model.ts
│   │   │   └── constants.ts
│   └── assets/
│       ├── sprites/
│       └── sfx/
├── angular.json
└── package.json

```

## <a name="quick-start">Quick Start</a>


1. Clone
```bash
# Clone the Repository
git clone https://github.com/sdulal412/duck-hunt.git
cd duck-hunt

# Install dependencies (only the first time)
npm install

# Runs the local on http://localhost:4200
ng serve

# Build the project
ng build
```
