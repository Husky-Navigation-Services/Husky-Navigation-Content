const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
const showPopupsCheck = document.getElementById("btncheck1");
const btncheck2 = document.getElementById("btncheck2");
const btncheck3 = document.getElementById("btncheck3");

const addNodesRadio = document.getElementById("btnradio1");
const modifyNodesRadio = document.getElementById("btnradio2");
const lassoConnectRadio = document.getElementById("btnradio3");
const deleteNodesRadio = document.getElementById("btnradio4");
const moveRadio = document.getElementById("btnradio6");

const viewRadio = document.getElementById("btnradio11");

const page = document.getElementById("page");
const deleteForm = document.getElementById("delete-container");
var nodesTxt; // unparsed node text
var nodes = new Map(); // parsed list of node objects for internal representation
var ogNodes = []; // makes sure undo doesn't go past this
var prevNodes = [
    []
]; // stores previous nodes to allow for change reversion
var nodeMarkers = []; // stores all node markers
var tableContentRows = [];
var edgeLayer; // Leaflet geoJSON layer
var edgeLayerGroup = L.layerGroup([]);
var inModifyMode = false;
var keys = []; //keys track of keys pressed for commands

// init save toast
var saveToastEl = document.getElementById('save-toast'); //select id of toast
var saveToast = new bootstrap.Toast(saveToastEl); //inizialize it
setInterval(function() {
    saveToast.show();
}, 600000);




// init map 
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
overlay = L.tileLayer(z, A);


// MAIN

// fetch latest data, parse data, draw map markers
fetch('Nodes.txt')
    .then(response => response.text())
    .then(txt => {
        startup(txt);
    });

// parse given data, draw map markers
function startup(txt) {
    nodesTxt = txt;
    parseNodes();
    drawMarkers();
    constructEdgesGeoJSON();
}

// if continuing with latest data: show controls, draw preview, draw table, begin command loop
// otherwise: show controls, parse nodes, draw table, draw map markers, construct edges, begin command loop
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

function dragOverHandler(ev) {
    ev.preventDefault();
    document.getElementById("dropbox-icon-2").style.animation = "none";
    console.log("dragging over");
}

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    var file = ev.dataTransfer.files[0];

    //if (file && file.kind === 'file') {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(event) {
        console.log(event);
        console.log(event.target.result);
        init(event.target.result, false);
    };
    console.log(file);

    //}

}

// Update preview of Nodes.txt with given text
function drawPreview() {
    previewTextEl.innerHTML = nodesTxt.replaceAll("\n", " <br /> ");
}

// Given a string of nodes in the standard format:
//      [latitude] [longitude] [id] [neighbor1lat] [neighbor1long] [neighbor1id] [neighbor2lat] [neighbor2long] [neighbor2id]
//      , [latitude] [longitude] [id] [neighbor3lat] [neighbor3long] [neighbor3id] [neighbor4lat] [neighbor4long] [neighbor4id]
// this sets "nodes" variable to contain a list of node objects.
// Each node object contains properties:
//    {
//        id [string]
//        latitude [string]
//        longitude [string]
//        neighbors [array of neighbor node names]
//    }
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
        console.log(neighs);
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

function handleNameChange(e) {
    const node = nodes.find(n => n.id == e.target.id);
    console.log(node.name)
    const originalName = node.name;
    const newName = e.target.value;

    // update neighbor names to new name
    nodes.forEach(n => {
        n.neighbors = n.neighbors.map(neigh => {
            if (neigh == originalName) {
                console.log(originalName);
                return newName;
            } else {
                return neigh;
            }
        });
    });
    // update node name to new name
    node.name = newName;
    drawMarkers();
}

// Draw markers as LeafletJS circles
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

function handlePopupCheck(box) {
    if (box.checked) {
        togglePopups("on");
    } else {
        togglePopups("off");
    }
}

function togglePopups(cmd) {
    if (cmd == "on") {
        nodeMarkers.forEach(marker => {
            marker.openPopup();
        })
    } else {
        nodeMarkers.forEach(marker => {
            marker.closePopup();
        })
    }
}
var edgeModeOn = false;

function handleEdgesCheck(box) {
    edgeLayerGroup.eachLayer(function(layer) {
        map.removeLayer(layer);
    })
    if (box.checked) {
        edgeLayer.addTo(map);
        edgeModeOn = true;
    } else {
        edgeModeOn = false;
    }
    edgeLayer.bringToBack();
}


