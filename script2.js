// ==== Canvas setup ====
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ==== Load PNG ====
const img = new Image();
img.src = "981788751.png";   // <-- change PNG name here

let pixelData = null;
let imgW = 0;
let imgH = 0;

let cellH = 3;          // FIXED pixel row height (same as Rule 110)
let maxRows = 0;

const STEP_DELAY = 60;  // speed of evolution

let rowBuffer = [];     // lines currently displayed
let pngRow = 0;         // which row of the PNG to read next


// =============================
//  LOAD PNG + PREPARE DATA
// =============================
img.onload = function () {

    // Hidden canvas to extract pixel data
    const hidden = document.createElement("canvas");
    hidden.width = img.width;
    hidden.height = img.height;
    const hctx = hidden.getContext("2d");
    hctx.drawImage(img, 0, 0);

    imgW = img.width;
    imgH = img.height;

    // Extract all pixel data once
    pixelData = hctx.getImageData(0, 0, imgW, imgH).data;

    // Fixed pixel height → calculate how many rows fit on screen
    maxRows = Math.floor(canvas.height / cellH);

    step();   // start animation
};


// =============================
//  EXTRACT 1 PNG ROW
// =============================
function getPNGRow(y) {
    const row = [];
    const offset = y * imgW * 4;

    for (let x = 0; x < imgW; x++) {
        const i = offset + x * 4;
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        row.push(`rgb(${r},${g},${b})`);
    }
    return row;
}


// =============================
//  DRAW ONE ROW (FIXED SIZE)
// =============================
function drawRow(row, yIndex) {
    const cellW = canvas.width / imgW;

    for (let x = 0; x < row.length; x++) {
        ctx.fillStyle = row[x];
        ctx.fillRect(x * cellW, yIndex * cellH, cellW, cellH);
    }
}


// =============================
//  DRAW FULL BUFFER
// =============================
function drawFullBuffer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < rowBuffer.length; i++) {
        drawRow(rowBuffer[i], i);
    }
}


// =============================
//        MAIN LOOP
// =============================
function step() {

    // Read next PNG row
    const newRow = getPNGRow(pngRow);
    pngRow = (pngRow + 1) % imgH;

    // Add it to buffer
    rowBuffer.push(newRow);

    // PHASE 1: Initial fill (NO scrolling)
    if (rowBuffer.length < maxRows) {
        drawFullBuffer();
        return setTimeout(step, STEP_DELAY);
    }

    // PHASE 2: Scrolling (like Rule 110)
    if (rowBuffer.length > maxRows) {
        rowBuffer.shift();  // remove top row
    }

    drawFullBuffer();
    setTimeout(step, STEP_DELAY);
}
