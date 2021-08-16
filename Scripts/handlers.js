/*  Handlers 
    > handleEditorOptionChange 
*/
const edgesCheckbox = document.getElementById("edges-checkbox");
let edgeModeOn = false;

// Handle MODE option change
function handleModeChange() {
    let exitFns = [exitAddNodeMode, exitConnectNodeMode, exitLassoMode, exitDeleteNodeMode, exitMoveMode];
    let notExitFn = () => {};
    let enterFn = () => {};
    if (addNodesRadio.checked) {
        [notExitFn, enterFn] = [exitAddNodeMode, enterAddNodeMode];
    } else if (modifyNodesRadio.checked) {
        [notExitFn, enterFn] = [exitConnectNodeMode, enterConnectNodeMode];
    } else if (deleteNodesRadio.checked) {
        [notExitFn, enterFn] = [exitDeleteNodeMode, enterDeleteNodeMode];
    } else if (lassoConnectRadio.checked) {
        enterFn = enterLassoMode;
    } else if (moveRadio.checked) {
        [notExitFn, enterFn] = [exitMoveMode, enterMoveMode];
    }
    exitFns = exitFns.filter(fn => fn != notExitFn);
    exitFns.forEach(fn => fn());
    enterFn();
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

// Handle node name change
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