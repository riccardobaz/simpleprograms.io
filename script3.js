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
// (If you really want the complementary rule, you can flip 0/1 in this table later)
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

// Current CA state (the “current row”), RANDOM as you requested
let currentRow = new Array(columns()).fill(0).map(() => (Math.random() < 0.5 ? 1 : 0));
// We'll keep a copy of the previous CA row for coloring
let prevCARow = currentRow.slice();

// A buffer of COLORED rows (each row: array of color strings)
let rowBuffer = [];

// ---- Compute next CA row with Rule 110 ----
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

// ---- Color a new row based on the row above ----
function colorNewRow(row, above) {
    const C = row.length;
    const colors = new Array(C).fill("#000000"); // default black

    let i = 0;
    while (i < C) {
        if (row[i] === 1) {
            // Find block of consecutive 1s
            const start = i;
            while (i < C && row[i] === 1) i++;
            const end = i - 1;
            const length = end - start + 1;

            // Check above-left, above, above-right all zero for every cell in the block
            let ok = true;
            for (let j = start; j <= end; j++) {
                const L = above[(j - 1 + C) % C];
                const M = above[j];
                const R = above[(j + 1) % C];
                if (!(L === 0 && M === 0 && R === 0)) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                let col = "#000000";
                if (length === 1) col = "red";
                else if (length === 2) col = "white";
                else if (length === 3) col = "#444444"; // dark gray (3×1 in your pic)
                else if (length === 4) col = "orange";
                else if (length === 5) col = "purple";
                else if (length === 6) col = "green";
                else if (length === 7) col = "blue";

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
function drawRow(colors, y) {
    for (let x = 0; x < colors.length; x++) {
        ctx.fillStyle = colors[x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

// ---- Main step function ----
function step() {
    const maxRows = rows();

    // Compute next CA row
    const nextRow = computeNextRow(currentRow);

    // Color this new row using the previous CA row as "above"
    const coloredRow = colorNewRow(nextRow, currentRow);

    // Add colored row to buffer
    rowBuffer.push(coloredRow);

    // Scroll: if too many rows, drop the oldest
    if (rowBuffer.length > maxRows) {
        rowBuffer.shift();
    }

    // Clear the canvas background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all buffered colored rows from top to bottom
    for (let y = 0; y < rowBuffer.length; y++) {
        drawRow(rowBuffer[y], y);
    }

    // Advance CA
    prevCARow = currentRow;
    currentRow = nextRow;

    // Schedule next step
    setTimeout(step, STEP_DELAY);
}

// Start the loop
step();
