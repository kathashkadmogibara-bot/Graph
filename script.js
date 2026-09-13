/* =====================================================
   MOGIBARA GRAPH STUDIO
   Pure JavaScript graph engine
===================================================== */


/* =====================================================
   EQUATION GRAPH
===================================================== */

const canvas = document.getElementById("equationCanvas");
const ctx = canvas.getContext("2d");

let scale = 45;
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;


/* -----------------------------
   Resize canvas
----------------------------- */

function resizeEquationCanvas() {

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
    );

    drawEquation();

}


/* -----------------------------
   Convert screen → math
----------------------------- */

function screenToMathX(x) {

    return (
        (x - canvas.clientWidth / 2 - offsetX)
        / scale
    );

}


function screenToMathY(y) {

    return (
        -(y - canvas.clientHeight / 2 - offsetY)
        / scale
    );

}


/* -----------------------------
   Convert math → screen
----------------------------- */

function mathToScreenX(x) {

    return (
        canvas.clientWidth / 2
        + offsetX
        + x * scale
    );

}


function mathToScreenY(y) {

    return (
        canvas.clientHeight / 2
        + offsetY
        - y * scale
    );

}


/* =====================================================
   EQUATION PARSER
===================================================== */

function calculateEquation(expression, x) {

    expression = expression
        .toLowerCase()
        .replace(/y\s*=/, "")
        .replace(/\^/g, "**")
        .replace(/π/g, "Math.PI")
        .replace(/\bsin\b/g, "Math.sin")
        .replace(/\bcos\b/g, "Math.cos")
        .replace(/\btan\b/g, "Math.tan")
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\blog\b/g, "Math.log10")
        .replace(/\bln\b/g, "Math.log")
        .replace(/\babs\b/g, "Math.abs");

    /*
       Convert x to the actual value.
    */

    expression = expression.replace(
        /\bx\b/g,
        "(" + x + ")"
    );

    try {

        return Function(
            '"use strict"; return (' +
            expression +
            ')'
        )();

    } catch {

        return NaN;

    }

}


/* =====================================================
   GRID
===================================================== */

function drawGrid() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;

    /*
       Calculate visible mathematical range.
    */

    const minX = screenToMathX(0);
    const maxX = screenToMathX(width);

    const minY = screenToMathY(height);
    const maxY = screenToMathY(0);


    /*
       Automatic grid step.

       Zoom out:

       -10 -5 0 5 10

       Zoom in:

       -1 -0.5 0 0.5 1
    */

    let rawStep = 80 / scale;

    const power =
        Math.pow(
            10,
            Math.floor(Math.log10(rawStep))
        );

    const normalized = rawStep / power;

    let multiplier;

    if (normalized < 1.5) {
        multiplier = 1;
    } else if (normalized < 3) {
        multiplier = 2;
    } else if (normalized < 7) {
        multiplier = 5;
    } else {
        multiplier = 10;
    }

    const step = multiplier * power;


    /*
       Vertical grid
    */

    let startX =
        Math.floor(minX / step) * step;

    for (
        let x = startX;
        x <= maxX;
        x += step
    ) {

        const sx = mathToScreenX(x);

        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);

        ctx.strokeStyle = "#e5e7eb";

        ctx.stroke();

        if (Math.abs(x) > step / 1000) {

            ctx.fillStyle = "#555";
            ctx.font = "12px Arial";

            ctx.fillText(
                formatNumber(x),
                sx + 3,
                height / 2 + 15
            );

        }

    }


    /*
       Horizontal grid
    */

    let startY =
        Math.floor(minY / step) * step;

    for (
        let y = startY;
        y <= maxY;
        y += step
    ) {

        const sy = mathToScreenY(y);

        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);

        ctx.strokeStyle = "#e5e7eb";

        ctx.stroke();

        if (Math.abs(y) > step / 1000) {

            ctx.fillStyle = "#555";
            ctx.font = "12px Arial";

            ctx.fillText(
                formatNumber(y),
                5,
                sy - 4
            );

        }

    }


    /*
       X axis
    */

    const zeroX = mathToScreenX(0);

    ctx.beginPath();
    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height);

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();


    /*
       Y axis
    */

    const zeroY = mathToScreenY(0);

    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();

}


