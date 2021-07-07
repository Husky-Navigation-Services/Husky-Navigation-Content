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