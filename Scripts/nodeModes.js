/*  Node Modes 
    > Add
    > Connect
    > Lasso
    > Delete
    > Move
    > View
*/
let addedMarkers = [];
let nodesToAdd = new Map();
let firstId;
let movingNode;


const addNodesRadio = document.getElementById("btnradio1");
const modifyNodesRadio = document.getElementById("btnradio2");
const lassoConnectRadio = document.getElementById("btnradio3");
const deleteNodesRadio = document.getElementById("btnradio4");
const moveRadio = document.getElementById("btnradio6");
const viewRadio = document.getElementById("btnradio11");

///////////////////
// Add
///////////////////
// Enter Add mode
function enterAddNodeMode() {
    map.on('click', nodeEvent);
}
// Exit Add mode. Update nodes and redraw.
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
    drawMarkers();
    redrawEdges();

    // cleanup
    nodesToAdd = new Map();
    lastAddedId = undefined;
    offset = 0;
}
// Handler for adding new node
function nodeEvent(e) {
    const pos = e.latlng;
    const numNodes = nodes.size;
    const nodeNames = Array.from(nodes.values()).map(el => el.name);
    const nodesToAddNames = Array.from(nodesToAdd.values()).map(el => el.name);
    let newId = numNodes + 1;

    // ensure newId is unique
    while (nodes.has(newId) || nodesToAdd.has(newId) ||
        nodeNames.includes("N" + newId) || nodesToAddNames.includes("N" + newId)) {
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

///////////////////////
// Connect
//////////////////////
// Enter Connect mode
function enterConnectNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', connectNodeEvent);
    });
}
// Exit Connect mode
function exitConnectNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', connectNodeEvent);
    });
}
// Handler for node connection
function connectNodeEvent(e) {
    const clickedId = e.target.nodeId;
    if (!firstId) {
        firstId = clickedId;
    } else {
        nodes.get(firstId).neighbors.add(clickedId);
        nodes.get(clickedId).neighbors.add(firstId);
        firstId = undefined;
        redrawEdges();
    }
}

/////////////////////////
// Lasso
/////////////////////////
// Enter lasso mode
function enterLassoMode() {
    lasso.enable();
}
// Exits lasso mode
function exitLassoMode() {
    lasso.disable();
}

// Handle finished lasso
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
    drawEdges();
    lassoConnectRadio.checked = false;
}

/////////////////////
// Delete
/////////////////////
// Enter delete mode
function enterDeleteNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', deleteNodeEvent);
    });
}
// Exit delete mode
function exitDeleteNodeMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', deleteNodeEvent);
    });
}
// Handle delete node clicks
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
    updateEdges();
    handleEdgesCheck(edgesCheckbox);
}
///////////////////
// Move
///////////////////
// Enter move mode
function enterMoveMode() {
    nodeMarkers.forEach(circle => {
        circle.on('click', moveNode)
    });
}
// Handle click on the node the user wants to move
function moveNode(click) {
    movingNode = click.target;
    map.on('mousemove', moveNodeToNewCoords);
    movingNode.on('click', finishNodeMove);
}
// Handle movement of the node the user wants to move
function moveNodeToNewCoords(move) {
    movingNode.setLatLng(move.latlng);
}
// Handle completion of node movement 
function finishNodeMove() {
    map.off('mousemove', moveNodeToNewCoords);
    const movingNodeProps = nodes.get(movingNode.nodeId);
    movingNodeProps.latitude = movingNode.getLatLng().lat;
    movingNodeProps.longitude = movingNode.getLatLng().lng;
    drawEdges();
    movingNode = null;
}
// Exit move mode
function exitMoveMode() {
    nodeMarkers.forEach(circle => {
        circle.off('click', moveNode)
    });
}