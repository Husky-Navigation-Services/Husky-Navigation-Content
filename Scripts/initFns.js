// Init save toast
function initSaveToast() {
    var saveToastEl = document.getElementById('save-toast'); //select id of toast
    var saveToast = new bootstrap.Toast(saveToastEl); //inizialize it
    setInterval(function() {
        saveToast.show();
    }, 600000);
}

// Initialize map
function initMap() {
    this.map = L.map('map', {
        //sets click tolerance for elements on map
        //sets padding to remove element clipping
        renderer: L.canvas({
            tolerance: 10,
            padding: 2
        }),
        fullscreenControl: true

    }).setView([47.6532, -122.3074], 16);
    L.tileLayer('https://api.mapbox.com/styles/v1/aferman/ckhvetwgy0bds19nznkfvodbx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWZlcm1hbiIsImEiOiJja2ZrZXJvbjUwZW5wMnhxcjdyMXc3ZjRnIn0.WGdId2uO9XokPaJmaxlLXg', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: ['a', 'b', 'c']
    }).addTo(map);
}

// Initialize map overlay
function initOverlay() {
    var r = [-122.32296105, 47.64674039, -122.28707804, 47.66318327]
    var w = new L.LatLngBounds(new L.LatLng(r[1], r[0]), new L.LatLng(r[3], r[2]))
    var overlay, z, A = {
        minZoom: 10,
        maxZoom: 20,
        bounds: w,
        opacity: 1,
        attribution: 'Rendered with <a href="http://www.maptiler.com/">MapTiler</a>',
        tms: !1,
        className: "uw-tilelayer"
    };
    z = "https://www.washington.edu/maps/wp-content/themes/maps-2014/tiles/retina/{z}/{x}/{y}.png"
    this.overlay = L.tileLayer(z, A);
}

// Parse latest data
function parseLatestAndDrawMap() {
    fetch('Nodes.txt')
        .then(response => response.text())
        .then(txt => {
            nodesTxt = txt;
            parseNodes();
            drawMap();
        });
}

// Draw map markers and edges
function drawMap() {
    drawMarkers();
    constructEdgesGeoJSON();
}

// If continuing with latest data:
//  show controls, draw preview, draw table, begin command loop
// Otherwise:
//  show controls, parse nodes, draw table, draw map markers, construct edges, begin command loop
function init(txt, isLatestData) {
    showControls();
    if (isLatestData) {
        drawPreview();
        drawTable();
        handleCommands();
        commandLoop();
    } else {
        nodesTxt = txt;
        drawPreview();
        parseNodes();
        drawTable();
        drawMarkers();
        constructEdgesGeoJSON();
        handleCommands();
        commandLoop();
    }
}

// Show controls and enable pointer events on them
function showControls() {
    const els = [
        document.getElementById("update-prev-btn"),
        document.getElementById("save-btn"),
        document.getElementById("send-btn"),
        document.getElementById("map-options"),
        document.getElementById("editor-options"),
        document.getElementById("editor-table-options"),
        document.getElementById("search-input"),
    ]

    els.forEach(el => {
        el.style.pointerEvents = "all";
        el.style.opacity = 1;
    })

    document.getElementById("preview-fill-text").style.display = "none";
    document.getElementById("dropbox-div-2").style.display = "none";
}