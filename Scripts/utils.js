function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


function filterTable(q) {
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

// Compare arrays by value
function isSameArrayByElems(ar1, ar2) {
    if (ar1.length == ar2.length) {
        for (i = 0; i < ar1.length; i++) {
            if (ar1[i] != ar2[i]) {
                return false;
            }
        }
    } else {
        return false;
    }
    return true;
}