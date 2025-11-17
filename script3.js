const img = new Image();
img.src = "19.png";

img.onload = function() {
    const h = img.height;
    const w = img.width;
    const cellSize = 1;

    canvas.width = w;
    canvas.height = h;

    let row = 0;
    const speed = 10; // ms

    function drawLine() {
        ctx.drawImage(img,
            0, row, w, 1,     // src area
            0, row, w, 1      // destination
        );
        row++;
        if (row < h) setTimeout(drawLine, speed);
    }

    drawLine();
};
