/*  Lifecycle Functions 
    > parseNodes: parse textual node data
    > updateEdges: constructs edge data
    > updatePreview: constructs textual node data from node map
    > drawPreview: draws textual node data in preview
    > drawTable: draws table from node map
    > drawMarkers: draws markers from node map
    > removeEdges: removes stored edges from map
    > drawEdges: draws edges from stored edge data
    > redrawEdges: full cleanup, update, and redraw of edges
    > sendData: sends data to hnav team
    > saveData: exports/downloads data to text file
*/

const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
let edgeLayer;
let edgeLayerGroup = L.layerGroup([]);
let tableContentRows = [];
let inModifyMode = false;
let nodesTxt;
let nodes = new Map();
let nodeMarkers = [];

// Parse textual node data.
function parseNodes() {
    let lines = nodesTxt.replaceAll("\n", ",").split(",");
    let nodeCount = parseInt(lines.shift());
    // construct nodes
    for (let i = 0; i < nodeCount; i++) {
        let els = lines.shift().split(" ");
        let [id, lat, lon, name, neighs] = [els[0], els[1], els[2], els[3].toString(), new Set()];
        nodes.set(id, {
            name: name.replace('\r', ''),
            latitude: lat,
            longitude: lon,
            neighbors: neighs
        });
    }
    // construct node paths
    for (let i = 0; i < nodeCount; i++) {
        let els = lines.shift().split(" ");
        let [node, neighs] = [nodes.get(els.shift()), els];
        neighs.forEach(neigh => {
            node.neighbors.add(neigh.replace('\r', ''));
        });
    }
}

// Constructs geoJSON edges
function updateEdges() {
    var data = {
        "type": "FeatureCollection",
        "features": []
    };
    for (const [id, props] of nodes) {
        props.neighbors.forEach(neigh => {
            const nodeCoord = [parseFloat(props.longitude), parseFloat(props.latitude)];
            const neighNode = nodes.get(neigh);
            const neighCoord = [parseFloat(neighNode.longitude), parseFloat(neighNode.latitude)]
            data.features.push({
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [nodeCoord, neighCoord]
                }
            })
        })
    }
    edgeLayer = L.geoJSON(data);
    edgeLayerGroup.addLayer(edgeLayer);
}

// Constructs textual node data from node map
function updatePreview() {
    var res = "";
    // write # of nodes to first line
    res += nodes.size + "<br />";
    // write each node id/lat/long/name to first half
    for (const [id, props] of nodes) {
        res += id + " " + props.latitude + " " + props.longitude + " " + props.name + "<br />";
    }
    // write each node id/neigh1/neigh2/etc. to second half
    for (const [id, props] of nodes) {
        res += id + " " + Array.from(props.neighbors).toString().replaceAll(',', ' ') + "<br />";
    }
    nodesTxt = res;
}

// Update preview of Nodes.txt with given text
function drawPreview() {
    previewTextEl.innerHTML = nodesTxt.replaceAll("\n", " <br /> ");
}

// Update table view according to "nodes" object
function drawTable() {
    // remove all existing content rows
    tableContentRows.forEach(row => row.remove());
    for (const [id, props] of nodes) {
        const row = nodesTable.insertRow();
        const [c1, c2, c3, c4] = [0, 0, 0, 0].map(el => row.insertCell());
        const [name, lat, lon] = [props.name, props.latitude, props.longitude, props.neighbors.values()];
        const neighsIterator = props.neighbors.values();
        const neighs = [...neighsIterator].map(id => " " + nodes.get(id).name);
        if (inModifyMode) {
            // Add NAME input cell
            const inputNameBox = document.createElement("input");
            inputNameBox.id = id;
            inputNameBox.class = "form-control";
            inputNameBox.value = name.replaceAll(",", ", ");
            inputNameBox.addEventListener("change", handleNameChange);
            c1.appendChild(inputNameBox);
        } else {
            c1.innerHTML = name;
        }

        c2.innerHTML = lat;
        c3.innerHTML = lon;
        c4.innerHTML = neighs;

        tableContentRows.push(row);
    }
}

// Draw markers as circles on map
function drawMarkers() {
    nodeMarkers.forEach(m => {
        map.removeLayer(m);
    });
    for (const [id, props] of nodes) {
        const circle = L.circle([parseFloat(props.latitude), parseFloat(props.longitude)], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            radius: 2
        }).addTo(map);
        var popup = L.popup({
            closeOnClick: true,
            autoClose: false,
            closeButton: true
        }).setContent("<small>" + props.name + "</small>")
        circle.bindPopup(popup);
        circle.nodeId = id; // custom property
        nodeMarkers.push(circle);
    }
}

function removeEdges() {
    edgeLayer.remove();
}

// Draws edges on map if edge mode is on
function drawEdges() {
    map.removeLayer(edgeLayer);
    if (edgeModeOn) {
        edgeLayer.addTo(map);
        edgeLayer.bringToBack();
    }
}

// Full cleanup, update, and redraw of edges
function redrawEdges() {
    removeEdges();
    updateEdges();
    drawEdges();
}

// Send node data
function sendData() {
    enforceBidirectionality();
    updatePreview();
    const timestamp = new Date().getUTCMilliseconds();
    Email.send({
        SecureToken: "39cb680d-bccd-4638-bba9-e5ef37744657",
        To: 'huskynavigationfeedback@gmail.com',
        From: "huskynavigationfeedback@gmail.com",
        Subject: "Content Update " + timestamp + " [" + date.toString() + "]",
        Body: nodesTxt.replaceAll("\n", " <br /> "),
        // "Attached is a updated copy of Nodes.txt:\n" + 
        /*
        Attachments: [{
            name: "Nodes.txt",
            path: "https://hnavcontent.azurewebsites.net/Nodes.txt"
        }]
        */
    }).then(
        alert("Content sent successfully to Husky Navigation Services team! Your content update ID is " + updateID)
    );
}

// Updates node preview and downloads data
function saveData() {
    updatePreview();
    download("Nodes", nodesTxt.replaceAll("<br />", "\r\n"));
}