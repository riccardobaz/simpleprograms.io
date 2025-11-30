// ======================
//  CANVAS SETUP
// ======================
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

let cellSize = 3;
let COLS = 0;
let ROWS = 0;

// Prevent logic running mid-resize
let resizing = false;
let colorBuffer = [];

// Update canvas and recompute stable CA grid size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    COLS = Math.max(20, Math.floor(canvas.width / cellSize));
    ROWS = Math.max(20, Math.floor(canvas.height / cellSize));
}
resizeCanvas();

// Debounced resize listener
window.addEventListener("resize", () => {
    resizing = true;
    clearTimeout(window._rt);
    window._rt = setTimeout(() => {
        resizing = false;
        resizeCanvas();
        // Reinitialize buffer to avoid mismatched row lengths
        colorBuffer = [];
        firstRowInitialized = false;
    }, 150);
});

// ======================
//  RULE 110
// ======================
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

// CA state
let currentRow = [];
let firstRowInitialized = false;

// Initialize first row (all black)
function initFirstRow() {
    currentRow = new Array(COLS).fill(0);
    firstRowInitialized = true;
}
initFirstRow();

function computeNextRow(row) {
    const next = new Array(COLS).fill(0);
    for (let i = 0; i < COLS; i++) {
        const L = row[(i - 1 + COLS) % COLS];
        const M = row[i];
        const R = row[(i + 1) % COLS];
        const nbr = `${L}${M}${R}`;
        next[i] = rule110[nbr];
    }
    return next;
}

// ======================
//  COLORING RULES
// ======================
function colorNewRow(row, above) {
    const colors = new Array(COLS).fill("#000000"); // default black

    let i = 0;
    while (i < COLS) {
        if (row[i] === 1) {
            let start = i;
            while (i < COLS && row[i] === 1) i++;
            let end = i - 1;
            let len = end - start + 1;

            // Check above-left, above, above-right all zero
            let ok = true;
            for (let j = start; j <= end; j++) {
                const L = above[(j - 1 + COLS) % COLS];
                const M = above[j];
                const R = above[(j + 1) % COLS];
                if (!(L === 0 && M === 0 && R === 0)) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                let col = "#000000";
                if (len === 1) col = "red";
                else if (len === 2) col = "white";
                else if (len === 3) col = "#444444";   // dark grey
                else if (len === 4) col = "orange";
                else if (len === 5) col = "purple";
                else if (len === 6) col = "green";
                else if (len === 7) col = "blue";

                for (let j = start; j <= end; j++)
                    colors[j] = col;
            }
        } else {
            i++;
        }
    }

    return colors;
}

// ======================
//  DRAWING
// ======================
function drawRow(colors, y) {
    for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = colors[x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

// ======================
//  MAIN LOOP
// ======================
const STEP_DELAY = 80;

function step() {
    if (resizing) {
        setTimeout(step, STEP_DELAY);
        return;
    }

    if (!firstRowInitialized) {
        initFirstRow();
        setTimeout(step, STEP_DELAY);
        return;
    }

    // Compute new CA line
    let nextRow = computeNextRow(currentRow);

    // Color it
    let colored = colorNewRow(nextRow, currentRow);

    // Push to buffer
    colorBuffer.push(colored);

    // Scroll upward
    if (colorBuffer.length > ROWS)
        colorBuffer.shift();

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all stored rows
    for (let y = 0; y < colorBuffer.length; y++)
        drawRow(colorBuffer[y], y);

    // Move forward
    currentRow = nextRow;

    setTimeout(step, STEP_DELAY);
}

step();
