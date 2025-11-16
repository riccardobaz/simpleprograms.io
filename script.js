// ==== Canvas setup ====
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ==== Rule 110 table ====
// Mapping neighborhood (as string) → new cell state
const rule110 = {
    "111": 0,
    "110": 1,
    "101": 1,
    "100": 0,
    "011": 1,
    "010": 1,
    "001": 1,
    "000": 0
};

// ==== Simulation parameters ====
const cellSize = 3;                     // pixel size of each cell
const columns = () => Math.floor(canvas.width / cellSize);
const rows = () => Math.floor(canvas.height / cellSize);

// Slow evolution speed (milliseconds per new row)
const STEP_DELAY = 80;                  // try 50–150 ms to tune speed

// Current CA state (the “current row”)
let currentRow = new Array(columns()).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);

// A buffer of rows we have drawn (screen scroll effect)
let rowBuffer = [];

function computeNextRow(row) {
    const next = new Array(row.length).fill(0);
    for (let i = 0; i < row.length; i++) {
        const left = row[(i - 1 + row.length) % row.length];
        const mid = row[i];
        const right = row[(i + 1) % row.length];
        const neighborhood = `${left}${mid}${right}`;
        next[i] = rule110[neighborhood];
    }
    return next;
}

function drawRow(row, y) {
    for (let x = 0; x < row.length; x++) {
        ctx.fillStyle = row[x] === 1 ? "#ffffff" : "#000000";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

function step() {
    const maxRows = rows();

    // Add the new row to buffer
    rowBuffer.push(currentRow.slice());

    // If too many rows, remove oldest (scroll effect)
    if (rowBuffer.length > maxRows) {
        rowBuffer.shift();
    }

    // Clear the whole canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all buffered rows from top to bottom
    for (let i = 0; i < rowBuffer.length; i++) {
        drawRow(rowBuffer[i], i);
    }

    // Compute next row
    currentRow = computeNextRow(currentRow);

    // Schedule next step
    setTimeout(step, STEP_DELAY);
}

// Start the loop
step();
