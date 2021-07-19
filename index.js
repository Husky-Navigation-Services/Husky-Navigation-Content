const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
const showPopupsCheck = document.getElementById("btncheck1");
const btncheck2 = document.getElementById("btncheck2");
const btncheck3 = document.getElementById("btncheck3");

const addNodesRadio = document.getElementById("btnradio1");
const modifyNodesRadio = document.getElementById("btnradio2");
const lassoConnectRadio = document.getElementById("btnradio3");
const deleteNodesRadio = document.getElementById("btnradio4");

const viewRadio = document.getElementById("btnradio11");

const page = document.getElementById("page");
const deleteForm = document.getElementById("delete-container");
var nodesTxt; // unparsed node text
var nodes = []; // parsed list of node objects for internal representation
var ogNodes = []; // makes sure undo doesn't go past this
var prevNodes = [[]]; // stores previous nodes to allow for change reversion
var nodeMarkers = []; // stores all node markers
var tableContentRows = [];
var edgeLayer; // Leaflet geoJSON layer
var edgeLayerGroup = L.layerGroup([]);
var inModifyMode = false;
var keys = []; //keys track of keys pressed for commands

// init save toast
var saveToastEl =document.getElementById('save-toast');//select id of toast
var saveToast = new bootstrap.Toast(saveToastEl);//inizialize it
setInterval(function() {
    saveToast.show();
}, 600000); 

// init first toast
var firstToastEl =document.getElementById('first-toast');
var firstToast = new bootstrap.Toast(firstToastEl);
firstToast.show();

// init contributor notice toast
var noticeToastEl =document.getElementById('contributor-notice-toast');
var noticeToast = new bootstrap.Toast(noticeToastEl);
 noticeToast.show();
 

// init map 
this.map = L.map('map', {
    //sets click tolerance for elements on map
    //sets padding to remove element clipping
    renderer: L.canvas({ tolerance: 10,
                        padding: 2}),
    fullscreenControl: true
    
}).setView([47.6532, -122.3074], 16);
L.tileLayer( 'https://api.mapbox.com/styles/v1/aferman/ckhvetwgy0bds19nznkfvodbx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWZlcm1hbiIsImEiOiJja2ZrZXJvbjUwZW5wMnhxcjdyMXc3ZjRnIn0.WGdId2uO9XokPaJmaxlLXg', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );



var r = [-122.32296105, 47.64674039, -122.28707804, 47.66318327]
var w = new L.LatLngBounds(new L.LatLng(r[1],r[0]),new L.LatLng(r[3],r[2]))
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
// Update preview with Nodes.txt data,
// parse Nodes.txt data to update internal "nodes" variable
// with a list of nodes.
fetch("https://hnavcontent.azurewebsites.net/nodes.txt")
.then(response => response.text())
.then(txt => console.log(txt))

fetch('Nodes.txt')
    .then(response => response.text())
    .then(txt => {
        nodesTxt = txt;
        drawPreview();
        parseNodes();
        drawTable();
        drawMarkers();
        constructEdgesGeoJSON();
        handleCommands();
        commandLoop();
    })

    
// Update preview of Nodes.txt with given text
function drawPreview() {
    previewTextEl.innerHTML = nodesTxt.replaceAll("\r\n", " <br /> ");
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

    //splits code into lines
    var lines = nodesTxt.replaceAll("\r\n", ",").split(",");


    //finds the number of unique nodes
    var nodeCount = parseInt(lines[0]);
    
    


    //creates all nodes without paths to other nodes
    for(i = 1; i <= nodeCount; i++) {
        let nodeElements = lines[i].split(" ");
        console.log(nodes.find(n => n.id == nodeElements[0]));
        nodes.push(
            {
                //'id' now refers to the ID in the text file
                //old 'id' property renamed as 'name'
                id: nodeElements[0],
                name: nodeElements[3],
                latitude: nodeElements[1],
                longitude: nodeElements[2],
                //filled in later
                neighbors: null
            }
        )
    }
    
    //loops over the rest of the file to find node paths
    for(i = 1 + nodeCount; lines[i]; ++i) {
        let nodeElements = lines[i].split(" ");

        //first element is the node that 
        //everything else in the line connects to
        var node =
            nodes.find(node => node.id == nodeElements[0]);
        var neighborsList = [];

        //loops over all neighboring nodes
        for(j = 1; nodeElements[j]; ++j) {
            var neighbor = 
                nodes.find(node => node.id == nodeElements[j]);
            
            //adds only neighbor name to the neighbor list
            if(neighbor) {
                neighborsList.push(neighbor.name);
            }
                
        }

        if(node) {
            node.neighbors = neighborsList;
        }

    }

    ogNodes = nodes;

}


