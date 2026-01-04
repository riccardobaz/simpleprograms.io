// ==== COLOR CONFIGURATION ====
// Add new colors here! Format: { length: number of consecutive whites, color: 'colorName', hex: '#RRGGBB' }
// The pattern will look for consecutive white cells (state 0) surrounded by black cells (state 1)
// with black cells directly above them in the previous row.
// 
// TO ADD A NEW COLOR: Just add a new entry to this array!
// Example: { length: 9, color: 'orange', hex: '#ff8800' }

const COLOR_PATTERNS = [
    { length: 9, color: 'green', hex: '#66FF00' },
    { length: 8, color: 'yellow', hex: '#ffff00' },
    { length: 7, color: 'purple', hex: '#9900ff' },
    { length: 6, color: 'cyan', hex: '#00ffff' },
    { length: 5, color: 'magenta', hex: '#ff00ff' },
    { length: 4, color: 'blue', hex: '#0066ff' },
    { length: 3, color: 'darkgrey', hex: '#404040' },
    { length: 2, color: 'white', hex: '#ffffff' },
    { length: 1, color: 'red', hex: '#ff0000' }
];

// Sort by length (longest first) to avoid conflicts
COLOR_PATTERNS.sort((a, b) => b.length - a.length);

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

// Evolution speed (milliseconds per new row)
const STEP_DELAY = 80;                  // adjust 50–150 ms to tune speed

// Current CA state (the "current row")
// Each cell is now an object: { state: 0 or 1, color: 'colorName' }
let currentRow = new Array(columns()).fill(0).map(() => {
    const state = Math.random() < 0.5 ? 1 : 0;
    return { state: state, color: state === 1 ? 'black' : 'white' };
});

// A buffer of rows we have drawn (screen scroll effect)
let rowBuffer = [];

function computeNextRow(row, previousRow) {
    const next = new Array(row.length);
    
    // First, compute the next state using Rule 110
    for (let i = 0; i < row.length; i++) {
        const left = row[(i - 1 + row.length) % row.length].state;
        const mid = row[i].state;
        const right = row[(i + 1) % row.length].state;
        const neighborhood = `${left}${mid}${right}`;
        const newState = rule110[neighborhood];
        next[i] = { state: newState, color: newState === 1 ? 'black' : 'white' };
    }
    
    // Apply coloring rules - keep colors from above first
    for (let i = 0; i < next.length; i++) {
        if (previousRow && next[i].state === 0) {
            const colorAbove = previousRow[i].color;
            // Check if the color above is one of our pattern colors
            const isPatternColor = COLOR_PATTERNS.some(p => p.color === colorAbove);
            if (isPatternColor) {
                next[i].color = colorAbove;
            }
        }
    }
    
    // Check for patterns - process from longest to shortest (already sorted)
    // Now with proper wrap-around support for cylindrical topology
    for (const pattern of COLOR_PATTERNS) {
        const len = pattern.length;
        const colorName = pattern.color;
        
        // Check all positions including wrap-around
        for (let i = 0; i < next.length; i++) {
            // Get indices with wrap-around
            const beforeIdx = (i - 1 + next.length) % next.length;
            const afterIdx = (i + len) % next.length;
            
            const before = next[beforeIdx];
            const after = next[afterIdx];
            
            if (before.state === 1 && after.state === 1) {
                let allWhite = true;
                let allBlackAbove = true;
                
                for (let j = 0; j < len; j++) {
                    const idx = (i + j) % next.length;
                    if (next[idx].state !== 0) allWhite = false;
                    if (previousRow && previousRow[idx].state !== 1) allBlackAbove = false;
                }
                
                if (allWhite && allBlackAbove) {
                    for (let j = 0; j < len; j++) {
                        const idx = (i + j) % next.length;
                        next[idx].color = colorName;
                    }
                }
            }
        }
    }
    
    return next;
}

function drawRow(row, y) {
    for (let x = 0; x < row.length; x++) {
        // Find the hex color for this cell
        const cellColor = row[x].color;
        const pattern = COLOR_PATTERNS.find(p => p.color === cellColor);
        
        if (pattern) {
            ctx.fillStyle = pattern.hex;
        } else if (row[x].state === 1) {
            ctx.fillStyle = "#000000"; // black
        } else {
            ctx.fillStyle = "#ffffff"; // white
        }
        
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
    // Compute next row (pass current row as previous)
    const previousRow = currentRow;
    currentRow = computeNextRow(currentRow, previousRow);
    // Schedule next step
    setTimeout(step, STEP_DELAY);
}

// Start the loop
step();
