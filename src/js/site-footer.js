let map = L.map('map').setView([34.0522, -118.2437], 10);
let path = './data/places.json';

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 19,
   minZoom: 0
 }).addTo(map);


fetch(path)
.then((response) => response.json())
.then((json) => {
    json.forEach(place => {
        let marker = L.marker([place.location.lat, place.location.lng]).addTo(map);
        marker.bindPopup(place.name);

        // let newElemName = document.createElement('h2');
        // newElemName.textContent = place.name;
        
        // let newElem = document.createElement('div');
        // newElem.appendChild(newElemName);
        
        // let list = document.querySelector('#list div');
        // list.appendChild(newElem);

    });
});