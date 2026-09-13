/* =====================================================
   MOGIBARA GRAPH STUDIO
   Complete JavaScript Graph Engine
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

let activePointerId = null;


/* =====================================================
   RESIZE EQUATION CANVAS
===================================================== */

function resizeEquationCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    drawEquation();
}


/* =====================================================
   SCREEN → MATH
===================================================== */

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


/* =====================================================
   MATH → SCREEN
===================================================== */

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
   NUMBER FORMAT
===================================================== */

function formatNumber(number) {

    if (!Number.isFinite(number)) {
        return "undefined";
    }

    if (Math.abs(number) < 0.000001) {
        return "0";
    }

    return Number(
        number.toFixed(6)
    ).toString();
}


/* =====================================================
   EQUATION PARSER
===================================================== */

function calculateEquation(expression, x) {

    expression = expression
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/y=/g, "")
        .replace(/\^/g, "**")
        .replace(/π/g, "Math.PI")
        .replace(/\bsin\b/g, "Math.sin")
        .replace(/\bcos\b/g, "Math.cos")
        .replace(/\btan\b/g, "Math.tan")
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\blog\b/g, "Math.log10")
        .replace(/\bln\b/g, "Math.log")
        .replace(/\babs\b/g, "Math.abs");

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

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const minX = screenToMathX(0);
    const maxX = screenToMathX(width);

    const minY = screenToMathY(height);
    const maxY = screenToMathY(0);


    let rawStep = 80 / scale;

    const power =
        Math.pow(
            10,
            Math.floor(
                Math.log10(rawStep)
            )
        );

    const normalized =
        rawStep / power;

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

    const step =
        multiplier * power;


    /* Vertical grid */

    let startX =
        Math.floor(minX / step) * step;

    for (
        let x = startX;
        x <= maxX;
        x += step
    ) {

        const sx =
            mathToScreenX(x);

        ctx.beginPath();

        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);

        ctx.strokeStyle =
            "#e5e7eb";

        ctx.lineWidth = 1;

        ctx.stroke();


        if (Math.abs(x) > step / 1000) {

            ctx.fillStyle =
                "#555";

            ctx.font =
                "12px Arial";

            ctx.fillText(
                formatNumber(x),
                sx + 3,
                height / 2 + 15
            );
        }
    }


    /* Horizontal grid */

    let startY =
        Math.floor(minY / step) * step;

    for (
        let y = startY;
        y <= maxY;
        y += step
    ) {

        const sy =
            mathToScreenY(y);

        ctx.beginPath();

        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);

        ctx.strokeStyle =
            "#e5e7eb";

        ctx.lineWidth = 1;

        ctx.stroke();


        if (Math.abs(y) > step / 1000) {

            ctx.fillStyle =
                "#555";

            ctx.font =
                "12px Arial";

            ctx.fillText(
                formatNumber(y),
                5,
                sy - 4
            );
        }
    }


    /* X axis */

    const zeroX =
        mathToScreenX(0);

    ctx.beginPath();

    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height);

    ctx.strokeStyle =
        "#222";

    ctx.lineWidth = 2;

    ctx.stroke();


    /* Y axis */

    const zeroY =
        mathToScreenY(0);

    ctx.beginPath();

    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);

    ctx.strokeStyle =
        "#222";

    ctx.lineWidth = 2;

    ctx.stroke();


    /* Axis labels */

    ctx.fillStyle =
        "#222";

    ctx.font =
        "bold 14px Arial";

    if (
        zeroX > 0 &&
        zeroX < width
    ) {

        ctx.fillText(
            "y",
            zeroX + 7,
            18
        );
    }


    if (
        zeroY > 0 &&
        zeroY < height
    ) {

        ctx.fillText(
            "x",
            width - 18,
            zeroY - 7
        );
    }
}


/* =====================================================
   DRAW EQUATION
===================================================== */