function constructEdgesGeoJSON() {
    var data = {
        "type": "FeatureCollection",
        "features": []
    };
    for (const [id, props] of nodes) {
        props.neighbors.forEach(neigh => {
            console.log(neigh);
            const nodeCoord = [parseFloat(props.longitude), parseFloat(props.latitude)];
            const neighNode = nodes.get(neigh);
            console.log(neighNode);
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


function handleNeighborChange(e) {
    // INPUT VALIDATION
    var isBadInput = false;
    var newNeighbors = e.target.value.split(",");
    newNeighbors = newNeighbors.map(el => { return el.replaceAll(" ", ""); }); // remove all spaces
    // Check for empty element
    if (newNeighbors.includes("")) {
        isBadInput = true;
    }
    // Check for nonexistent node name
    newNeighbors.forEach(neighbor => {
        if (!nodes.some(node => node.name == neighbor)) {
            isBadInput = true;
        }
    });
    // Handle bad input
    if (isBadInput) {
        e.target.style.backgroundColor = "red";
        alert("Invalid input. Try again.");
        return;
    }
    // Handle good input
    e.target.style.backgroundColor = "white";


    var thisNode = nodes.find(n => n.id == e.target.id);

    // Update affected neighbor's neighbor list
    thisNode.neighbors.forEach(old => {

        if (!newNeighbors.includes(old)) {

            var other = nodes.find(n => n.name == old).neighbors;
            const index = other.indexOf(thisNode.name);
            if (index > -1) {
                other.splice(index, 1);
            }
        }
    })

    // Update changed node with new neighbors
    thisNode.neighbors = e.target.value.split(",").map(el => el.replaceAll(" ", ""));



    // Update edges
    constructEdgesGeoJSON();

    // Update table
    drawTable();


    handleEdgesCheck(btncheck2);
}





// Ensures that every neighboring pair of neighbors lists each other as a neighbor
// Given list of new neighbors to check
// e.g, if N2 has neighbor N5, then the function enforces that N5 has neighbor N2
function enforceBidirectionality(displayMessage) {
    var msg = "";
    nodes.forEach(node => {
        node.neighbors.forEach(neigh => {
            var neighborNode = nodes.find(n => { return n.name == neigh; });
            if (neighborNode != null && !neighborNode.neighbors.includes(node.name)) {
                msg += (neighborNode.name + " is missing neighbor " + node.name + ". Updating... \n");
                neighborNode.neighbors.push(node.name);
            }
        });
    });
    if (displayMessage) {
        if (msg == "") {
            alert("Nothing to fix!")
        } else {
            alert(msg);
        }
    }

    drawTable();
}

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
    drawPreview();

}

function save() {
    updatePreview();
    download("Nodes", nodesTxt.replaceAll("<br />", "\r\n"));
    //noticeToast.show();
}

// Add hashCode method to String constructor's prototype
String.prototype.hashCode = function() {
    var hash = 0,
        i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32 bit integer
    }
    return hash;
};

function send() {
    enforceBidirectionality();
    updatePreview();
    const date = new Date();
    const updateID = Math.abs(Math.random().toString().hashCode());
    console.log(updateID);
    Email.send({
        SecureToken: "39cb680d-bccd-4638-bba9-e5ef37744657",
        To: 'huskynavigationfeedback@gmail.com',
        From: "huskynavigationfeedback@gmail.com",
        Subject: "Content Update " + updateID + " [" + date.toString() + "]",
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



let addedMarkers = [];
let nodesToAdd = new Map();
let lastAddedId;

function nodeEvent(e) {
    const pos = e.latlng;
    const numNodes = nodes.size;
    let newId = lastAddedId ? lastAddedId + 1 : numNodes + 1;

    // ensure newId is unique
    while (nodes.has(newId)) {
        newId++;
    }
    lastAddedId = newId;

    // add new node
    nodesToAdd.set(newId, {
        name: 'N' + newId,
        latitude: pos.lat,
        longitude: pos.lng,
        neighbors: new Set()
    });

    // add new markers
    addedMarkers.push(L.circle(pos, {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 1,
        radius: 3
    }).addTo(map));
}

// Enter "Add" mode
function enterAddNodeMode() {
    map.on('click', nodeEvent);
}

// Exits "Add" mode. Updates nodes and redraws.
function exitAddNodeMode() {
    map.off('click', nodeEvent);
    prevNodes.push(nodes);

    // add neighbors to nodesToAdd
    let prevId;
    for (const [id, props] of nodesToAdd) {
        if (prevId) {
            props.neighbors.add(prevId);
            nodesToAdd.get(prevId).neighbors.add(id);
        }
        prevId = id;
    }

    // concat existing nodes with nodesToAdd
    for (const [id, props] of nodesToAdd) {
        nodes.set(id, props);
    }

    // remove temporary added circles
    addedMarkers.forEach(marker => {
        map.removeLayer(marker);
    });

    // redraw
    drawTable();
    drawMarkers();
    constructEdgesGeoJSON();
    redrawEdges();
    handleEdgesCheck(btncheck2);

    // cleanup
    nodesToAdd = new Map();
    lastAddedId = undefined;
    offset = 0;
}

function handleEditorOptionChange() {
    if (addNodesRadio.checked) {
        exitConnectNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        exitMoveMode();
        enterAddNodeMode();
    } else if (modifyNodesRadio.checked) {
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        exitMoveMode();
        enterConnectNodeMode();
    } else if (deleteNodesRadio.checked) {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitLassoMode();
        exitMoveMode();
        enterDeleteNodeMode()
    } else if (lassoConnectRadio.checked) {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitMoveMode();
        enterLassoMode();
    } else if (moveRadio.checked) {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        enterMoveMode();
    } else {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        exitMoveMode();
    }
}

const lasso = L.lasso(map, {});

map.on('lasso.finished', event => {
    handleFinishedLasso(event.layers);
});


function enterLassoMode() {
    lasso.enable();
}


function handleFinishedLasso(layers) {
    const selectedNodes = [];
    layers.forEach(l => {
        // add if layer is a node marker
        l.nodeId ? selectedNodes.push(l.nodeId) : null;
    });
    selectedNodes.forEach(curNode => {
        const otherNodes = selectedNodes.filter(n => n != curNode);
        otherNodes.forEach(otherNode => {
            nodes.get(curNode).neighbors.add(otherNode);
        });
    });

    drawTable();
    drawPreview();
    redrawEdges();
    lassoConnectRadio.checked = false;
}

function exitLassoMode() {

}

function enterDeleteNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', deleteNodeEvent);
    });
}

function exitDeleteNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', deleteNodeEvent);
    });
}

