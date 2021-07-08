const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
const showPopupsCheck = document.getElementById("btncheck1");
const btncheck2 = document.getElementById("btncheck2");
const btncheck3 = document.getElementById("btncheck3");
var nodesTxt; // unparsed node text
var nodes = []; // parsed list of node objects for internal representation
var markerGroup; // LeafletJS LayerGroup object containing all markers

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
        nodesTxt = txt.replaceAll("\r\n", ",");
        drawPreview()
        parseNodes()
        drawTable();
        drawMarkers();
        console.log(nodes);
    })

    
// Update preview of Nodes.txt with given text
function drawPreview() {
    previewTextEl.textContent = nodesTxt;
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
    var lines = nodesTxt.split(",");


    //finds the number of unique nodes
    var nodeCount = parseInt(lines[0]);
    
    //creates all nodes without paths to other nodes
    for(i = 1; i < nodeCount; i++) {
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
    nodes.forEach(node => {
        const row = nodesTable.insertRow();
        const cells = ["name", "latitude", "longitude", "neighbors"];
        cells.forEach(i => {
            cell = row.insertCell();

            cell.innerHTML = node[i];
        });
    })
}

// Draw markers as LeafletJS circles
function drawMarkers() {
    const markers = [];
    nodes.forEach(node => {
        const circle = L.circle([parseFloat(node.latitude), parseFloat(node.longitude)], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            radius: 2
        }).addTo(map);
        circle.bindPopup("<b>" + node.id + "</b>");
        markers.push(circle);
    })
    markersGroup = L.layerGroup(markers)
    //my
    
}

function handleChecks() {
    if (showPopupsCheck.checked) {
        togglePopups("on");
    } else {
        togglePopups("off");
    }
}

function togglePopups() {
    nodeMarkers.forEach(marker => {
        marker.openPopup();
        
    })
}

































/*
// Returns the downloaded file given a containing url and file name.
// download("https://huskynavigationcontent.azurewebsites.net/Nodes.txt","Nodes.txt")
function download(url, filename) {
    fetch(url).then(function(t) {
        return t.blob().then((b)=>{
            var a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.setAttribute("download", filename);
            a.click();
        }
        );
    });
}

// Labels nodes and paths given the Nodes.txt file.
function nodesSetup(nodes.txt) {

}
*/