function drawEquation() {

    if (!canvas) return;

    drawGrid();


    const equation =
        document.getElementById(
            "equation"
        ).value;


    const a =
        Number(
            document.getElementById(
                "parameterA"
            ).value
        );


    const b =
        Number(
            document.getElementById(
                "parameterB"
            ).value
        );


    let finalEquation =
        equation
            .replace(/\ba\b/g, "(" + a + ")")
            .replace(/\bb\b/g, "(" + b + ")");


    const width =
        canvas.clientWidth;


    const minX =
        screenToMathX(0);

    const maxX =
        screenToMathX(width);


    ctx.beginPath();

    let first = true;

    const points =
        Math.max(
            width * 2,
            800
        );


    const increment =
        (maxX - minX) / points;


    for (
        let x = minX;
        x <= maxX;
        x += increment
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

            ctx.moveTo(
                sx,
                sy
            );

            first = false;

        } else {

            ctx.lineTo(
                sx,
                sy
            );
        }
    }


    ctx.strokeStyle =
        "#1769ff";

    ctx.lineWidth =
        3;

    ctx.stroke();


    document.getElementById(
        "currentEquation"
    ).textContent =
        "y = " + finalEquation;
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
   GRAPH BUTTON
===================================================== */

function createEquationGraph() {

    drawEquation();
}


/* =====================================================
   ZOOM
===================================================== */

function zoomIn() {

    scale *= 1.3;

    scale =
        Math.min(
            scale,
            1000
        );

    drawEquation();
}


function zoomOut() {

    scale /= 1.3;

    scale =
        Math.max(
            scale,
            5
        );

    drawEquation();
}


/* =====================================================
   RESET
===================================================== */

function resetGraph() {

    scale = 45;

    offsetX = 0;
    offsetY = 0;

    document.getElementById(
        "coordinates"
    ).textContent =
        "Move your finger or mouse over the graph";

    drawEquation();
}


/* =====================================================
   POINTER PAN
===================================================== */

canvas.addEventListener(
    "pointerdown",
    function(event) {

        dragging = true;

        activePointerId =
            event.pointerId;

        canvas.setPointerCapture(
            event.pointerId
        );

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;
    }
);


canvas.addEventListener(
    "pointermove",
    function(event) {

        const rect =
            canvas.getBoundingClientRect();


        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;


        const mathX =
            screenToMathX(x);

        const mathY =
            screenToMathY(y);


        document.getElementById(
            "coordinates"
        ).textContent =
            "x = " +
            formatNumber(mathX) +
            " , y = " +
            formatNumber(mathY);


        if (
            !dragging ||
            event.pointerId !== activePointerId
        ) {
            return;
        }


        offsetX +=
            event.clientX - lastMouseX;

        offsetY +=
            event.clientY - lastMouseY;


        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;


        drawEquation();
    }
);


canvas.addEventListener(
    "pointerup",
    function(event) {

        dragging = false;

        activePointerId = null;

        try {

            canvas.releasePointerCapture(
                event.pointerId
            );

        } catch {}
    }
);


canvas.addEventListener(
    "pointercancel",
    function() {

        dragging = false;

        activePointerId = null;
    }
);


/* =====================================================
   MOUSE WHEEL ZOOM
===================================================== */