/* =====================================================
   NUMBER FORMAT
===================================================== */

function formatNumber(number) {

    if (Math.abs(number) < 0.000001) {
        return "0";
    }

    return Number(
        number.toFixed(6)
    ).toString();

}


/* =====================================================
   DRAW EQUATION
===================================================== */

function drawEquation() {

    if (!canvas) return;

    drawGrid();

    const equation =
        document.getElementById("equation").value;

    const a =
        Number(
            document.getElementById("parameterA").value
        );

    const b =
        Number(
            document.getElementById("parameterB").value
        );


    /*
       Replace a and b.

       Example:

       y = a*x + b

       becomes

       y = 2*x + 3
    */

    let finalEquation =
        equation
            .replace(/\ba\b/g, "(" + a + ")")
            .replace(/\bb\b/g, "(" + b + ")");


    const width = canvas.clientWidth;

    const minX =
        screenToMathX(0);

    const maxX =
        screenToMathX(width);


    ctx.beginPath();

    let first = true;

    for (
        let x = minX;
        x <= maxX;
        x += (maxX - minX) / width
    ) {

        const y =
            calculateEquation(
                finalEquation,
                x
            );

        if (!Number.isFinite(y)) {

            first = true;
            continue;

        }

        const sx =
            mathToScreenX(x);

        const sy =
            mathToScreenY(y);

        if (
            sy < -100000 ||
            sy > canvas.clientHeight + 100000
        ) {

            first = true;
            continue;

        }

        if (first) {

            ctx.moveTo(sx, sy);
            first = false;

        } else {

            ctx.lineTo(sx, sy);

        }

    }


    ctx.strokeStyle = "#1769ff";
    ctx.lineWidth = 3;

    ctx.stroke();


    /*
       Update equation text
    */

    document.getElementById(
        "currentEquation"
    ).textContent =
        finalEquation;

}


/* =====================================================
   PARAMETER MOVEMENT
===================================================== */

function updateParameter() {

    const a =
        document.getElementById(
            "parameterA"
        ).value;

    const b =
        document.getElementById(
            "parameterB"
        ).value;


    document.getElementById(
        "aValue"
    ).textContent = a;


    document.getElementById(
        "bValue"
    ).textContent = b;


    drawEquation();

}


/* =====================================================
   SET EQUATION
===================================================== */

function setEquation(value) {

    document.getElementById(
        "equation"
    ).value = value;

    drawEquation();

}


/* =====================================================
   ZOOM
===================================================== */

function zoomIn() {

    scale *= 1.3;

    if (scale > 1000) {
        scale = 1000;
    }

    drawEquation();

}


function zoomOut() {

    scale /= 1.3;

    if (scale < 5) {
        scale = 5;
    }

    drawEquation();

}


/* =====================================================
   MOUSE PAN
===================================================== */

canvas.addEventListener(
    "mousedown",
    function(event) {

        dragging = true;

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

    }
);


window.addEventListener(
    "mouseup",
    function() {

        dragging = false;

    }
);


window.addEventListener(
    "mousemove",
    function(event) {

        if (!dragging) return;

        offsetX +=
            event.clientX - lastMouseX;

        offsetY +=
            event.clientY - lastMouseY;

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        drawEquation();

    }
);


/* =====================================================
   TOUCH PAN
===================================================== */

canvas.addEventListener(
    "touchstart",
    function(event) {

        if (event.touches.length !== 1) {
            return;
        }

        dragging = true;

        lastMouseX =
            event.touches[0].clientX;

        lastMouseY =
            event.touches[0].clientY;

    },
    { passive: true }
);


canvas.addEventListener(
    "touchmove",
    function(event) {

        if (!dragging ||
            event.touches.length !== 1) {
            return;
        }

        const x =
            event.touches[0].clientX;

        const y =
            event.touches[0].clientY;

        offsetX += x - lastMouseX;
        offsetY += y - lastMouseY;

        lastMouseX = x;
        lastMouseY = y;

        drawEquation();

    },
    { passive: true }
);


