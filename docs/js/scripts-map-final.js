const ESRI_KEY =  "AAPKccc2cf38fecc47649e91529acf524abflSSkRTjWwH0AYmZi8jaRo-wdpcTf6z67CLCkOjVYlw3pZyUIF_Y4KGBndq35Y02z";
const basemapEnum = "65aff2873118478482ec3dec199e9058";

const basemapStyle = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`;
const mapImagery = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC5/MapServer';

const destinationsDataFile = '/youth-destination-map/data/destinations-data.csv';
const recommendationsDataFile = '/youth-destination-map/data/recommendations-data.csv';

const readFromAirtableUrl = 'https://ycvplis7qloqh5g6qjmwgvmusq0twgct.lambda-url.us-west-1.on.aws/';
const getDestUrl = 'https://5rqyajkoanm2z7nfkf7fcdxxt40fdxzi.lambda-url.us-west-1.on.aws/';
const getRecsUrl = 'https://6h4liuthvnsgu7morkntsf55ai0jnfra.lambda-url.us-west-1.on.aws/';

const geojsonDataUrl = 'https://gxu5ffy7xp2gmvdv45yeucj4le0cilzk.lambda-url.us-west-1.on.aws/';

const filterGroup = document.getElementById('filter-group');

async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log(jsonData);
        
        return jsonData;
    } catch (error) {
        console.error(error.message);
    }
}

const map = L.map('map', {
    minZoom: 2
}).on('load', onMapLoad).setView([34.00095151499077, -118.25133692966446], 10);;

L.esri.Vector.vectorBasemapLayer(basemapEnum, {
    apiKey: ESRI_KEY
}).addTo(map);

let metroLayer = new L.esri.TiledMapLayer({
    url: mapImagery,
    apiKey: ESRI_KEY
});

metroLayer.addTo(map);

// var map = new maplibregl.Map({
//     container: 'map', // container id
//     style: 'https://demotiles.maplibre.org/style.json', // style URL
//     center: [-118.25133692966446, 34.00095151499077], 
//     zoom: 10,
//     style: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`,
// });

function onMapLoad() {
    Promise.all([getData(getDestUrl), getData(getRecsUrl), getData(geojsonDataUrl)])
    // Promise.all([getData(getDestUrl), getData(getRecsUrl)])
    .then(results => {
        let destinations = results[0];
        let recommendations = results[1];
        let geojsonData = results[2].data;

        createLeafletLayers(geojsonData);
        console.log('Destinations: ' + destinations.length + ' Recommendations: ' + recommendations.length);
    })
    .catch(err => console.error(err));
}

// map.on('load', () => {
//     // new mapboxglEsriSources.TiledMapService('imagery-source', map, {
//     //     url: 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC5/MapServer'
//     // });

//     // map.addLayer({
//     //     id: 'imagery-layer',
//     //     type: 'raster',
//     //     source: 'imagery-source'
//     // })
    
//     Promise.all([getData(getDestUrl), getData(getRecsUrl), getData(geojsonDataUrl)])
//     // Promise.all([getData(getDestUrl), getData(getRecsUrl)])
//     .then(results => {
//         let destinations = results[0];
//         let recommendations = results[1];
//         let geojsonData = results[2].data;

//         createLeafletLayers(geojsonData);

//         // createMarkersSeparate(destinations, recommendations);

//         // map.addSource('destinations', { 
//         //     type: 'geojson', 
//         //     data: geojsonData
//         // });

//         // geojsonData.features.forEach(feature => {
//         //     let category = feature.properties['category_name'].replace(/ /g, '-').toLowerCase();
//         //     let iconPath = feature.properties['category_icon_file'];
//         //     let layerID = `poi-${category}`;

//         //     if (!map.getLayer(layerID)) {
//         //         map.addLayer({
//         //             id: layerID,
//         //             type: 'symbol',
//         //             source: 'destinations',
//         //             filter: ['==', 'category_name', category],
//         //             layout: {
//         //                 'icon-image': iconPath,
//         //                 'icon-overlap': 'always'
//         //             }
//         //         });

//         //         new maplibregl.Marker()
//         //             .setLngLat(feature.geometry.coordinates)
//         //             .addTo(map);

//         //         const input = document.createElement('input');
//         //         input.type = 'checkbox';
//         //         input.id = layerID;
//         //         input.checked = true;
//         //         filterGroup.appendChild(input);

