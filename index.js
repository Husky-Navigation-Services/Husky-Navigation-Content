const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
const showPopupsCheck = document.getElementById("btncheck1");
const btncheck2 = document.getElementById("btncheck2");
const btncheck3 = document.getElementById("btncheck3");
var nodesTxt; // unparsed node text
var nodes = []; // parsed list of node objects for internal representation
var nodeMarkers = []; // stores all node markers
var tableContentRows = [];
var edgeLayer; // Leaflet geoJSON layer

// init map 
var map = L.map('map').setView([47.6532, -122.3074], 16);

L.tileLayer( 'https://api.mapbox.com/styles/v1/aferman/ckhvetwgy0bds19nznkfvodbx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWZlcm1hbiIsImEiOiJja2ZrZXJvbjUwZW5wMnhxcjdyMXc3ZjRnIn0.WGdId2uO9XokPaJmaxlLXg', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );

// MAIN
// Update preview with Nodes.txt data,
// parse Nodes.txt data to update internal "nodes" variable
// with a list of nodes.
fetch('Nodes.txt')
    .then(response => response.text())
    .then(txt => {
        nodesTxt = txt;
        drawPreview();
        parseNodes();
        drawTable();
        drawMarkers();
        constructEdgesGeoJSON();
        console.log(nodes);
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

}


// Update table view according to "nodes" object
function drawTable() {
    // remove all existing content rows
    tableContentRows.forEach(row => row.remove());
    nodes.forEach(node => {
        const row = nodesTable.insertRow();
        tableContentRows.push(row);

        // Set cell content for name, lat, long
        const cells = ["name", "latitude", "longitude"];
        cells.forEach(i => {
            cell = row.insertCell();
            cell.innerHTML = node[i];
        });
        // Set cell content for neighbors as text input
        cell = row.insertCell();
        const inputBox = document.createElement("input");
        inputBox.id = node["id"];
        inputBox.class = "form-control";
        inputBox.value = node["neighbors"].toString().replaceAll(",", ", ");
        inputBox.addEventListener ("change", handleNeighborChange);
        cell.appendChild(inputBox);
    })
}

// Draw markers as LeafletJS circles
function drawMarkers() {
    nodeMarkers = [];
    nodes.forEach(node => {
        const circle = L.circle([parseFloat(node.latitude), parseFloat(node.longitude)], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            radius: 2
        }).addTo(map);
        var popup = L.popup({
            closeOnClick: false,
            autoClose: false
          }).setContent("<b>" + node.id + "</b>")
        circle.bindPopup(popup);
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

function handleEdgesCheck(box) {
    if (box.checked) {
        edgeLayer.addTo(map);
    } else {
        map.removeLayer(edgeLayer);
    }
    
}


function constructEdgesGeoJSON() {
    var data = {
        "type": "FeatureCollection",
        "features": []
    };
    console.log(data);
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
    console.log(JSON.stringify(data));
    edgeLayer = L.geoJSON(data);
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
    // Update changed node with new neighbors
    nodes.find(n => n.id == e.target.id).neighbors = e.target.value.split(",").map(el => el.replaceAll(" ", ""));
}





// Ensures that every neighboring pair of neighbors lists each other as a neighbor
// Given list of new neighbors to check
// e.g, if N2 has neighbor N5, then the function enforces that N5 has neighbor N2
function enforceBidirectionality(displayMessage) {
    var inputError = false;
    nodes.forEach(node => {
        if (document.getElementById(node.id).style.backgroundColor == "red") {
            alert("wtf you doin fix the input first .-.");
            inputError = true;
        }
    })
    if (inputError) {
        return;
    }

    var msg = "";
    nodes.forEach(node => {
        console.log(node.neighbors);
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
    alert("TODO")
}


function handleNodeMode(box) {


    if(box.checked) {
        map.on('click', nodeEvent);
        enterNodeMode();
    } else {
        map.off('click', nodeEvent);
        exitNodeMode();
    }
    
}

var circleArray = [];
var nodesToAdd = [];
var addedNodes = 0;
function nodeEvent(e) {
     
    var pos = e.latlng;
    
    if(nodesToAdd[nodesToAdd.length - 1]) {
        var neighbor = nodesToAdd[nodesToAdd.length - 1].name;
    }

    if(neighbor) {
        nodesToAdd.push( {
            id: parseInt(nodes.length + addedNodes + 1),
            name: 'N' + (parseInt(nodes.length) +
                parseInt(addedNodes) + 1),
            latitude: pos.lat,
            longitude: pos.lng,
            neighbors: [neighbor]
        });
    } else {
        nodesToAdd.push( {
            id: parseInt(nodes.length + addedNodes + 1),
            name: 'N' + (parseInt(nodes.length) +
                parseInt(addedNodes) + 1),
            latitude: pos.lat,
            longitude: pos.lng,
            neighbors: []
        });
    }

    addedNodes++;

    const circle = L.circle(pos, {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 1,
        radius: 3
    }).addTo(map);
    
    circleArray.push(circle);
}

//useless, but may be used for more functionality later
function enterNodeMode(nodeEvent) {


}

function exitNodeMode() {
    

    nodes = nodes.concat(nodesToAdd);

    circleArray.forEach(circle => {
        map.removeLayer(circle);
    });

    console.log(nodes);
    drawTable();
    drawMarkers();

    enforceBidirectionality(false);
    
    constructEdgesGeoJSON();

    nodesToAdd = [];

}



