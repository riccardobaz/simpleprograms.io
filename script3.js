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
const cellSize = 3;
const columns = () => Math.floor(canvas.width / cellSize);
const rows = () => Math.floor(canvas.height / cellSize);
const STEP_DELAY = 80;

// ==== Initial CA row (IMPORTANT FIX: all zeros!) ====
let currentRow = new Array(columns()).fill(0);   // first row all black
let colorBuffer = [];                            // stores colored rows only

// ---- Compute next Rule-110 row ----
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

// ---- Color the newest row according to your block rules ----
function colorNewRow(row, above) {
    const C = row.length;
    const colors = new Array(C).fill("#000000"); // black background

    let i = 0;
    while (i < C) {
        if (row[i] === 1) {
            // Find block of consecutive 1s
            const start = i;
            while (i < C && row[i] === 1) i++;
            const end = i - 1;
            const length = end - start + 1;

            // Check above-left, above, above-right are all black
            let valid = true;
            for (let j = start; j <= end; j++) {
                const L = above[(j - 1 + C) % C];
                const M = above[j];
                const R = above[(j + 1) % C];
                if (!(L === 0 && M === 0 && R === 0)) {
                    valid = false;
                    break;
                }
            }

            // If valid block, assign colors based on length
            if (valid) {
                let col = "#000000";
                if (length === 1) col = "red";
                else if (length === 2) col = "white";
                else if (length === 3) col = "#444444"; // dark gray
                else if (length === 4) col = "orange";
                else if (length === 5) col = "purple";
                else if (length === 6) col = "green";
                else if (length === 7) col = "blue";

                // Paint the block
                for (let j = start; j <= end; j++) {
                    colors[j] = col;
                }
            }
        } else {
            i++;
        }
    }

    return colors;
}

// ---- Draw a colored row ----
function drawColorRow(colors, y) {
    for (let x = 0; x < colors.length; x++) {
        ctx.fillStyle = colors[x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

// ---- Main animation loop ----
function step() {
    const maxRows = rows();

    // Compute next CA state
    const nextRow = computeNextRow(currentRow);

    // Color the new row based on block rules + row above
    const colored = colorNewRow(nextRow, currentRow);

    // Add to buffer (scrolling)
    colorBuffer.push(colored);
    if (colorBuffer.length > maxRows) {
        colorBuffer.shift();
    }

    // Clear screen
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all rows from top to bottom
    for (let y = 0; y < colorBuffer.length; y++) {
        drawColorRow(colorBuffer[y], y);
    }

    // Advance the CA
    currentRow = nextRow;

    setTimeout(step, STEP_DELAY);
}

// Start animation
step();
