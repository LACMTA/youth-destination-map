const ESRI_KEY =  "AAPKccc2cf38fecc47649e91529acf524abflSSkRTjWwH0AYmZi8jaRo-wdpcTf6z67CLCkOjVYlw3pZyUIF_Y4KGBndq35Y02z";
const basemapEnum = "65aff2873118478482ec3dec199e9058";
const popupLatOffset = 0.02;


const destinationsDataFile = '/youth-destination-map/data/destinations-data.csv';
const recommendationsDataFile = '/youth-destination-map/data/recommendations-data.csv';

let markerArray = [];
let openPopup = null;

var map = new maplibregl.Map({
    container: 'map', // container id
    style: 'https://demotiles.maplibre.org/style.json', // style URL
    center: [-118.25133692966446, 34.00095151499077], 
    zoom: 10,
    style: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`,
});

map.on('load', () => {
    new mapboxglEsriSources.TiledMapService('imagery-source', map, {
        url: 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC5/MapServer'
    });

    map.addLayer({
        id: 'imagery-layer',
        type: 'raster',
        source: 'imagery-source'
    })

    Promise.all([parseCSV(destinationsDataFile), parseCSV(recommendationsDataFile)])
    .then(results => {
        // results[0] contains data from destinationsDataFile
        // results[1] contains data from recommendationsDataFile
        console.log('Parsed ' + results[0].length + ' destinations and ' + results[1].length + ' recommendations');

        // Filter destinations for non-null coordinates and show = true        
        let filteredDestinations = results[0].filter(function(row) {
            return row.lat != null && row.lon != null && row.show === "TRUE";
        });
        
        console.log('Filtered out ' + filteredDestinations.length + ' destinations');
        createMarkers(filteredDestinations, results[1]);
    })
    .catch(err => console.error(err));

});

map.on('click', function(e) {
    console.log('flyTo: ', e.lngLat);

    map.flyTo({
        center: {
            'lat': e.lngLat.lat,
            'lng': e.lngLat.lng
        }
    });
});

function createMarkers(destinations, recommendations) {
    destinations.forEach(destination => {
        let popupContent = document.createElement('div');
        popupContent.innerHTML = `<strong>${destination.google_place}</strong>`;

        let destinationContent =  document.createElement('div');
        destinationContent.classList.add('destination-content');

        let destinationContentHeader = document.createElement('h2');
        destinationContentHeader.innerHTML = destination.google_place + ' ';

        let markerLink = document.createElement('a');
        markerLink.classList.add('marker-link');

        let markerIcon = document.createElement('span');
        markerIcon.classList.add('list-marker-icon');
        markerLink.appendChild(markerIcon);

        markerIcon.outerHTML = '<svg display="inline" height="20px" width="13px" viewBox="0 0 27 41" xlmns="http://www.w3.org/2000/svg"><g fill-rule="nonzero"><g transform="translate(3.0, 29.0)" fill="#000000"><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="10.5" ry="5.25002273"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="10.5" ry="5.25002273"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="9.5" ry="4.77275007"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="8.5" ry="4.29549936"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="7.5" ry="3.81822308"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="6.5" ry="3.34094679"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="5.5" ry="2.86367051"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="4.5" ry="2.38636864"></ellipse></g><g fill="#3FB1CE"><path d="M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"></path></g><g opacity="0.25" fill="#000000"><path d="M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"></path></g><g transform="translate(6.0, 7.0)" fill="#FFFFFF"></g><g transform="translate(8.0, 8.0)"><circle fill="#000000" opacity="0.25" cx="5.5" cy="5.5" r="5.4999962"></circle><circle fill="#FFFFFF" cx="5.5" cy="5.5" r="5.4999962"></circle></g></g></svg>';
        
        markerLink.setAttribute('data-id', destination.destinationID);
        markerLink.setAttribute('data-lat', destination.lat);
        markerLink.setAttribute('data-lon', destination.lon);

        markerLink.addEventListener('click', function(e) {
            let foundMarker = markerArray.find(marker => {
                let elem = marker.getElement();
                return elem.classList.contains('marker-' + destination.destinationID);
            });

            let popups = document.querySelectorAll('.maplibregl-popup');
    
            if ( popups.length > 0 ) {
                popups[0].remove();
            }

            if (openPopup) {
                openPopup.remove();
            }
            openPopup = foundMarker.getPopup();
            foundMarker.togglePopup();
            

            map.flyTo({
                center: [destination.lon, destination.lat]
            });
        });

        console.log('click Event created for: ' + destination.google_place + ' at ' + destination.lat + ', ' + destination.lon)

        destinationContentHeader.appendChild(markerLink);
        destinationContent.appendChild(destinationContentHeader);

        let matchingRecommendations = recommendations.filter(recommendation => recommendation.google_place_id === destination.google_place_id);

        if (matchingRecommendations.length > 0) {
            matchingRecommendations.forEach(recommendation => {
                popupContent.appendChild(createRecommendationElement(recommendation));
                destinationContent.appendChild(createRecommendationElement(recommendation));
            });
        }

        createMarker(destination, popupContent);
        addDestinationContent(destinationContent);
    });
}

function createRecommendationElement(recommendation) {
    let recommendationElement = document.createElement('div');
    recommendationElement.classList.add('recommendation-content');
    recommendationElement.innerHTML = `<p>"${recommendation.description}" <br>- <em>${recommendation.first_name}</em></p>`;
    return recommendationElement;
}

function addDestinationContent(element) {
    const destinationContent = document.getElementById('destinations');
    destinationContent.appendChild(element);
}

function createMarker(destination, content) {
    const popup = new maplibregl.Popup({offset: 25})
    .setHTML(content.outerHTML);

    const marker = new maplibregl.Marker();
    
    marker.addClassName('marker-' +  destination.destinationID);
    
    marker
    .setLngLat([destination.lon, destination.lat])
    .setPopup(popup);

    markerArray.push(marker);
    
    marker.addTo(map);
}

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