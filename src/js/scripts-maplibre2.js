const ESRI_KEY =  "AAPKccc2cf38fecc47649e91529acf524abflSSkRTjWwH0AYmZi8jaRo-wdpcTf6z67CLCkOjVYlw3pZyUIF_Y4KGBndq35Y02z";
const basemapEnum = "65aff2873118478482ec3dec199e9058";

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
        center: e.lngLat
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
        markerLink.innerHTML = '🔗';
        markerLink.setAttribute('data-id', destination.destinationID);
        markerLink.setAttribute('data-lat', destination.lat);
        markerLink.setAttribute('data-lon', destination.lon);

        markerLink.addEventListener('click', function(e) {
            let foundMarker = markerArray.find(marker => {
                let elem = marker.getElement();
                return elem.classList.contains('marker-' + destination.destinationID);
            });

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

    const marker = new maplibregl.Marker()
    
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