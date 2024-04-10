const destinationsDataFile = '/youth-destination-map/data/destinations-data.csv';
const recommendationsDataFile = '/youth-destination-map/data/recommendations-data.csv';

const mapDiv = document.querySelector('#map-container');
const map = L.map(mapDiv).setView([34.0622, -118.2437], 10);

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

// Create a function to parse a CSV file
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            download: true,
            header: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
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

    let form = document.getElementById('form')
    if (form !== null) {
        form.addEventListener('submit', handleSubmit);

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

    /* This is a Carto-styled OSM basemap*/
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
        attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 0
    }).addTo(map);

    const wmsLayer = L.tileLayer('https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC4/MapServer/WMTS/tile/1.0.0/Map_RGB_Vector_Offset_RC4/default/default028mm/{z}/{y}/{x}.png').addTo(map);

    // window.setInterval(readFromAirtable, refreshInteral);

    // Load Metro data layers
    let geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#0ae8f4",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    }
    L.geoJSON(railStations, {
        pointToLayer: function(feature, latlng) {
            let marker = L.circleMarker(latlng, geojsonMarkerOptions);
            let markerContent = '<p>' + feature.properties.STOP_NAME + '</p>';
    
            marker.bindPopup(markerContent);
            return marker;
        }
    }).addTo(map);

    // Load cleaned destination data
    // Papa.parse(destinationsDataFile, {
    //     download: true,
    //     header: true,
    //     dynamicTyping: true,
    //     complete: (results) => {
    //         console.log('Papa parsed CSV: ' + results.data.length + ' rows');
    //         showDestinationData(results.data);
    //     }
    // });

    // Use Promise.all to parse all CSV files
    Promise.all([parseCSV(destinationsDataFile), parseCSV(recommendationsDataFile)])
    .then(results => {
        // results[0] contains data from destinationsDataFile
        // results[1] contains data from recommendationsDataFile
        console.log('Parsed ' + results[0].length + ' destinations and ' + results[1].length + ' recommendations');

        // Now you can call your createMarkers function
        // Filter destinations for non-null coordinates and show = true
        
        let filteredDestinations = results[0].filter(function(row) {
            return row.lat != null && row.lon != null && row.show === "TRUE";
        });
        console.log('Filtered ' + filteredDestinations.length + ' destinations');
        createMarkers(filteredDestinations, results[1]);
    })
    .catch(err => console.error(err));

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
            console.log(destination.lat + ', ' + destination.lon);
            let marker = L.marker([destination.lat, destination.lon]);
            let markerContent = '<p>' + destination.user_entered_place + '<br><br>' + 'Count: ' + destination.count + '</p>';

            marker.bindPopup(markerContent);
            marker.addTo(markers);
        });
        map.addLayer(markers);
    });
}

function createMarkers(destinations, recommendations) {
    destinations.forEach(destination => {
        let marker = L.marker([destination.lat, destination.lon]);
        let markerContent = '<p>' + destination.user_entered_place + '</p>';

        let matchingRecommendations = recommendations.filter(recommendation => recommendation.google_place_id === destination.google_place_id);
        console.log('Matching recommendations: ' + matchingRecommendations.length);

        if (matchingRecommendations.length > 0) {
            markerContent += '<ul>';
            matchingRecommendations.forEach(recommendation => {
                markerContent += `<li>"${recommendation.description}" -${recommendation.first_name}</li>`;
            });
            markerContent += '</ul>';
        }

        marker.bindPopup(markerContent);
        marker.addTo(markers);
    });
    map.addLayer(markers);
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