canvas.addEventListener(
    "touchend",
    function() {

        dragging = false;

    }
);


/* =====================================================
   MOUSE WHEEL ZOOM
===================================================== */

canvas.addEventListener(
    "wheel",
    function(event) {

        event.preventDefault();

        const mouseX =
            event.offsetX;

        const mouseY =
            event.offsetY;


        const beforeX =
            screenToMathX(mouseX);

        const beforeY =
            screenToMathY(mouseY);


        if (event.deltaY < 0) {

            scale *= 1.15;

        } else {

            scale /= 1.15;

        }


        scale =
            Math.max(
                5,
                Math.min(
                    1000,
                    scale
                )
            );


        const afterX =
            screenToMathX(mouseX);

        const afterY =
            screenToMathY(mouseY);


        offsetX +=
            (afterX - beforeX) * scale;

        offsetY -=
            (afterY - beforeY) * scale;


        drawEquation();

    },
    { passive: false }
);


/* =====================================================
   RESET
===================================================== */

function resetGraph() {

    scale = 45;

    offsetX = 0;
    offsetY = 0;

    drawEquation();

}


/* =====================================================
   DOWNLOAD
===================================================== */

function downloadEquationGraph() {

    const link =
        document.createElement("a");

    link.download =
        "MOGIBARA-equation-graph.png";

    link.href =
        canvas.toDataURL("image/png");

    link.click();

}


/* =====================================================
   STATISTICS GRAPH
===================================================== */

const statisticsCanvas =
    document.getElementById(
        "statisticsCanvas"
    );

const statisticsCtx =
    statisticsCanvas.getContext("2d");


function resizeStatisticsCanvas() {

    const rect =
        statisticsCanvas.getBoundingClientRect();

    statisticsCanvas.width =
        rect.width * window.devicePixelRatio;

    statisticsCanvas.height =
        rect.height * window.devicePixelRatio;

    statisticsCtx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
    );

}


/* =====================================================
   CREATE STATISTICS
===================================================== */

function createStatisticsGraph() {

    resizeStatisticsCanvas();

    const data =
        document.getElementById(
            "statisticsData"
        ).value;


    const lines =
        data
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);


    const labels = [];
    const values = [];


    lines.forEach(line => {

        const parts =
            line.split(",");

        if (parts.length < 2) {
            return;
        }

        const label =
            parts[0].trim();

        const value =
            Number(
                parts[1].trim()
            );


        if (
            label &&
            Number.isFinite(value)
        ) {

            labels.push(label);
            values.push(value);

        }

    });


    drawStatistics(
        labels,
        values
    );

}


/* =====================================================
   DRAW STATISTICS
===================================================== */

