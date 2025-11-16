// ========================
// Canvas setup
// ========================
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
    // For simplicity: reload to recompute everything for new size
    location.reload();
});

// ========================
// Rule 110 (binary, r = 1)
// ========================
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

// ========================
// Parameters (analogous to your WL config)
// ========================
const cellSize = 3;                             // pixel size
const L       = Math.floor(canvas.width / cellSize);  // width in cells
const radius  = 1;                              // Rule 110 is r=1
const k       = 2;                              // binary
const steps   = 4 * L;                          // like steps = 4 L
const seedMode = "random";                      // "random" | "singleCenter"
const STEP_DELAY = 20;                          // ms per row reveal

// ========================
// Seed helpers
// ========================
function makeSeed(mode) {
    if (mode === "singleCenter") {
        const arr = new Array(L).fill(0);
        arr[Math.floor(L / 2)] = 1;
        return arr;
    }
    // default: random
    const arr = new Array(L);
    for (let i = 0; i < L; i++) {
        arr[i] = Math.random() < 0.5 ? 1 : 0;
    }
    return arr;
}

// ========================
// Evolve CA once to get full space-time diagram
// ========================
function evolveRule110(seed, steps) {
    const history = [];
    let row = seed.slice();
    for (let t = 0; t < steps; t++) {
        history.push(row.slice());
        const next = new Array(row.length);
        for (let i = 0; i < row.length; i++) {
            const left  = row[(i - 1 + row.length) % row.length];
            const mid   = row[i];
            const right = row[(i + 1) % row.length];
            next[i] = rule110[`${left}${mid}${right}`];
        }
        row = next;
    }
    return history;
}

// ========================
// Connected Components on full array
// (4-connected, like CornerNeighbors -> False)
// ========================
function computeComponents(buffer) {
    const h = buffer.length;
    const w = buffer[0].length;

    const labels = Array.from({ length: h }, () => new Array(w).fill(0));
    let currentLabel = 1;

    const dirs = [
        [1,0], [-1,0], [0,1], [0,-1]
    ];

    function bfs(sr, sc) {
        const queue = [[sr, sc]];
        labels[sr][sc] = currentLabel;
        let count = 1;

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < h && nc >= 0 && nc < w) {
                    if (buffer[nr][nc] === 1 && labels[nr][nc] === 0) {
                        labels[nr][nc] = currentLabel;
                        queue.push([nr, nc]);
                        count++;
                    }
                }
            }
        }
        return count;
    }

    const componentSizes = {};

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            if (buffer[r][c] === 1 && labels[r][c] === 0) {
                const size = bfs(r, c);
                componentSizes[currentLabel] = size;
                currentLabel++;
            }
        }
    }

    return { labels, componentSizes };
}

// ========================
// Palette (similar to Hue[] ramp)
// ========================
function makePalette(n) {
    const colors = [];
    // avoid n=0 case
    const denom = n || 1;
    for (let i = 0; i < denom; i++) {
        const hue = (i / denom) * 360;
        colors.push(`hsl(${hue}, 100%, 60%)`);
    }
    return colors;
}

// ========================
// Colorization (once, on full diagram)
// ========================
function colorizeStatic(buffer) {
    const { labels, componentSizes } = computeComponents(buffer);

    const componentList = Object.keys(componentSizes).map(k => parseInt(k));
    if (componentList.length === 0) {
        // just black background
        return { labels, colorMap: { 0: "black" } };
    }

    // find largest component -> background
    let biggest = componentList[0];
    for (const k of componentList) {
        if (componentSizes[k] > componentSizes[biggest]) biggest = k;
    }

    const remaining = componentList.filter(k => k !== biggest);
    const palette = makePalette(remaining.length);

    const colorMap = { 0: "black" };
    remaining.forEach((lab, i) => {
        colorMap[lab] = palette[i];
    });
    // largest goes to background color
    colorMap[biggest] = "black";

    return { labels, colorMap };
}

// ========================
// Precompute once
// ========================
const seed    = makeSeed(seedMode);
const history = evolveRule110(seed, steps);           // full run
const { labels: labelGrid, colorMap } = colorizeStatic(history);

// ========================
// Animation: reveal rows one by one
// ========================
let currentRowIndex = 0;

function drawUpToRow(maxRow) {
    // clear and redraw everything up to maxRow (inclusive)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const h = labelGrid.length;
    const w = labelGrid[0].length;

    const lastRow = Math.min(maxRow, h - 1);

    for (let r = 0; r <= lastRow; r++) {
        for (let c = 0; c < w; c++) {
            const label = labelGrid[r][c];
            const color = colorMap[label] || "black";
            if (color !== "black") {
                ctx.fillStyle = color;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
}

function animateReveal() {
    drawUpToRow(currentRowIndex);
    currentRowIndex++;
    if (currentRowIndex < labelGrid.length) {
        setTimeout(animateReveal, STEP_DELAY);
    }
}

// start the reveal
animateReveal();
