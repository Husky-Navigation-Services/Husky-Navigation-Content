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
        drawPreview();
        parseNodes();
        drawTable();
        drawMarkers();
        updateEdges();
        handleCommands();
        commandLoop();
    }
}