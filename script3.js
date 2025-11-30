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

// The CA rows (0/1), color rows use CSS color strings
let currentRow = new Array(columns()).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
let prevRow = currentRow.slice();  // first row is hidden
let colorBuffer = [];  // stores {cells: [color strings]}

// ----- Compute Rule 110 next row -----
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

// ----- Color block according to given rules -----
function colorNewRow(row, above) {
    const C = row.length;
    const colors = new Array(C).fill("#000000");  // default black

    let i = 0;
    while (i < C) {
        if (row[i] === 1) {
            // find block start/end
            let start = i;
            while (i < C && row[i] === 1) i++;
            let end = i - 1;
            let length = end - start + 1;

            // check above-left, above, above-right all black
            // using cylinder topology
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

            // assign color if valid block
            if (ok) {
                let col = "#000000";
                if (length === 1) col = "red";
                else if (length === 2) col = "white";
                else if (length === 3) col = "#444444";     // dark gray (your picture)
                else if (length === 4) col = "orange";
                else if (length === 5) col = "purple";
                else if (length === 6) col = "green";
                else if (length === 7) col = "blue";

                for (let j = start; j <= end; j++) {
                    if (row[j] === 1) colors[j] = col;
                }
            }
        } else {
            i++;
        }
    }

    return colors;
}

// ----- Drawing function -----
function drawColorRow(colors, y) {
    for (let x = 0; x < colors.length; x++) {
        ctx.fillStyle = colors[x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
}

function step() {
    const maxRows = rows();

    // compute next CA row
    const nextRow = computeNextRow(currentRow);

    // color the new row (using currentRow as "above")
    const colored = colorNewRow(nextRow, currentRow);

    // push to buffer
    colorBuffer.push(colored);

    // drop from top to keep scroll effect
    if (colorBuffer.length > maxRows) {
        colorBuffer.shift();
    }

    // clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw rows
    for (let y = 0; y < colorBuffer.length; y++) {
        drawColorRow(colorBuffer[y], y);
    }

    // advance
    prevRow = currentRow;
    currentRow = nextRow;

    setTimeout(step, STEP_DELAY);
}

// start
step();