// Update table view according to "nodes" object
function drawTable() {
    // remove all existing content rows
    tableContentRows.forEach(row => row.remove());
    nodes.forEach(node => {
        const row = nodesTable.insertRow();
        tableContentRows.push(row);

        if (inModifyMode) {
            // Set cell content for name as text input
            var cell = row.insertCell();
            const inputNameBox = document.createElement("input");
            inputNameBox.id = node["id"];
            inputNameBox.class = "form-control";
            inputNameBox.value = node["name"].toString().replaceAll(",", ", ");
            inputNameBox.addEventListener ("change", handleNameChange);
            cell.appendChild(inputNameBox);
            // Set cell content for lat, long
            const cells = ["latitude", "longitude"];
            cells.forEach(i => {
                cell = row.insertCell();
                cell.innerHTML = node[i];
            });
            // Set cell content for neighbors as text input
            cell = row.insertCell();
            const inputNeighborsBox = document.createElement("input");
            inputNeighborsBox.id = node["id"];
            inputNeighborsBox.class = "form-control";
            inputNeighborsBox.value = node["neighbors"].toString().replaceAll(",", ", ");
            inputNeighborsBox.addEventListener ("change", handleNeighborChange);
            cell.appendChild(inputNeighborsBox);
        } else {
            // Set cell content for name, lat, long, neighbors
            const cells = ["name", "latitude", "longitude", "neighbors"];
            cells.forEach(i => {
                cell = row.insertCell();
                cell.innerHTML = node[i];
            });
        }   

    })
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
    })
    nodeMarkers = [];
    console.log(nodes.length);
    nodes.forEach(node => {
        const circle = L.circle([parseFloat(node.latitude), parseFloat(node.longitude)], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            radius: 2
        }).addTo(map);
        var popup = L.popup({
            closeOnClick: true,
            autoClose: false,
            closeButton: true
          }).setContent("<small>" + node.name + "</small>")
        circle.bindPopup(popup);
        circle.nodeName = node.name; // custom property
        nodeMarkers.push(circle);
    })
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
    nodes.forEach(node => {
        node.neighbors.forEach(neigh => {
            const nodeCoord = [parseFloat(node.longitude), parseFloat(node.latitude)];
            const neighNode = nodes.find(n => n.name == neigh);
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
    });

    edgeLayer = L.geoJSON(data);
    try {
        edgeLayerGroup.addLayer(edgeLayer);
    } catch(ignore) {

    }
    
}


function handleNeighborChange(e) {
    // INPUT VALIDATION
    var isBadInput = false;
    var newNeighbors = e.target.value.split(",");
    newNeighbors = newNeighbors.map(el => {return el.replaceAll(" ", "");}); // remove all spaces
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
        alert("wtf r u doin fix that input");
        return;
    } 
    // Handle good input
    e.target.style.backgroundColor = "white";
    

    var thisNode = nodes.find(n => n.id == e.target.id);
    
    // Update affected neighbor's neighbor list
    thisNode.neighbors.forEach(old => {
        
        if(!newNeighbors.includes(old)) {
            
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
            var neighborNode = nodes.find(n => {return n.name == neigh;});
            if (neighborNode != null && !neighborNode.neighbors.includes(node.name)) {
                msg += (neighborNode.name + " is missing neighbor " + node.name + ". Updating... \n");
                neighborNode.neighbors.push(node.name);
            }
        });
    });
    if(displayMessage) {
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
    res += nodes.length + "<br />";  
    // write each node id/lat/long/name to first half
    nodes.forEach(node => {
        res += node.id + " " + node.latitude + " " + node.longitude + " " + node.name + "<br />";
    });
    // write each node id/neigh1/neigh2/etc. to second half
    nodes.forEach(node => {
        res += node.id + " " + node.neighbors.map(neighbor => nodes.find(n => n.name == neighbor).id).toString().replaceAll("[", "").replaceAll("]", "").replaceAll(",", " ") + "<br />";
    }) 
    nodesTxt = res;
    drawPreview();
    alert("Done");
}

function save() {
    enforceBidirectionality();
    download("Nodes", nodesTxt.replaceAll("<br />", "%0A"));
}




var circleArray = [];
var nodesToAdd = [];
var addedNodes = 0;
var nameOffset = 0;

function nodeEvent(e) {
    var pos = e.latlng;
    
    if(nodesToAdd[nodesToAdd.length - 1]) {
        var neighbor = nodesToAdd[nodesToAdd.length - 1].name;
    }

    //checks for duplicate names or IDs and corrects
    while(nodes.find(n => n.id == parseInt(nodes.length + addedNodes + nameOffset + 1)) || 
        nodes.find(n => n.name == ['N' + (parseInt(nodes.length) +
        parseInt(nameOffset) + 1)])) {
            nameOffset++;
    }

    if(neighbor) {
        nodesToAdd.push( {
            id: parseInt(nodes.length + addedNodes + nameOffset + 1),
            name: 'N' + (parseInt(nodes.length) +
                parseInt(nameOffset) + 1),
            latitude: pos.lat,
            longitude: pos.lng,
            neighbors: [neighbor]
        });
    } else {
        nodesToAdd.push( {
            id: parseInt(nodes.length + addedNodes + nameOffset + 1),
            name: 'N' + (parseInt(nodes.length) +
                parseInt(nameOffset) + 1),
            latitude: pos.lat,
            longitude: pos.lng,
            neighbors: []
        });
    }

    addedNodes++;
    nameOffset++;

    const circle = L.circle(pos, {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 1,
        radius: 3
    }).addTo(map);
    
    circleArray.push(circle);
}

