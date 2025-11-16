const canvas = document.getElementById("ca-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Rule 110 lookup table
// Mapping from (left, self, right) binary to next state
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

// Size of each cell (visual resolution)
const cellSize = 3;

// Number of cells per row
let cols = Math.floor(canvas.width / cellSize);

// Current and next generation arrays
let current = new Array(cols).fill(0);
let next = new Array(cols).fill(0);

// Fill with random seed
for (let i = 0; i < cols; i++) {
    current[i] = Math.random() < 0.5 ? 1 : 0;
}

let y = 0;

// Draw loop
function step() {
    // Draw current generation
    for (let x = 0; x < cols; x++) {
        if (current[x] === 1) {
            ctx.fillStyle = "white";
        } else {
            ctx.fillStyle = "black";
        }
        ctx.fillRect(x * cellSize, y, cellSize, cellSize);
    }

    // Compute next row
    for (let i = 0; i < cols; i++) {
        const left = current[(i - 1 + cols) % cols];
        const self = current[i];
        const right = current[(i + 1) % cols];
        const key = `${left}${self}${right}`;
        next[i] = rule110[key];
    }

    // Move to next row
    y += cellSize;

    // If we reach bottom → restart with a new random seed
    if (y >= canvas.height) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        y = 0;
        for (let i = 0; i < cols; i++) {
            current[i] = Math.random() < 0.5 ? 1 : 0;
        }
    } else {
        // Copy next → current
        [current, next] = [next.slice(), current];
    }

    requestAnimationFrame(step);
}

step();