function deleteNodeEvent(e) {
    const n = e.target;
    const id = n.nodeId;
    const neighs = nodes.get(id).neighbors;
    map.removeLayer(n);

    // clear connections
    neighs.forEach(n => {
        nodes.get(n).neighbors.delete(id);
    });

    nodes.delete(id);
    drawTable();
    constructEdgesGeoJSON();
    handleEdgesCheck(btncheck2);
}


function redrawEdges() {
    if (edgeModeOn) {
        map.removeLayer(edgeLayer);
        constructEdgesGeoJSON();
        edgeLayer.addTo(map);
        edgeLayer.bringToBack();
    }
}

function enterConnectNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', connectNodeEvent);
    });
}

function exitConnectNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', connectNodeEvent);
    });
}

var firstId;

function connectNodeEvent(e) {
    const clickedId = e.target.nodeId;
    if (!firstId) {
        firstId = clickedId;
    } else {
        nodes.get(firstId).neighbors.add(clickedId);
        nodes.get(clickedId).neighbors.add(firstId);
        firstId = undefined;
        drawTable();
        constructEdgesGeoJSON();
        redrawEdges();
    }
}

function handleEditorTableOptionChange() {
    handleEditorOptionChange();
    if (viewRadio.checked) {
        inModifyMode = false;
    } else {
        inModifyMode = true;
    }
    drawTable();
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function filterTable(e) {
    console.log(e.value);
    const q = e.value;
    const tableRows = document.querySelectorAll("tr");
    tableRows.forEach(row => {
        const curNode = row.children[0].innerHTML;
        if (curNode.toLowerCase().startsWith(q.toLowerCase())) {
            row.style.display = "table-row";
        } else if (curNode != "Id") {
            row.style.display = "none";
        }
    });
}

//sets a keyCode index as true if a key is currently pressed
//e.g. if ctrl is pressed keys[17] will be true.
function handleCommands() {

    document.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    }, false);

    document.addEventListener('keyup', function(e) {
        keys[e.keyCode] = false;
    }, false);
}

//checks keys pressed every 10ms for commands
//add new commands here
function commandLoop() {

    switch (true) {
        //ctrl + z
        case keys[17] && keys[90]:
            handleUndo();
            break;
            //ctrl + y
        case keys[17] && keys[89]:
            handleRedo();
            break;
    }


    setTimeout(commandLoop, 10);
}

var undoneNodes = [
    []
];

function handleUndo() {

    var update = prevNodes.pop();

    if (update && update.length > 0 && !isSameArrayByElems(update, nodes)) {

        undoneNodes.push(nodes);

        nodes = update;

        drawNodeElements();
    }


}

function handleRedo() {

    var update = undoneNodes.pop();

    if (update && update.length > 0 && !isSameArrayByElems(update, nodes)) {

        prevNodes.push(nodes);

        nodes = update;

        drawNodeElements();
    }

}

function isSameArrayByElems(ar1, ar2) {

    if (ar1.length == ar2.length) {

        for (i = 0; i < ar1.length; i++) {

            if (ar1[i] != ar2[i]) {
                return false;
            }

        }

    } else {
        return false;
    }

    return true;
}

function handleOverlayCheck(box) {
    if (box.checked) {
        overlay.addTo(map);
    } else {
        overlay.remove();
    }
}

/* Node Modification Functions */

var movingNode;

// 1
function enterMoveMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', moveNode)
    });
}

// 2
function moveNode(mdown) {
    movingNode = mdown.target;
    map.on('mousemove', moveNodeToNewCoords);
    movingNode.on('click', finishNodeMove);
}

// 3
function moveNodeToNewCoords(mmove) {
    movingNode.setLatLng(mmove.latlng);
}

// 4
function finishNodeMove() {
    console.log("hello");
    map.off('mousemove', moveNodeToNewCoords);
    console.log(movingNode);
    const movingNodeObj = nodes.find(n => n.name == movingNode.nodeName);
    movingNodeObj.latitude = movingNode._latlng.lat;
    movingNodeObj.longitude = movingNode._latlng.lng;
    drawTable();
    redrawEdges();
    movingNode = null;
}

// 5
function exitMoveMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', moveNode)
    });
}