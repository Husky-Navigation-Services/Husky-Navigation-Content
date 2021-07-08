const previewTextEl = document.getElementById("preview-text");
const nodesTable = document.getElementById("nodes-table");
var nodesTxt; // unparsed node text
var nodes = []; // parsed list of node objects for internal representation

// init map 
var map = L.map('map').setView([47.6532, -122.3074], 16);

L.tileLayer( 'https://api.mapbox.com/styles/v1/aferman/ckhvetwgy0bds19nznkfvodbx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWZlcm1hbiIsImEiOiJja2ZrZXJvbjUwZW5wMnhxcjdyMXc3ZjRnIn0.WGdId2uO9XokPaJmaxlLXg', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );

// Update preview with Nodes.txt data,
// parse Nodes.txt data to update internal "nodes" variable
// with a list of nodes.
fetch('Nodes.txt')
    .then(response => response.text())
    .then(txt => {
        nodesTxt = txt.replaceAll("\r\n", "");
        updatePreview()
        parseNodes()
        updateTable();
        console.log(nodes);
    })

// Update preview of Nodes.txt with given text
function updatePreview() {
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
    const nodeArr = nodesTxt.split(",");
    // for each line in Nodes.txt
    nodeArr.forEach(line => {
        line = line.split(" ");
        var neighborsList = []
        // for each token in the current 
        line.slice(3, line.length).forEach(id => {
            if (isNaN(id)) {
                neighborsList.push(id);
            }
        })
        nodes.push(
            {
                id: line[2],
                latitude: line[0],
                longitude: line[1],
                neighbors: neighborsList
            }
        )
    })
}

// Update table view according to "nodes" object
function updateTable() {
    nodes.forEach(node => {

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