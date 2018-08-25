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
      canvas = document.getElementById("game-of-live-canvas");

canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext("2d");

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
    universe.tick();

    drawGrid();
    drawCells();
    requestAnimationFrame(renderLoop);
};

requestAnimationFrame(renderLoop);