//useless, but may be used for more functionality later
function enterAddNodeMode() {
    map.on('click', nodeEvent);
}

function exitAddNodeMode() {
    map.off('click', nodeEvent);


    prevNodes.push(nodes);

    nodes = nodes.concat(nodesToAdd);
    
    drawNodeElements();

    nodesToAdd = [];
}

function handleEditorOptionChange() {
    if (addNodesRadio.checked) {
        exitConnectNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        enterAddNodeMode();
    } else if (modifyNodesRadio.checked) {
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
        enterConnectNodeMode();
    } else if (deleteNodesRadio.checked) {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitLassoMode();
        enterDeleteNodeMode()
    } else if (lassoConnectRadio.checked) {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitDeleteNodeMode();
        enterLassoMode();
    } else {
        exitConnectNodeMode();
        exitAddNodeMode();
        exitDeleteNodeMode();
        exitLassoMode();
    }
}

var lassoControl;

map.on('lasso.finished', event => {
    handleFinishedLasso(event.layers);
});

function enterLassoMode() {
    lassoControl = L.control.lasso().addTo(map);
    lassoControl.enable();
}


function handleFinishedLasso(layers) {
    const selectedNodes = [];
    layers.forEach(l => {
        l.nodeName ? selectedNodes.push(l.nodeName) : null;
    });
    selectedNodes.forEach(curNode => {
        const otherNodes = selectedNodes.filter(n => n != curNode);
        otherNodes.forEach(otherNode => {
            nodes.find(n => n.name == curNode).neighbors.push(otherNode);
        });
    });
    
    drawTable();
    drawPreview();
    redrawEdges();
    document.getElementById("btnradio5").checked = true;
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
    map.removeLayer(e.target);
    nodes = nodes.filter(n => n.name != e.target.nodeName);
    deleteAllNeighborsByName(e.target.nodeName);
    drawTable();
    constructEdgesGeoJSON();
    handleEdgesCheck(btncheck2);
    enterDeleteNodeMode(); // to re-attatch event listeners to the newly-generated markers
    
}

function deleteAllNeighborsByName(name) {
    nodes.forEach(node => {
        node.neighbors = node.neighbors.filter(neigh => neigh != name);
    })
}

function redrawEdges() {
    if(edgeModeOn) {
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

var firstCircle = null;

function connectNodeEvent(e) {
    console.log("works");
    var clickedCircle = e.target;
    if (!firstCircle) { // if first circle wasn't already clicked
        firstCircle = clickedCircle.nodeName;
        console.log("first circle :" + clickedCircle);
        return;
    } else { // if first circle was already clicked
        console.log("second circle");
        var firstNode = nodes.find(n => n.name == firstCircle);
        if (!firstNode.neighbors.includes(clickedCircle.nodeName)) {
            firstNode.neighbors.push(clickedCircle.nodeName);
        } else {
            alert("Stop adding duplicate connections!");
        }
        firstCircle = null;
        drawTable();
        constructEdgesGeoJSON();
        enforceBidirectionality();
        redrawEdges();
        return;
    }
    
}

function deleteNodes(e) {
    alert("TODO: handle form submit");
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
        }
    , false);

    document.addEventListener('keyup', function(e) {
        keys[e.keyCode] = false;
        }
    , false);
}

//checks keys pressed every 10ms for commands
//add new commands here
function commandLoop() {

    switch(true) {
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

var undoneNodes = [[]];
function handleUndo() {

    var update = prevNodes.pop();
    
    if(update && update.length > 0 && !isSameArrayByElems(update, nodes)) {

        undoneNodes.push(nodes);
        
        nodes = update;
        
        drawNodeElements();
    }
    

}

function handleRedo() {

    var update = undoneNodes.pop();

    if(update && update.length > 0 && !isSameArrayByElems(update, nodes)) {

        prevNodes.push(nodes);

        nodes = update;

        drawNodeElements();
    }

}

//quick way to redraw nodes
function drawNodeElements() {

    circleArray.forEach(circle => {
        map.removeLayer(circle);
    });

    drawTable();
    drawMarkers();

    enforceBidirectionality(false);
    constructEdgesGeoJSON();

    redrawEdges()

    handleEdgesCheck(btncheck2);
}

function isSameArrayByElems(ar1, ar2) {

    if(ar1.length == ar2.length) {

        for(i = 0; i < ar1.length; i++) {

            if(ar1[i] != ar2[i]) {
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