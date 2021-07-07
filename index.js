const previewTextEl = document.getElementById("preview-text");

var map = L.map('map').setView([47.6532, -122.3074], 16);

L.tileLayer( 'https://api.mapbox.com/styles/v1/aferman/ckhvetwgy0bds19nznkfvodbx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWZlcm1hbiIsImEiOiJja2ZrZXJvbjUwZW5wMnhxcjdyMXc3ZjRnIn0.WGdId2uO9XokPaJmaxlLXg', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
}).addTo( map );

fetch('Nodes.txt')
  .then(response => response.text())
  .then(text => updatePreview(text))

function updatePreview(text) {
    previewTextEl.textContent = text; 
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