canvas.addEventListener(
    "wheel",
    function(event) {

        event.preventDefault();


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;


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
    {
        passive: false
    }
);


/* =====================================================
   DOWNLOAD EQUATION GRAPH
===================================================== */

function downloadEquationGraph() {

    const link =
        document.createElement("a");

    link.download =
        "MOGIBARA-equation-graph.png";

    link.href =
        canvas.toDataURL(
            "image/png"
        );

    link.click();
}


/* =====================================================
   STATISTICS CANVAS
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

    const dpr =
        window.devicePixelRatio || 1;


    statisticsCanvas.width =
        rect.width * dpr;

    statisticsCanvas.height =
        rect.height * dpr;


    statisticsCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


/* =====================================================
   CREATE STATISTICS GRAPH
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
            .map(
                line => line.trim()
            )
            .filter(Boolean);


    const labels = [];
    const values = [];


    lines.forEach(
        line => {

            const parts =
                line.split(",");


            if (
                parts.length < 2
            ) {
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
        }
    );


    updateStatistics(values);


    drawStatistics(
        labels,
        values
    );
}


/* =====================================================
   STATISTICS CALCULATIONS
===================================================== */

function updateStatistics(values) {

    if (
        values.length === 0
    ) {

        document.getElementById(
            "meanValue"
        ).textContent = "-";

        document.getElementById(
            "medianValue"
        ).textContent = "-";

        document.getElementById(
            "modeValue"
        ).textContent = "-";

        document.getElementById(
            "minValue"
        ).textContent = "-";

        document.getElementById(
            "maxValue"
        ).textContent = "-";

        document.getElementById(
            "rangeValue"
        ).textContent = "-";

        return;
    }


    const sorted =
        [...values].sort(
            (a, b) => a - b
        );


    const sum =
        values.reduce(
            (a, b) => a + b,
            0
        );


    const mean =
        sum / values.length;


    let median;


    if (
        sorted.length % 2 === 0
    ) {

        const middle =
            sorted.length / 2;

        median =
            (
                sorted[middle - 1] +
                sorted[middle]
            ) / 2;

    } else {

        median =
            sorted[
                Math.floor(
                    sorted.length / 2
                )
            ];
    }


    const frequency = {};

    values.forEach(
        value => {

            frequency[value] =
                (frequency[value] || 0) + 1;
        }
    );


    const highestFrequency =
        Math.max(
            ...Object.values(
                frequency
            )
        );


    let modes =
        Object.keys(frequency)
            .filter(
                value =>
                    frequency[value] ===
                    highestFrequency
            );


    let modeText;


    if (
        highestFrequency === 1
    ) {

        modeText = "No mode";

    } else {

        modeText =
            modes
                .map(Number)
                .join(", ");
    }


    const min =
        Math.min(...values);

    const max =
        Math.max(...values);

    const range =
        max - min;


    document.getElementById(
        "meanValue"
    ).textContent =
        formatNumber(mean);


    document.getElementById(
        "medianValue"
    ).textContent =
        formatNumber(median);


    document.getElementById(
        "modeValue"
    ).textContent =
        modeText;


    document.getElementById(
        "minValue"
    ).textContent =
        formatNumber(min);


    document.getElementById(
        "maxValue"
    ).textContent =
        formatNumber(max);


    document.getElementById(
        "rangeValue"
    ).textContent =
        formatNumber(range);
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


    if (
        values.length === 0
    ) {

        statisticsCtx.fillStyle =
            "#17202a";

        statisticsCtx.font =
            "18px Arial";

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


    if (
        type === "pie"
    ) {

        drawPieChart(
            labels,
            values,
            title
        );

        return;
    }


    if (
        type === "histogram"
    ) {

        drawHistogram(
            values,
            title
        );

        return;
    }


    const max =
        Math.max(
            ...values,
            1
        );


    const min =
        Math.min(
            ...values,
            0
        );


    const padding = 60;


    const graphWidth =
        width -
        padding * 2;


    const graphHeight =
        height -
        padding * 2;


    /* Title */

    statisticsCtx.fillStyle =
        "#17202a";

    statisticsCtx.font =
        "bold 20px Arial";

    statisticsCtx.fillText(
        title,
        padding,
        30
    );


    /* Axes */

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

    statisticsCtx.strokeStyle =
        "#17202a";

    statisticsCtx.lineWidth =
        1;

    statisticsCtx.stroke();


    /* BAR */

    if (
        type === "bar"
    ) {

        const barSpace =
            graphWidth /
            values.length;


        const barWidth =
            barSpace * 0.6;


        values.forEach(
            (value, i) => {

                const x =
                    padding +
                    i * barSpace +
                    barSpace * 0.2;


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
                    height -
                    padding +
                    20
                );


                statisticsCtx.fillStyle =
                    "#17202a";

                statisticsCtx.font =
                    "12px Arial";

                statisticsCtx.fillText(
                    formatNumber(value),
                    x,
                    y - 8
                );
            }
        );


        return;
    }


    /* LINE / POINT */

    const points = [];


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


            points.push({
                x,
                y
            });


            drawLabel(
                labels[i],
                x - 10,
                height -
                padding +
                20
            );
        }
    );


    if (
        type === "line"
    ) {

        statisticsCtx.beginPath();

        points.forEach(
            (point, i) => {

                if (i === 0) {

                    statisticsCtx.moveTo(
                        point.x,
                        point.y
                    );

                } else {

                    statisticsCtx.lineTo(
                        point.x,
                        point.y
                    );
                }
            }
        );


        statisticsCtx.strokeStyle =
            "#1769ff";

        statisticsCtx.lineWidth =
            3;

        statisticsCtx.stroke();
    }


    points.forEach(
        point => {

            statisticsCtx.beginPath();

            statisticsCtx.arc(
                point.x,
                point.y,
                5,
                0,
                Math.PI * 2
            );

            statisticsCtx.fillStyle =
                "#1769ff";

            statisticsCtx.fill();
        }
    );
}


/* =====================================================
   PIE CHART
===================================================== */