//         //         const label = document.createElement('label');
//         //         label.setAttribute('for', layerID);
//         //         label.textContent = feature.properties['category_name'];
//         //         filterGroup.appendChild(label);

//         //         input.addEventListener('change', function(e) {
//         //             map.setLayoutProperty(layerID, 'visibility', e.target.checked ? 'visible' : 'none');
//         //         });
//         //     }

//         // });

//         console.log('Destinations: ' + destinations.length + ' Recommendations: ' + recommendations.length);
//     })
//     .catch(err => console.error(err));

//     // Promise.all([parseCSV(destinationsDataFile), parseCSV(recommendationsDataFile)])
//     // .then(results => {
//     //     // results[0] contains data from destinationsDataFile
//     //     // results[1] contains data from recommendationsDataFile
//     //     console.log('Parsed ' + results[0].length + ' destinations and ' + results[1].length + ' recommendations');

//     //     // Filter destinations for non-null coordinates and show = true        
//     //     let filteredDestinations = results[0].filter(function(row) {
//     //         return row.lat != null && row.lon != null && row.show === "TRUE";
//     //     });
        
//     //     console.log('Filtered out ' + filteredDestinations.length + ' destinations');
//     //     createMarkersLocal(filteredDestinations, results[1]);
//     // })
//     // .catch(err => console.error(err));

// });


function createLeafletLayers(data) {
    let layerGroups = {};
    data.features.forEach(feature => {
        if (feature.properties['category_name'] != null || feature.properties['category_name'] != '') {
            if (layerGroups[feature.properties['category_name']] == null) {
                let marker = createLeafletMarker(feature);

                let categoryLayer = L.layerGroup([marker]);
                categoryLayer.addTo(map);
                layerGroups[feature.properties['category_name']] = categoryLayer;
            } else {
                layerGroups[feature.properties['category_name']].addLayer(createLeafletMarker(feature));
            }
        }

        console.log(feature);
    });
    console.log(layerGroups);
    let layerControl = L.control.layers(null, layerGroups).addTo(map);
}

function createLeafletMarker(feature) {
    return L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]).bindPopup(feature.properties['google_place']);
}

function createMarkersSeparate(destinations, recommendations) {
    destinations.forEach(destination => {
        let popupContent = `<span class="popupDestination"><strong>${destination.google_place}</strong></span>`;
        let matchingRecommendations = recommendations.filter(recommendation => recommendation.google_place_id === destination.google_place_id);

        popupContent += `<div>`;

        if (matchingRecommendations.length > 0) {
            matchingRecommendations[0].recommendations.forEach(rec => {
                popupContent += `<p>"${rec.description}" <br><strong>- <em>${rec.first_name}</em></strong></p>`;
            });
        }
        popupContent += `</div>`;
        createMarker(destination, popupContent);
    });
}

// function createMarkersLambda(destinations) {
//     destinations.forEach(destination => {
//         let popupContent = `<strong>${destination.google_place}</strong>`;
//         let recommendations = destination.recommendations;

//         recommendations.forEach(recommendation => {
//             popupContent += `<p>"${recommendation.description}" <br>- <em>${recommendation.first_name}</em></p>`;
//         });

//         createMarker([destination.lon, destination.lat], popupContent);
//     });
// }

// function createMarkersLocal(destinations, recommendations) {
//     destinations.forEach(destination => {
//         let popupContent = `<strong>${destination.user_entered_place}</strong>`;

//         let matchingRecommendations = recommendations.filter(recommendation => recommendation.google_place_id === destination.google_place_id);

//         if (matchingRecommendations.length > 0) {
//             matchingRecommendations.forEach(recommendation => {
//                 popupContent += `<p>"${recommendation.description}" <br>- <em>${recommendation.first_name}</em></p>`;
//             });
//         }

//         createMarker([destination.lon, destination.lat], popupContent);
//     });
// }

function createMarker(destination, content) {
    let iconPath = destination['category_icon_file'];
    const popup = new maplibregl.Popup({offset: 25})
    .setHTML(content);

    // create a DOM element for the marker
    const el = document.createElement('div');
    const img = document.createElement('img');
    img.src = `../img/${iconPath}`;
    img.style.width = '24px';
    img.style.height = '24px';

    el.className = 'markerIcon';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.width = '30px';
    el.style.height = '30px';
    if (iconPath != 'marker.svg') {
        el.appendChild(img);
    }
    

    const marker = new maplibregl.Marker({element: el})
    .setLngLat([destination.lon, destination.lat])
    .setPopup(popup)
    .addTo(map);
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