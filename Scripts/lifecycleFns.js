// Lifecycle Functions:



var nodesTxt;
var nodes = new Map();
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

var tableContentRows = [];
var inModifyMode = false;
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

var nodeMarkers = [];
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

function handlePopupCheck(box) {
    if (box.checked) {
        togglePopups("on");
    } else {
        togglePopups("off");
    }
}