function drawPieChart(
    labels,
    values,
    title
) {

    const width =
        statisticsCanvas.clientWidth;

    const height =
        statisticsCanvas.clientHeight;


    statisticsCtx.fillStyle =
        "#17202a";

    statisticsCtx.font =
        "bold 20px Arial";

    statisticsCtx.fillText(
        title,
        30,
        30
    );


    const total =
        values.reduce(
            (a, b) => a + Math.abs(b),
            0
        );


    if (total === 0) {

        statisticsCtx.fillText(
            "Pie chart requires non-zero values.",
            30,
            65
        );

        return;
    }


    const centerX =
        width * 0.42;

    const centerY =
        height * 0.55;


    const radius =
        Math.min(
            width,
            height
        ) * 0.28;


    let startAngle =
        -Math.PI / 2;


    values.forEach(
        (value, i) => {

            const angle =
                (
                    Math.abs(value) /
                    total
                ) *
                Math.PI * 2;


            statisticsCtx.beginPath();

            statisticsCtx.moveTo(
                centerX,
                centerY
            );


            statisticsCtx.arc(
                centerX,
                centerY,
                radius,
                startAngle,
                startAngle + angle
            );


            statisticsCtx.closePath();


            statisticsCtx.fillStyle =
                getChartColor(i);

            statisticsCtx.fill();


            startAngle += angle;
        }
    );


    /* Legend */

    labels.forEach(
        (label, i) => {

            const y =
                70 + i * 25;


            statisticsCtx.fillStyle =
                getChartColor(i);


            statisticsCtx.fillRect(
                width - 180,
                y - 12,
                14,
                14
            );


            statisticsCtx.fillStyle =
                "#17202a";

            statisticsCtx.font =
                "13px Arial";

            statisticsCtx.fillText(
                label +
                " (" +
                formatNumber(values[i]) +
                ")",
                width - 160,
                y
            );
        }
    );
}


/* =====================================================
   HISTOGRAM
===================================================== */

function drawHistogram(
    values,
    title
) {

    const width =
        statisticsCanvas.clientWidth;

    const height =
        statisticsCanvas.clientHeight;


    const padding = 60;


    statisticsCtx.fillStyle =
        "#17202a";

    statisticsCtx.font =
        "bold 20px Arial";

    statisticsCtx.fillText(
        title,
        padding,
        30
    );


    const min =
        Math.min(...values);

    const max =
        Math.max(...values);


    const binCount =
        Math.min(
            10,
            Math.max(
                1,
                Math.ceil(
                    Math.sqrt(
                        values.length
                    )
                )
            )
        );


    const range =
        max - min;


    const binSize =
        range === 0
            ? 1
            : range / binCount;


    const bins =
        new Array(binCount)
            .fill(0);


    values.forEach(
        value => {

            let index =
                Math.floor(
                    (value - min) /
                    binSize
                );


            if (
                index >= binCount
            ) {

                index =
                    binCount - 1;
            }


            bins[index]++;
        }
    );


    const graphWidth =
        width -
        padding * 2;


    const graphHeight =
        height -
        padding * 2;


    const maxCount =
        Math.max(
            ...bins,
            1
        );


    const barWidth =
        graphWidth /
        binCount;


    bins.forEach(
        (count, i) => {

            const barHeight =
                (
                    count /
                    maxCount
                ) *
                graphHeight;


            const x =
                padding +
                i * barWidth;


            const y =
                height -
                padding -
                barHeight;


            statisticsCtx.fillStyle =
                "#1769ff";


            statisticsCtx.fillRect(
                x + 2,
                y,
                barWidth - 4,
                barHeight
            );


            const start =
                min +
                i * binSize;


            statisticsCtx.fillStyle =
                "#17202a";

            statisticsCtx.font =
                "11px Arial";

            statisticsCtx.fillText(
                formatNumber(start),
                x,
                height -
                padding +
                18
            );


            statisticsCtx.fillText(
                count,
                x + 5,
                y - 5
            );
        }
    );


    statisticsCtx.beginPath();

    statisticsCtx.moveTo(
        padding,
        height - padding
    );

    statisticsCtx.lineTo(
        width - padding,
        height - padding
    );

    statisticsCtx.stroke();
}


/* =====================================================
   CHART COLORS
===================================================== */

