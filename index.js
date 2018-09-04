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
      tpfControl = document.getElementById("tickRange");

let animationId; // for keeping track of current animation frame

const fps = new class {
    constructor() {
        this.fps = document.getElementById("fps");
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    };

    render() {
        // Convert the delta time since the last frame render into a
        // measure of frames per second
        const now = performance.now(),
              delta = now - this.lastFrameTimeStamp,
              fps = 1 / delta * 1000;

        this.lastFrameTimeStamp = now;

        // Save only the latest 100 timings
        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        };

        // Find the max, min, and mean of our 100 latest timings
        let min = Infinity,
            max = -Infinity,
            sum = 0;
        
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        };
        let mean = sum / this.frames.length;

        // Render the statistics
        this.fps.textContent = `
        Frames per second:
                latest = ${Math.round(fps)}
        Avg of last 100 = ${Math.round(mean)}
        Min of last 100 = ${Math.round(min)}
        Max of last 100 = ${Math.round(max)}
        `.trim();
    };
};

tpfControl.min = 1; // The wasm portion will expect this to always be 1
tpfControl.max = 11; // Must be odd number

universe.set_max_tpf(tpfControl.max);
universe.update_tick_rate(tpfControl.value);

tpfControl.addEventListener("change", () => {
    universe.update_tick_rate(tpfControl.value);
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

const renderLoop = () => {
    fps.render();
    universe.controller();
    
    drawGrid();
    drawCells();
    animationId = requestAnimationFrame(renderLoop);
};

const play = () => {
    toggleUniverse.textContent = "Playing";
    renderLoop();
};

const pause = () => {
    toggleUniverse.textContent = "Paused"
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