// ========================
// Faithful port of WL CA pipeline
// radius = 2, k = 2, classII rules
// ========================

// ---- CANVAS ----
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
// For now, just recompute everything on resize
window.addEventListener("resize", () => location.reload());

// ---- PARAMETERS (mirroring WL) ----
const cellSize = 3;
const L = Math.floor(canvas.width / cellSize);  // width & #rows kept in slice
const steps = 4 * L;                            // total evolution steps
const radius = 2;
const k = 2;
const STEP_DELAY = 20;                          // ms per revealed row

// ---- CLASS II RULE LIST FROM YOUR FILE ----
const classIIrules = [
  7, 11, 13, 15, 19, 23, 27, 29, 35, 39,
  47, 55, 59, 71, 79, 104, 112, 152,
  216, 228, 230, 232, 233, 240
];

// ---- PICK ONE RULE AT RANDOM (like RandomSample[..]) ----
const ruleN = classIIrules[Math.floor(Math.random() * classIIrules.length)];
console.log("Using rule {n,r,k} =", ruleN, radius, k);

// ========================
// BUILD WOLFRAM-STYLE RULE TABLE {n, r=2, k=2}
// ========================
function buildRuleTable(n, radius, k) {
    const width = 2 * radius + 1;           // 5
    const numConfigs = Math.pow(k, width);  // 2^5 = 32

    // Wolfram convention: neighborhoods ordered from all-1s down to all-0s
    // Example for r=1:
    //   111,110,...,000  ↔ bits from MSB to LSB of rule number
    // Generalization: for width=5 => 11111 (index 31) down to 00000 (index 0)
    const binary = n.toString(2).padStart(numConfigs, "0");
    // binary[0] → 11111, binary[31] → 00000

    const table = {};
    for (let i = 0; i < numConfigs; i++) {
        const patternIndex = numConfigs - 1 - i; // 31..0 -> 00000..11111 as integers
        const pattern = patternIndex.toString(2).padStart(width, "0");
        const out = parseInt(binary[i], 10);     // MSB for 11111
        table[pattern] = out;
    }
    return table;
}

const ruleTable = buildRuleTable(ruleN, radius, k);

// ========================
// SEED GENERATION (like makeSeed["random"])
// ========================
function makeRandomSeed(len) {
    const arr = new Array(len);
    for (let i = 0; i < len; i++) {
        arr[i] = Math.random() < 0.5 ? 1 : 0;
    }
    return arr;
}

// (you can add a "singleCenter" mode if you like)
const seed = makeRandomSeed(L);

// ========================
// EVOLVE CA (like CellularAutomaton[{n,2,2}, seed, steps])
// ========================
function evolveCA(ruleTable, seed, steps, radius) {
    const history = [];
    let row = seed.slice();

    const len = row.length;
    const width = 2 * radius + 1;

    for (let t = 0; t < steps; t++) {
        history.push(row.slice());

        const next = new Array(len);
        for (let i = 0; i < len; i++) {
            let neigh = "";
            for (let d = -radius; d <= radius; d++) {
                const idx = (i + d + len) % len;   // wrap-around
                neigh += row[idx];
            }
            const out = ruleTable[neigh] ?? 0;
            next[i] = out;
        }
        row = next;
    }

    return history;
}

const run = evolveCA(ruleTable, seed, steps, radius);

// ========================
// TAKE SLICE: like
// slice = If[Length[run] >= L, Take[run, -L], run];
// ========================
let slice;
if (run.length >= L) {
    slice = run.slice(run.length - L);   // last L rows
} else {
    slice = run.slice();                 // all rows
}

// ========================
// CONNECTED COMPONENTS (4-neighbor) ON SLICE
// ========================
function computeComponents(buffer) {
    const h = buffer.length;
    const w = buffer[0].length;

    const labels = Array.from({ length: h }, () => new Array(w).fill(0));
    let currentLabel = 1;

    const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1]
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

const { labels, sizes } = computeComponents(slice);

// ========================
// AURORA-LIKE PALETTE
// ========================
const auroraPaletteBase = [
    "#2E1A47", // deep violet
    "#22436F", // night blue
    "#0E7C86", // cyan-teal
    "#6BCF63", // green
    "#F6C445", // yellow-orange
    "#E06D2F", // orange
    "#C02639"  // crimson
];

function hexToRGB(hex) {
    const v = parseInt(hex.slice(1), 16);
    return {
        r: (v >> 16) & 255,
        g: (v >> 8) & 255,
        b: v & 255
    };
}

function auroraPalette(n) {
    if (n <= 0) return [];
    if (n === 1) return [auroraPaletteBase[0]];

    const result = [];
    const last = auroraPaletteBase.length - 1;

    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const idx = t * last;
        const i0 = Math.floor(idx);
        const i1 = Math.min(i0 + 1, last);
        const f = idx - i0;

        const c0 = hexToRGB(auroraPaletteBase[i0]);
        const c1 = hexToRGB(auroraPaletteBase[i1]);

        const r = Math.round(c0.r + f * (c1.r - c0.r));
        const g = Math.round(c0.g + f * (c1.g - c0.g));
        const b = Math.round(c0.b + f * (c1.b - c0.b));

        result.push(`rgb(${r},${g},${b})`);
    }
    return result;
}

// ========================
// COLOR ASSIGNMENT (like processSlice)
// largest component → background
// ========================
const componentLabels = Object.keys(sizes).map(k => parseInt(k));
let biggest = null;
if (componentLabels.length > 0) {
    biggest = componentLabels[0];
    for (const k of componentLabels) {
        if (sizes[k] > sizes[biggest]) biggest = k;
    }
}

const remaining = biggest === null
    ? []
    : componentLabels.filter(k => k !== biggest);

const palette = auroraPalette(remaining.length);
const colorMap = { 0: "black" }; // background for label 0

remaining.forEach((lab, idx) => {
    colorMap[lab] = palette[idx];
});

if (biggest !== null) {
    // the largest component is treated as background (black)
    colorMap[biggest] = "black";
}

// ========================
// ANIMATION: reveal slice row-by-row
// ========================
let currentRow = 0;

function drawUpToRow(rowMax) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const h = labels.length;
    const w = labels[0].length;
    const maxRow = Math.min(rowMax, h - 1);

    for (let r = 0; r <= maxRow; r++) {
        for (let c = 0; c < w; c++) {
            const lab = labels[r][c];
            const col = colorMap[lab] || "black";
            if (col !== "black") {
                ctx.fillStyle = col;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
}

function animate() {
    drawUpToRow(currentRow);
    currentRow++;
    if (currentRow < labels.length) {
        setTimeout(animate, STEP_DELAY);
    }
}

animate();
