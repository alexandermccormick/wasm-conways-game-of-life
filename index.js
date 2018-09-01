import { Universe } from "./wasm_game_of_life";
import { memory } from "./wasm_game_of_life_bg";

const CELL_SIZE = 5,
      GRID_COLOR = "#CCCCCC",
      DEAD_COLOR = "#FFFFFF",
      ALIVE_COLOR = "#000000",
      // Same as "Cell" enum in src/lib.rs
      DEAD = 0,
      ALIVE = 1,
      // Conway's Universe
      universe = Universe.new(),
      width = universe.width(),
      height = universe.height(),
      canvas = document.getElementById("game-of-live-canvas"),
      ctx = canvas.getContext("2d"),
      toggleUniverse = document.getElementById("toggleUniverse"),
      tickCounter = document.getElementById("ticks"),
      fpsControl = document.getElementById("tickRange");

/* Animation Frame Control */
let animationId;
let frameIter = 0;
let fps; // global access to setTimeout
let tickCount = 0;

fpsControl.min = 1; // The wasm portion will expect this to always be 1
fpsControl.max = 11; // Must be odd number

const fpsControlMedian = Math.floor(fpsControl.max / 2) + 1;
let tickRate = fpsControl.value;

fpsControl.addEventListener("change", () => {
    tickRate = fpsControl.value;
});
      
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const drawGrid = () => {
    ctx.beginPath();
    ctx.lineWidth = 1 / window.devicePixelRatio;
    ctx.strokeStyle = GRID_COLOR;

    // Verticle lines
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) +1, (CELL_SIZE + 1) * height + 1);
    };

    // Horizontal lines
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    };

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells(),
          cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === DEAD ? DEAD_COLOR : ALIVE_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        };
    };
    ctx.stroke();
};


/* Animation Frame Control */
// let animationId;
// let tickCount = 0;
// // let fps; // global access to setTimeout

const trackFPS = () => {
    fps = setTimeout(() => {
        tickCounter.innerHTML = tickCount;
        tickCount = 0;
        trackFPS();
    }, 1000);
};

const increaseFPS = () => {
    for(let i=0; i < tickRate; i++) {
        universe.tick();
        tickCount++;
    }
};

const decreaseFPS = (frameIter) => {
    if (Math.abs(tickRate - fpsControlMedian) === frameIter) {
        frameIter = 0;
        tickCount++;
        universe.tick();
    };
};

const renderLoop = () => {
    // if (tickRate === fpsControlMedian) { universe.tick(); } else
    // if (tickRate > fpsControlMedian) { increaseFPS(); } else
    // if (tickRate < fpsControlMedian) { decreaseFPS(); };
    // TICKRATE FRAMEITER FPSMAX
    frameIter++;
    tickCount++;
    universe.tick();
    drawGrid();
    drawCells();
    animationId = requestAnimationFrame(renderLoop);
};

const play = () => {
    toggleUniverse.textContent = "Playing";
    trackFPS();
    renderLoop();
};

const pause = () => {
    toggleUniverse.textContent = "Paused"
    clearTimeout(fps);
    cancelAnimationFrame(animationId);
    animationId = undefined;
};

toggleUniverse.addEventListener("click", () => {
    return (animationId) ? pause() : play();
});

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect(),
          scaleX = canvas.width / boundingRect.width,
          scaleY = canvas.height / boundingRect.height,
          canvasLeft = (event.clientX - boundingRect.left) * scaleX,
          canvasTop = (event.clientY - boundingRect.top) * scaleY,
          col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1),
          row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);

    universe.toggle_cell(row, col);

    drawCells();
    drawGrid();
});

// ENGAGE UNIVERSE...
play();