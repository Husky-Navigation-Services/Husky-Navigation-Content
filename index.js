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


var ogNodes = []; // makes sure undo doesn't go past this
var prevNodes = [
    []
]; // stores previous nodes to allow for change reversion


var edgeLayer; // Leaflet geoJSON layer
var edgeLayerGroup = L.layerGroup([]);

var keys = []; //keys track of keys pressed for commands

// init
initSaveToast();
initMap();
initOverlay();
parseLatestAndDrawMap();


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


function handleNameChange(e) {
    const id = e.target.id;
    const props = nodes.get(id);
    const oldName = props.name;
    const newName = e.target.value;
    props.name = newName;
    props.neighbors.forEach(neigh => {
        const neighProps = nodes.get(neigh);
        neighProps.remove(oldName);
        neighProps.add(newName);
    });
    drawMarkers();
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

function nodeEvent(e) {
    const pos = e.latlng;
    const numNodes = nodes.size;
    let newId = numNodes + 1;

    // ensure newId is unique
    while (nodes.has(newId) || nodesToAdd.has(newId)) {
        newId++;
    }

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
    let exitFns = [exitAddNodeMode, exitConnectNodeMode, exitLassoMode, exitDeleteNodeMode, exitMoveMode];
    let notExitFn;
    let enterFn = () => {};
    if (addNodesRadio.checked) {
        [notExitFn, enterFn] = [exitAddNodeMode, enterAddNodeMode];
    } else if (modifyNodesRadio.checked) {
        [notExitFn, enterFn] = [exitConnectNodeMode, enterConnectNodeMode];
    } else if (deleteNodesRadio.checked) {
        [notExitFn, enterFn] = [exitDeleteNodeMode, enterDeleteNodeMode];
    } else if (lassoConnectRadio.checked) {
        [notExitFn, enterFn] = [exitLassoMode, enterLassoMode];
    } else if (moveRadio.checked) {
        [notExitFn, enterFn] = [exitMoveMode, enterMoveMode];
    }
    exitFns = exitFns.filter(fn => fn != notExitFn);
    exitFns.forEach(fn => fn());
    enterFn();
}

const lasso = L.lasso(map, {});

map.on('lasso.finished', event => {
    handleFinishedLasso(event.layers);
});


function enterLassoMode() {
    lasso.enable();
}

function exitLassoMode() {

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

/* Node Moving Functions */

let movingNode;

// 1
function enterMoveMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', moveNode)
    });
}

// 2
function moveNode(click) {
    movingNode = click.target;
    map.on('mousemove', moveNodeToNewCoords);
    movingNode.on('click', finishNodeMove);
}

// 3
function moveNodeToNewCoords(move) {
    movingNode.setLatLng(move.latlng);
}

// 4
function finishNodeMove() {
    map.off('mousemove', moveNodeToNewCoords);
    const movingNodeProps = nodes.get(movingNode.nodeId);
    movingNodeProps.latitude = movingNode.getLatLng().lat;
    movingNodeProps.longitude = movingNode.getLatLng().lng;
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