function getChartColor(index) {

    const colors = [
        "#1769ff",
        "#e74c3c",
        "#2ecc71",
        "#f39c12",
        "#9b59b6",
        "#1abc9c",
        "#34495e",
        "#e67e22",
        "#16a085",
        "#8e44ad"
    ];

    return colors[
        index % colors.length
    ];
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
   LINEAR EQUATION PARSER
===================================================== */

function parseLinearSide(expression) {

    expression =
        expression
            .replace(/\s+/g, "")
            .replace(/−/g, "-");


    if (!expression) {

        return {
            a: 0,
            b: 0
        };
    }


    expression =
        expression.replace(
            /-/g,
            "+-"
        );


    if (
        expression.startsWith("+")
    ) {

        expression =
            expression.substring(1);
    }


    const terms =
        expression
            .split("+")
            .filter(Boolean);


    let a = 0;
    let b = 0;


    for (
        const term of terms
    ) {

        if (
            term.includes("x")
        ) {

            let coefficient =
                term.replace(
                    "x",
                    ""
                );


            if (
                coefficient === "" ||
                coefficient === "+"
            ) {

                coefficient = 1;

            } else if (
                coefficient === "-"
            ) {

                coefficient = -1;

            } else {

                coefficient =
                    Number(coefficient);
            }


            if (
                !Number.isFinite(
                    coefficient
                )
            ) {

                return null;
            }


            a += coefficient;

        } else {

            const number =
                Number(term);


            if (
                !Number.isFinite(number)
            ) {

                return null;
            }


            b += number;
        }
    }


    return {
        a,
        b
    };
}


/* =====================================================
   PARSE COMPLETE LINEAR EQUATION
===================================================== */

function parseLinearEquation(input) {

    const parts =
        input.split("=");


    if (
        parts.length !== 2
    ) {

        return null;
    }


    const left =
        parseLinearSide(
            parts[0]
        );


    const right =
        parseLinearSide(
            parts[1]
        );


    if (
        !left ||
        !right
    ) {

        return null;
    }


    return {
        a: left.a - right.a,
        b: right.b - left.b
    };
}


/* =====================================================
   SOLVE EQUATION
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


    const equation =
        parseLinearEquation(input);


    if (!equation) {

        result.innerHTML =
            "Currently supported: simple linear equations such as <b>2*x+4=10</b>.";

        return;
    }


    const a =
        equation.a;

    const b =
        equation.b;


    if (
        a === 0 &&
        b === 0
    ) {

        result.innerHTML =
            "<strong>Every value of x is a solution.</strong>";

        return;
    }


    if (
        a === 0
    ) {

        result.innerHTML =
            "<strong>No solution.</strong>";

        return;
    }


    const x =
        b / a;


    result.innerHTML =
        "<strong>Solution:</strong> x = " +
        formatNumber(x);
}


/* =====================================================
   BALANCE EQUATION
===================================================== */

function balanceEquation() {

    const input =
        document.getElementById(
            "balanceEquation"
        ).value.trim();


    const result =
        document.getElementById(
            "balanceResult"
        );


    const parts =
        input.split("=");


    if (
        parts.length !== 2
    ) {

        result.innerHTML =
            "Please enter an equation containing =";

        return;
    }


    const leftText =
        parts[0].trim();

    const rightText =
        parts[1].trim();


    const left =
        parseLinearSide(
            leftText
        );

    const right =
        parseLinearSide(
            rightText
        );


    if (
        !left ||
        !right
    ) {

        result.innerHTML =
            "Use a simple linear equation such as <b>2*x+4=10</b>.";

        return;
    }


    const a =
        left.a - right.a;


    const constant =
        right.b - left.b;


    if (
        a === 0
    ) {

        result.innerHTML =
            "This equation cannot be balanced as a single x solution.";

        return;
    }


    const x =
        constant / a;


    let html = "";


    html +=
        '<div class="step"><b>Start:</b><br>' +
        escapeHTML(leftText) +
        " = " +
        escapeHTML(rightText) +
        "</div>";


    if (
        left.b !== 0
    ) {

        html +=
            '<div class="step">' +
            "Move the constant term to the other side." +
            "</div>";
    }


    html +=
        '<div class="step">' +
        "Collect the x terms." +
        "</div>";


    html +=
        '<div class="step">' +
        "x = " +
        formatNumber(x) +
        "</div>";


    html +=
        '<div class="answer">' +
        "✓ Answer: x = " +
        formatNumber(x) +
        "</div>";


    result.innerHTML =
        html;
}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    function() {

        resizeEquationCanvas();

        resizeStatisticsCanvas();

        createStatisticsGraph();
    }
);


/* =====================================================
   START
===================================================== */

resizeEquationCanvas();

createStatisticsGraph();

drawEquation();
