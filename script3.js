// ======================================================
// JSON Pattern Viewer
// Displays a Mathematica-exported CA slice line-by-line
// ======================================================

// HTML must contain: <canvas id="caCanvas"></canvas>
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");

// Load a JSON file exported from Mathematica via:
//   data = ImageData[img, "Byte"];
//   Export["pattern.json", data];
//
// JSON structure: data[row][column] = [R,G,B]
//
// For convenience, change this filename or make it dynamic:
const JSON_FILE = "pattern.json";

// Speed control (ms per line)
const LINE_DELAY = 10;     // lower = faster
const PIXEL_SIZE = 1;      // 1 = actual pixels, >1 for scaling

// ------------------------------------------------------
// Load JSON and start animation
// ------------------------------------------------------
fetch(JSON_FILE)
  .then(resp => resp.json())
  .then(data => startAnimation(data))
  .catch(err => console.error("Error loading JSON:", err));

// ------------------------------------------------------
// Main animation logic
// ------------------------------------------------------
function startAnimation(data) {
    const rows = data.length;
    const cols = data[0].length;

    // Resize canvas to fit pattern (scaled)
    canvas.width  = cols * PIXEL_SIZE;
    canvas.height = rows * PIXEL_SIZE;

    let y = 0;   // current row to draw

    function drawNextRow() {
        if (y >= rows) return; // done

        const row = data[y];

        // Draw row pixel-by-pixel
        for (let x = 0; x < cols; x++) {
            const [r, g, b] = row[x];
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(
                x * PIXEL_SIZE,
                y * PIXEL_SIZE,
                PIXEL_SIZE,
                PIXEL_SIZE
            );
        }

        y++;
        setTimeout(drawNextRow, LINE_DELAY);
    }

    drawNextRow();
}
