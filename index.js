/* 
    Husky Navigation Content
    > startup
    > init
*/

// startup
initSaveToast();
initMap();
initLasso();
initOverlay();
fetch('Nodes.txt')
    .then(res => res.text())
    .then(txt => {
        nodesTxt = txt;
        parseNodes();
        drawMarkers();
        updateEdges();
        console.log(nodes);
    });

// init (after user selects data)
function init(txt, isLatestData) {
    showControls();
    if (isLatestData) { // continue with latest data
        drawPreview();
        drawTable();
        handleCommands();
        commandLoop();
    } else { // custom data
        nodesTxt = txt;
        parseNodes();
        console.log(nodes);
        updatePreview();
        drawPreview();
        drawTable();
        drawMarkers();
        updateEdges();
        handleCommands();
        commandLoop();
    }
}