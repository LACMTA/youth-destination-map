const mapDiv = document.querySelector('#map-container');
const map = L.map(mapDiv).setView([34.0622, -118.2437], 10);
const path = './data/places.json';

const center = { lat: 34.0622, lng: -118.2437 };
const defaultBounds = {
  north: center.lat + 0.7,
  south: center.lat - 0.7,
  east: center.lng + 0.7,
  west: center.lng - 0.7
};
const input = document.getElementById('destination');
const options = {
    bounds: defaultBounds,
    componentRestrictions: { country: 'us' },
    fields: ['place_id', 'geometry', 'name'],
    strictBounds: true
}
let autocomplete;
let markers = L.layerGroup();

document.addEventListener('DOMContentLoaded', () => {
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 0
    }).addTo(map);

    readFromAirtable();
})

// fetch(path)
// .then((response) => response.json())
// .then((json) => {
//     json.forEach(place => {
//         let marker = L.marker([place.location.lat, place.location.lng]).addTo(map);
//         marker.bindPopup(place.name);
//     });
// }); 

function initMap() {
    console.log('Gmaps call returned');
    autocomplete = new google.maps.places.Autocomplete(input, options);
    // autocomplete.addListener('place_changed', onPlaceChanged);
}

document.getElementById('form').addEventListener('submit', handleSubmit);

function handleSubmit(event) {
    saveToAirtable();
    document.getElementById('destination').value = '';
    autocomplete.set('place', null);
    event.preventDefault();
}


function saveToAirtable() {
    let place = autocomplete.getPlace();
    if (place == null) {
        document.getElementById('destination').value = '';
    } else if (!place.geometry) {
        document.getElementById('autocomplete').placeholder = 'Where do you go?';
    } else {
        console.log(place.name);
        console.log(place.place_id);
        console.log(place.geometry.location.lat() + ', ' + place.geometry.location.lng());

        let lambda_airtable_url = 'https://6tylo7vfvkr4aj7mk2h6ihom3a0mcttz.lambda-url.us-west-1.on.aws/?';
        
        lambda_airtable_url += 'place=' + place.name;
        lambda_airtable_url += '&place_id=' + place.place_id;
        lambda_airtable_url += '&lat=' + place.geometry.location.lat();
        lambda_airtable_url += '&lon=' + place.geometry.location.lng();

        postInsertData(lambda_airtable_url).then((data) => {
            console.log(data);
            document.getElementById('confirmation').innerText = data + ' found via Google and added!';
            resetMarkers();
        });
    }
}

async function postInsertData(url = "") {
    const response = await fetch(url, {
        method: "POST",
        mode: "cors"
    });
    return response.json();
}

function readFromAirtable() {
    let lambda_airtable_url = 'https://ycvplis7qloqh5g6qjmwgvmusq0twgct.lambda-url.us-west-1.on.aws/';

    getRecords(lambda_airtable_url).then((data) => {
        console.log(data);
        data.forEach(destination => {
            let marker = L.marker([destination.lat, destination.lon]);
            marker.bindPopup(destination.place);
            marker.addTo(markers);
        });
        map.addLayer(markers);
    });
}

async function getRecords(url = "") {
    const response = await fetch(url, {
        method: "GET",
        mode: "cors"
    });
    return response.json();
}

function resetMarkers() {
    markers.clearLayers();
    readFromAirtable();
}