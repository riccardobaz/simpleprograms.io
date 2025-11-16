// ========================
// Aurora CA visualizer (radius-2, k=2)
// ========================

// ---- CANVAS SETUP ----
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => location.reload());

// ---- PARAMETERS ----
const cellSize = 3;
const L = Math.floor(canvas.width / cellSize);
const steps = 4 * L;
const STEP_DELAY = 15;

// ---- CLASS II RULE LIST (from your file) ----
const classIIrules = [
  7,11,13,15,19,23,27,29,35,39,
  47,55,59,71,79,104,112,152,
  216,228,230,232,233,240
];

// ---- CHOOSE RANDOM RULE ----
const ruleN = classIIrules[Math.floor(Math.random() * classIIrules.length)];
console.log("Using rule:", ruleN);

// ===============================
// BUILD RULE TABLE FOR (n, r=2, k=2)
// ===============================
const radius = 2;
const k = 2;
const neighborhoodSize = 2 * radius + 1;
const ruleTable = {};

(function buildRule() {
    // There are 2^(2r+1) possible neighborhoods
    const numNeighborhoods = Math.pow(k, neighborhoodSize); // 2^5 = 32
    let n = ruleN;

    for (let i = 0; i < numNeighborhoods; i++) {
        const output = n & 1;
        n >>= 1;

        // neighborhood encoded as e.g. "01001"
        const bits = i.toString(2).padStart(neighborhoodSize, "0");
        ruleTable[bits] = output;
    }
})();

// ===============================
// SEED INITIAL ROW
// ===============================
function makeSeed(length) {
    const arr = new Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = Math.random() < 0.5 ? 1 : 0;
    }
    return arr;
}
const seed = makeSeed(L);

// ===============================
// EVOLVE THE CA FOR ALL STEPS
// ===============================
function evolveCA(seed, steps) {
    const hist = [];
    let row = seed.slice();

    for (let t = 0; t < steps; t++) {
        hist.push(row.slice());

        const next = new Array(row.length);
        for (let i = 0; i < row.length; i++) {
            let neigh = "";
            for (let d = -radius; d <= radius; d++) {
                neigh += row[(i + d + row.length) % row.length];
            }
            next[i] = ruleTable[neigh];
        }

        row = next;
    }
    return hist;
}

const history = evolveCA(seed, steps);

// ===============================
// CONNECTED COMPONENTS (4-neighbor)
// ===============================
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

    const sizes = {};

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            if (buffer[r][c] === 1 && labels[r][c] === 0) {
                const s = bfs(r, c);
                sizes[currentLabel] = s;
                currentLabel++;
            }
        }
    }

    return { labels, sizes };
}

// ===============================
// AURORA PALETTE (approximation)
// ===============================
const auroraPaletteBase = [
    "#2E1A47",
    "#22436F",
    "#0E7C86",
    "#6BCF63",
    "#F6C445",
    "#E06D2F",
    "#C02639"
];

function auroraPalette(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1 || 1);
        const idx = t * (auroraPaletteBase.length - 1);
        const i0 = Math.floor(idx);
        const i1 = Math.min(i0 + 1, auroraPaletteBase.length - 1);
        const f  = idx - i0;

        const c0 = hexToRGB(auroraPaletteBase[i0]);
        const c1 = hexToRGB(auroraPaletteBase[i1]);

        const r = Math.round(c0.r + f*(c1.r - c0.r));
        const g = Math.round(c0.g + f*(c1.g - c0.g));
        const b = Math.round(c0.b + f*(c1.b - c0.b));

        result.push(`rgb(${r},${g},${b})`);
    }
    return result;
}

function hexToRGB(hex) {
    const v = parseInt(hex.slice(1), 16);
    return { 
        r: (v >> 16) & 255,
        g: (v >> 8) & 255,
        b: v & 255
    };
}

// ===============================
// STATIC COLORIZATION
// ===============================
const { labels, sizes } = computeComponents(history);

const comps = Object.keys(sizes).map(k => parseInt(k));
let biggest = comps[0];
for (const k of comps) {
    if (sizes[k] > sizes[biggest]) biggest = k;
}

const remaining = comps.filter(k => k !== biggest);
const palette = auroraPalette(remaining.length);

const colorMap = { 0: "black" };
remaining.forEach((lab, idx) => {
    colorMap[lab] = palette[idx];
});
colorMap[biggest] = "black"; // largest → background

// ===============================
// ANIMATION: reveal line-by-line
// ===============================
let currentRow = 0;

function drawUpTo(row) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r <= row && r < labels.length; r++) {
        for (let c = 0; c < labels[r].length; c++) {
            const lab = labels[r][c];
            const col = colorMap[lab];
            if (col !== "black") {
                ctx.fillStyle = col;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
}

function animate() {
    drawUpTo(currentRow);
    currentRow++;
    if (currentRow < labels.length) {
        setTimeout(animate, STEP_DELAY);
    }
}

animate();
