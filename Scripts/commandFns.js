/*  Key Command Tools 
    > commandLoop
    > handleCommands
    > handleUndo
    > handleRedo
*/

let ogNodes = []; // makes sure undo doesn't go past this
let prevNodes = [
    []
]; // stores previous nodes to allow for change reversion
let keys = []; // keys track of keys pressed for commands
let undoneNodes = [
    []
];

// Checks keys pressed every 10ms for commands - add new commands here
function commandLoop() {
    switch (true) {
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

// Sets a keyCode index as true if a key is currently pressed
// e.g. if ctrl is pressed keys[17] will be true.
function handleCommands() {
    document.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    }, false);
    document.addEventListener('keyup', function(e) {
        keys[e.keyCode] = false;
    }, false);
}

// Undo node addition
function handleUndo() {
    var update = prevNodes.pop();
    if (update && update.length > 0 && !isSameArrayByElems(update, nodes)) {
        undoneNodes.push(nodes);
        nodes = update;
        drawNodeElements();
    }
}

// Redo node addition
function handleRedo() {
    var update = undoneNodes.pop();
    if (update && update.length > 0 && !isSameArrayByElems(update, nodes)) {
        prevNodes.push(nodes);
        nodes = update;
        drawNodeElements();
    }
}