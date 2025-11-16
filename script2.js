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

// ==== Color Palettes ====
const palettes = {
    "AuroraColors": [
        "#00ff87", "#00d4ff", "#0087ff", "#5f00ff", "#af00ff", 
        "#ff00af", "#ff0087", "#ff5f00", "#ffaf00", "#ffd700"
    ],
    "BrightBands": [
        "#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff",
        "#06ffa5", "#ff006e", "#fb5607", "#ffbe0b", "#8338ec"
    ],
    "Neon": [
        "#ff00ff", "#00ffff", "#ffff00", "#ff0080", "#00ff80",
        "#8000ff", "#ff8000", "#0080ff", "#80ff00", "#ff0040"
    ]
};

// ==== Simulation parameters ====
const cellSize = 3;
const columns = () => Math.floor(canvas.width / cellSize);
const rows = () => Math.floor(canvas.height / cellSize);
const STEP_DELAY = 80;

// Choose your palette here
const PALETTE = palettes.AuroraColors;
const BG_COLOR = "#000000";

let currentRow = new Array(columns()).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
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

// ==== Connected Component Labeling ====
function findConnectedComponents(grid) {
    const height = grid.length;
    const width = grid[0].length;
    const labels = Array.from({ length: height }, () => new Array(width).fill(0));
    let currentLabel = 1;
    const componentSizes = {};

    function floodFill(y, x, label) {
        const stack = [[y, x]];
        let size = 0;
        
        while (stack.length > 0) {
            const [cy, cx] = stack.pop();
            
            if (cy < 0 || cy >= height || cx < 0 || cx >= width) continue;
            if (labels[cy][cx] !== 0 || grid[cy][cx] === 0) continue;
            
            labels[cy][cx] = label;
            size++;
            
            // 4-connected neighbors (not diagonal)
            stack.push([cy - 1, cx]);
            stack.push([cy + 1, cx]);
            stack.push([cy, cx - 1]);
            stack.push([cy, cx + 1]);
        }
        
        return size;
    }

    // Label all components
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === 1 && labels[y][x] === 0) {
                const size = floodFill(y, x, currentLabel);
                componentSizes[currentLabel] = size;
                currentLabel++;
            }
        }
    }

    return { labels, componentSizes, numComponents: currentLabel - 1 };
}

function getColorForLabel(label, numComponents) {
    if (label === 0) return BG_COLOR;
    
    // Use palette colors, cycling if needed
    const colorIndex = (label - 1) % PALETTE.length;
    return PALETTE[colorIndex];
}

function drawColorized() {
    if (rowBuffer.length === 0) return;

    const { labels, componentSizes, numComponents } = findConnectedComponents(rowBuffer);
    
    // Find largest component (to make it background)
    let largestLabel = 0;
    let largestSize = 0;
    
    for (const [label, size] of Object.entries(componentSizes)) {
        if (size > largestSize) {
            largestSize = size;
            largestLabel = parseInt(label);
        }
    }

    // Draw the colorized CA
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < labels.length; y++) {
        for (let x = 0; x < labels[y].length; x++) {
            let label = labels[y][x];
            
            // Make largest component the background color
            if (label === largestLabel) {
                ctx.fillStyle = BG_COLOR;
            } else if (label === 0) {
                ctx.fillStyle = BG_COLOR;
            } else {
                // Reassign labels to avoid largest
                const adjustedLabel = label > largestLabel ? label - 1 : label;
                ctx.fillStyle = getColorForLabel(adjustedLabel, numComponents - 1);
            }
            
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
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

    // Draw colorized version
    drawColorized();

    // Compute next row
    currentRow = computeNextRow(currentRow);

    // Schedule next step
    setTimeout(step, STEP_DELAY);
}

// Start the loop
step();
