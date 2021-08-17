/*  Handlers 
    > handleModeChange
    > handleTableChange
    > handleSearch
    > handleOverlayCheck
    > handleEdgesCheck
    > handleNameChange
    > dragOverHandler
    > dropHandler
*/
const edgesCheckbox = document.getElementById("edges-checkbox");
let edgeModeOn = false;
let lastNodeMode = "view";

// Handle MODE option change
function handleModeChange() {
    exitLastMode();
    if (addNodesRadio.checked) {
        enterAddNodeMode();
        lastNodeMode = "add";
    } else if (modifyNodesRadio.checked) {
        enterConnectNodeMode();
        lastNodeMode = "connect";
    } else if (deleteNodesRadio.checked) {
        enterDeleteNodeMode();
        lastNodeMode = "delete";
    } else if (lassoConnectRadio.checked) {
        enterLassoMode();
        lastNodeMode = "lasso";
    } else if (moveRadio.checked) {
        enterMoveMode();
        lastNodeMode = "move";
    } else {
        lastNodeMode = "view";
    }
}

function exitLastMode() {
    switch (lastNodeMode) {
        case "add":
            exitAddNodeMode();
            break;
        case "connect":
            exitConnectNodeMode()
            break;
        case "lasso":
            exitLassoMode();
            break;
        case "delete":
            exitDeleteNodeMode();
            break;
        case "move":
            exitMoveMode();
            break;
        case "view":
            break;
    }
}

// Handle TABLE option change
function handleTableChange() {
    if (viewRadio.checked) {
        inModifyMode = false;
    } else {
        inModifyMode = true;
    }
    drawTable();
}

// Handle SEARCH change
function handleSearch(e) {
    filterTable(e.value);
}

// Handle "Show Overlay" checkbox change
function handleOverlayCheck(box) {
    if (box.checked) {
        overlay.addTo(map);
    } else {
        overlay.remove();
    }
}

// Handle "Show Edges" checkbox change
function handleEdgesCheck(box) {
    if (box.checked) {
        edgeModeOn = true;
    } else {
        edgeModeOn = false;
    }
    drawEdges();
}

// Handle node name change
function handleNameChange(e) {
    const id = e.target.id;
    const props = nodes.get(id.toString());
    const newName = e.target.value;
    props.name = newName;
    drawMarkers();
}

// Handle file dragged over drop area
function dragOverHandler(ev) {
    ev.preventDefault();
    document.getElementById("dropbox-icon-2").style.animation = "none";
}

// Handle file dropped into drop area
function dropHandler(ev) {
    ev.preventDefault(); // prevent default behavior (prevent file from being opened)
    var file = ev.dataTransfer.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(event) {
        console.log(event);
        console.log(event.target.result);
        init(event.target.result, false);
    };
}