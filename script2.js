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
window.addEventListener("resize", resizeCanvas);

// ========================
// Rule 110 (binary, r=1)
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
// Parameters
// ========================
const cellSize = 3;   // pixel size
const columns = () => Math.floor(canvas.width  / cellSize);
const rows    = () => Math.floor(canvas.height / cellSize);

const STEP_DELAY = 80;

// initial CA row
let currentRow = new Array(columns()).fill(0).map(() =>
    Math.random() < 0.5 ? 1 : 0
);

// rolling buffer of rows
let rowBuffer = [];

// ========================
// CA evolution
// ========================
function computeNextRow(row) {
    const next = new Array(row.length).fill(0);
    for (let i = 0; i < row.length; i++) {
        const left  = row[(i - 1 + row.length) % row.length];
        const mid   = row[i];
        const right = row[(i + 1) % row.length];
        next[i] = rule110[`${left}${mid}${right}`];
    }
    return next;
}

// ========================
// Connected Components (4-connected BFS)
// ========================
function computeComponents(buffer) {
    const h = buffer.length;
    const w = buffer[0].length;

    const labels = Array.from({ length: h }, () => new Array(w).fill(0));
    let currentLabel = 1;

    const dirs = [
        [1,0], [-1,0], [0,1], [0,-1] // CornerNeighbors->False in Mathematica
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

    // find components
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
// Palette (Hue gradient)
// ========================
function makePalette(n) {
    const colors = [];
    for (let i = 0; i < n; i++) {
        const hue = (i / n) * 360;
        colors.push(`hsl(${hue}, 100%, 60%)`);
    }
    return colors;
}

// ========================
// Component colorization
// ========================
function colorize(buffer) {
    const { labels, componentSizes } = computeComponents(buffer);

    const componentList = Object.keys(componentSizes).map(k => parseInt(k));

    if (componentList.length === 0) {
        return { labels, colorMap: { 0: "black" } };
    }

    // largest component → background
    let biggest = componentList[0];
    for (const k of componentList) {
        if (componentSizes[k] > componentSizes[biggest]) biggest = k;
    }

    // remaining components get unique colors
    const remaining = componentList.filter(k => k !== biggest);
    const palette = makePalette(remaining.length);

    const colorMap = {};
    remaining.forEach((lab, i) => {
        colorMap[lab] = palette[i];
    });

    // background
    colorMap[biggest] = "black";

    return { labels, colorMap };
}

// ========================
// Main loop
// ========================
function step() {
    const maxRows = rows();

    // add newest CA row
    rowBuffer.push(currentRow.slice());
    if (rowBuffer.length > maxRows) rowBuffer.shift();

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // colorize all buffered rows
    const { labels, colorMap } = colorize(rowBuffer);

    // draw according to component labels
    for (let r = 0; r < labels.length; r++) {
        for (let c = 0; c < labels[r].length; c++) {
            const label = labels[r][c];
            ctx.fillStyle = colorMap[label] || "black";
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }

    // evolve state
    currentRow = computeNextRow(currentRow);

    // schedule next
    setTimeout(step, STEP_DELAY);
}

// start evolution
step();
