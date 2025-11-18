/*************************************
 *  Inject SVG invert filter via JS
 *************************************/
(function createInvertFilter() {
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";

    const filter = document.createElementNS(svgNS, "filter");
    filter.setAttribute("id", "invert-filter");

    const fe = document.createElementNS(svgNS, "feComponentTransfer");

    const r = document.createElementNS(svgNS, "feFuncR");
    r.setAttribute("type", "table");
    r.setAttribute("tableValues", "1 0");

    const g = document.createElementNS(svgNS, "feFuncG");
    g.setAttribute("type", "table");
    g.setAttribute("tableValues", "1 0");

    const b = document.createElementNS(svgNS, "feFuncB");
    b.setAttribute("type", "table");
    b.setAttribute("tableValues", "1 0");

    fe.appendChild(r);
    fe.appendChild(g);
    fe.appendChild(b);
    filter.appendChild(fe);
    svg.appendChild(filter);
    document.body.appendChild(svg);
})();

/******************************************
 *  Apply invert filter & position logo
 ******************************************/
const logo = document.getElementById("logo");
logo.style.filter = "url(#invert-filter)";
logo.style.position = "fixed";
logo.style.top = "2rem";
logo.style.left = "2rem";
logo.style.pointerEvents = "none";
logo.style.zIndex = "9999";

/*************************************
 *  Canvas Setup (Mobile-safe)
 *************************************/
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

// Prevent mobile scroll bounce
document.body.style.touchAction = "none";

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Internal resolution
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;

    // CSS size
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";

    // Scale so drawing uses CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/*************************************
 * Load index.json → Pick a random PNG
 *************************************/
let patternImages = [];

fetch("patterns/index.json")
    .then(r => r.json())
    .then(list => {
        patternImages = list.map(f => "patterns/" + f);
        loadRandomPattern();      // Start!
    });

function loadRandomPattern() {
    const img = new Image();
    img.src = patternImages[Math.floor(Math.random() * patternImages.length)];
    img.onload = () => startScrolling(img);
}

/*************************************
 *  Fullscreen CA scrolling effect
 *************************************/
function startScrolling(img) {
    const imgW = img.width;
    const imgH = img.height;

    let buffer = [];
    let nextRow = 0;

    function step() {
        // 1px-tall row canvas
        const rowCanvas = document.createElement("canvas");
        rowCanvas.width = imgW;
        rowCanvas.height = 1;

        const rctx = rowCanvas.getContext("2d");
        rctx.imageSmoothingEnabled = false;

        // Copy one row from the PNG
        rctx.drawImage(img, 0, nextRow, imgW, 1, 0, 0, imgW, 1);

        buffer.push(rowCanvas);

        // Remove older rows when beyond screen height
        if (buffer.length > canvas.height) buffer.shift();

        // Clear screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw every row in buffer sequentially
        for (let i = 0; i < buffer.length; i++) {
            ctx.drawImage(
                buffer[i],
                0, 0, imgW, 1,
                0, i, canvas.width, 1
            );
        }

        nextRow = (nextRow + 1) % imgH;
        requestAnimationFrame(step);
    }

    step();
}
