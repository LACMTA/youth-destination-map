const mapDiv = document.querySelector('#map-container');
let map;

map = mapDiv ? L.map(mapDiv).setView([34.0622, -118.2437], 10) : null;

const docHeight = document.body.scrollHeight;

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
    if (map) {
        let url = window.location.href;
        let refreshInteral = 15000; // 15 seconds
    
        console.log(url);
    
        if (url.includes('/map/')) {
            console.log('on map page setting zoom to 11');
            map.setZoom(11);
        } else {
            console.log('NOT on map page');
            refreshInteral = 30000;
        }

        /* This is a Carto-styled OSM basemap*/
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
            attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
            minZoom: 0
        }).addTo(map);

        const wmsLayer = L.tileLayer('https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC4/MapServer/WMTS/tile/1.0.0/Map_RGB_Vector_Offset_RC4/default/default028mm/{z}/{y}/{x}.png').addTo(map);

        window.setInterval(readFromAirtable, refreshInteral);
        // readFromAirtable();
    }
    

    let form = document.getElementById('form')
    if (form) {
        form.addEventListener('submit', handleSubmit);

        if (map) {
            document.body.addEventListener('click', function(e) {
                if (e.target.closest('#destination')) {
                    document.getElementById('map-container').style.flexGrow = "1";
                    document.getElementById('form-container').style.flexGrow = "4";
                } else {
                    document.getElementById('map-container').style.flexGrow = "4";
                    document.getElementById('form-container').style.flexGrow = "1";
                }
            });
        }
    }

    
})

// Callback function for Google Map API
// as defined in src/_includes/default.liquid
function initMap() {
    console.log('Gmaps call returned');
    if (input !== null) {
        autocomplete = new google.maps.places.Autocomplete(input, options);
    }
}

function handleSubmit(event) {
    document.getElementById('confirmation').innerText = '';
    document.getElementById('saving').style.display = 'block';
    saveToAirtable();
    document.getElementById('destination').value = '';
    document.getElementById('first-name').value = '';
    document.getElementById('description').value = '';
    autocomplete.set('place', null);
    event.preventDefault();
}

function saveToAirtable() {
    let google_place = autocomplete.getPlace();
    if (google_place == null) {
        document.getElementById('destination').value = '';
        document.getElementById('confirmation').innerText = 'Please select from the dropdown';
    } else if (!google_place.geometry) {
        document.getElementById('confirmation').innerText = 'Please select from the dropdown';
        document.getElementById('autocomplete').placeholder = 'Where do you want to go?';
    } else {
        console.log(google_place.name);
        console.log(google_place.place_id);
        console.log(google_place.geometry.location.lat() + ', ' + google_place.geometry.location.lng());

        let shortenedPlaceName = document.getElementById('destination').value.split(',')[0];

        let lambda_airtable_url = 'https://6tylo7vfvkr4aj7mk2h6ihom3a0mcttz.lambda-url.us-west-1.on.aws/?';
        
        lambda_airtable_url += 'google_place=' + google_place.name;
        lambda_airtable_url += '&google_place_id=' + google_place.place_id;
        lambda_airtable_url += '&lat=' + google_place.geometry.location.lat();
        lambda_airtable_url += '&lon=' + google_place.geometry.location.lng();
        lambda_airtable_url += '&user_entered_place=' + shortenedPlaceName;
        lambda_airtable_url += '&first_name=' + document.getElementById('first-name').value;
        lambda_airtable_url += '&description=' + document.getElementById('description').value;
        
        console.log('Lambda write call: ' + lambda_airtable_url);

        postInsertData(lambda_airtable_url).then((data) => {
            console.log('write call return: ' + data);
            document.getElementById('saving').style.display = 'none';
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

    console.log('Lambda read call: ' + lambda_airtable_url);

    getRecords(lambda_airtable_url).then((data) => {
        console.log(data);

        resetMarkers();

        data.forEach(destination => {
            let marker = L.marker([destination.lat, destination.lon]);
            let markerContent = '<p>' + destination.user_entered_place + '<br><br>' + 'Count: ' + destination.count + '</p>';

            marker.bindPopup(markerContent);
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
