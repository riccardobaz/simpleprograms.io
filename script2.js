/*************************************
 *  SVG invert filter for the logo
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
 *  Apply invert filter to logo
 ******************************************/
const logo = document.getElementById("logo");
logo.style.filter = "url(#invert-filter)";


/*************************************
 *  Canvas setup
 *************************************/
const canvas = document.getElementById("caCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


/*************************************
 *  Load list of PNG patterns
 *************************************/
let patternImages = [];

fetch("patterns/index.json")
    .then(res => res.json())
    .then(list => {
        patternImages = list.map(x => "patterns/" + x);
        loadRandomPattern();
    })
    .catch(err => console.error("Could not load index.json", err));


/*************************************
 *  Load & scroll a pattern
 *************************************/
function loadRandomPattern() {
    const img = new Image();
    img.src = patternImages[Math.floor(Math.random() * patternImages.length)];

    img.onload = () => {
        console.log("Loaded:", img.src);
        startScrolling(img);
    };
}


/*************************************
 *  Scrolling animation
 *************************************/
function startScrolling(img) {
    const imgW = img.width;
    const imgH = img.height;

    let buffer = [];
    let nextRow = 0;

    function step() {
        // 1px tall row canvas
        const rowCanvas = document.createElement("canvas");
        rowCanvas.width = imgW;
        rowCanvas.height = 1;

        const rctx = rowCanvas.getContext("2d");
        rctx.imageSmoothingEnabled = false;

        // Extract row
        rctx.drawImage(img, 0, nextRow, imgW, 1, 0, 0, imgW, 1);

        buffer.push(rowCanvas);

        // Limit to screen height
        if (buffer.length > canvas.height) buffer.shift();

        // Clear display
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw every stored row stretched horizontally
        for (let i = 0; i < buffer.length; i++) {
            const row = buffer[i];
            ctx.drawImage(row, 0, 0, imgW, 1, 0, i, canvas.width, 1);
        }

        nextRow++;

        // When full PNG consumed → load a new one
        if (nextRow >= imgH) {
            loadRandomPattern();
            return;
        }

        requestAnimationFrame(step);
    }

    step();
}