function drawStatistics(
    labels,
    values
) {

    const width =
        statisticsCanvas.clientWidth;

    const height =
        statisticsCanvas.clientHeight;


    statisticsCtx.clearRect(
        0,
        0,
        width,
        height
    );


    if (values.length === 0) {

        statisticsCtx.fillText(
            "No valid data",
            30,
            40
        );

        return;

    }


    const type =
        document.getElementById(
            "statisticsType"
        ).value;


    const title =
        document.getElementById(
            "statisticsTitle"
        ).value;


    /*
       Find maximum value.
    */

    const max =
        Math.max(...values, 1);


    const padding = 60;

    const graphWidth =
        width - padding * 2;

    const graphHeight =
        height - padding * 2;


    /*
       Title
    */

    statisticsCtx.fillStyle =
        "#17202a";

    statisticsCtx.font =
        "bold 20px Arial";

    statisticsCtx.fillText(
        title,
        padding,
        30
    );


    /*
       Axes
    */

    statisticsCtx.beginPath();

    statisticsCtx.moveTo(
        padding,
        padding
    );

    statisticsCtx.lineTo(
        padding,
        height - padding
    );

    statisticsCtx.lineTo(
        width - padding,
        height - padding
    );

    statisticsCtx.stroke();


    if (type === "bar") {

        const barWidth =
            graphWidth /
            values.length *
            0.6;


        values.forEach(
            (value, i) => {

                const x =
                    padding +
                    (
                        i + 0.2
                    ) *
                    (
                        graphWidth /
                        values.length
                    );


                const barHeight =
                    (
                        value / max
                    ) *
                    graphHeight;


                const y =
                    height -
                    padding -
                    barHeight;


                statisticsCtx.fillStyle =
                    "#1769ff";


                statisticsCtx.fillRect(
                    x,
                    y,
                    barWidth,
                    barHeight
                );


                drawLabel(
                    labels[i],
                    x,
                    height - padding + 20
                );


                statisticsCtx.fillStyle =
                    "#17202a";


                statisticsCtx.fillText(
                    value,
                    x,
                    y - 8
                );

            }
        );

    }


    else {

        statisticsCtx.beginPath();


        values.forEach(
            (value, i) => {

                const x =
                    padding +
                    (
                        i /
                        Math.max(
                            values.length - 1,
                            1
                        )
                    ) *
                    graphWidth;


                const y =
                    height -
                    padding -
                    (
                        value / max
                    ) *
                    graphHeight;


                if (i === 0) {

                    statisticsCtx.moveTo(
                        x,
                        y
                    );

                } else {

                    statisticsCtx.lineTo(
                        x,
                        y
                    );

                }


                if (
                    type === "point"
                ) {

                    statisticsCtx.fillStyle =
                        "#1769ff";

                    statisticsCtx.beginPath();

                    statisticsCtx.arc(
                        x,
                        y,
                        5,
                        0,
                        Math.PI * 2
                    );

                    statisticsCtx.fill();

                }


                drawLabel(
                    labels[i],
                    x - 10,
                    height - padding + 20
                );

            }
        );


        if (type === "line") {

            statisticsCtx.strokeStyle =
                "#1769ff";

            statisticsCtx.lineWidth =
                3;

            statisticsCtx.stroke();

        }

    }

}


/* =====================================================
   STATISTICS LABEL
===================================================== */

function drawLabel(
    text,
    x,
    y
) {

    statisticsCtx.fillStyle =
        "#17202a";

    statisticsCtx.font =
        "12px Arial";

    statisticsCtx.fillText(
        text,
        x,
        y
    );

}


/* =====================================================
   SIMPLE EQUATION SOLVER
===================================================== */

function solveEquation() {

    const input =
        document.getElementById(
            "solveEquation"
        ).value.trim();


    const result =
        document.getElementById(
            "solution"
        );


    if (!input.includes("=")) {

        result.textContent =
            "Please enter an equation with =";

        return;

    }


    const parts =
        input.split("=");


    if (parts.length !== 2) {

        result.textContent =
            "Invalid equation.";

        return;

    }


    const left =
        parts[0].trim();

    const right =
        parts[1].trim();


    /*
       This simple solver handles
       linear equations.

       Example:

       2*x+4=10
    */


    const leftMatch =
        left.match(
            /^([+-]?\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d*\.?\d*)?$/
        );


    if (!leftMatch) {

        result.textContent =
            "Currently this solver supports simple linear equations such as 2*x+4=10.";

        return;

    }


    let a =
        leftMatch[1];

    let b =
        leftMatch[2] || "0";


    if (
        a === "" ||
        a === "+"
    ) {
        a = 1;
    }

    else if (a === "-") {
        a = -1;
    }

    else {
        a = Number(a);
    }


    b =
        Number(
            b.replace(/\s/g, "")
        );


    const c =
        Number(right);


    if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        !Number.isFinite(c) ||
        a === 0
    ) {

        result.textContent =
            "Could not solve this equation.";

        return;

    }


    const x =
        (c - b) / a;


    result.innerHTML =
        "<strong>Solution:</strong> x = " +
        formatNumber(x);

}


/* =====================================================
   START
===================================================== */

window.addEventListener(
    "resize",
    function() {

        resizeEquationCanvas();

        resizeStatisticsCanvas();

        createStatisticsGraph();

    }
);


resizeEquationCanvas();

createStatisticsGraph();

drawEquation();
