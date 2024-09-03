const ESRI_KEY =  "AAPTxy8BH1VEsoebNVZXo8HurCIBEXS58hLwaInNH7mnZeFDQtLv6ne8Ndu9F_uhRYlcgNlUzxSJ_3aIRhlZ66ITzLy3TN5caX3Hy_d4OuX-_TgcTi4qxk0AgsLvM8fyZ8bhzUwQk6V_ZLbS3q4bR1RnQV1KOJgHzPtISbiVgOzCQfa27tEurkpQRQCDmSlDxaq1hkcD60THn0eKEMUIPvv0VGV1PEA2-5YA7Ua-iJX5yV4.AT1_YiClAvyL";
const basemapEnum = "65aff2873118478482ec3dec199e9058";

const basemapStyle = `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/items/${basemapEnum}?token=${ESRI_KEY}`;
const mapImagery = 'https://tiles.arcgis.com/tiles/TNoJFjk1LsD45Juj/arcgis/rest/services/Map_RGB_Vector_Offset_RC5/MapServer';

const geojsonDataUrl = 'https://gxu5ffy7xp2gmvdv45yeucj4le0cilzk.lambda-url.us-west-1.on.aws/';

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

function onMapLoad() {
    Promise.all([getData(geojsonDataUrl)])
    .then(results => {
        let geojsonData = results[0].data;

        createLeafletLayers(geojsonData);
    })
    .catch(err => console.error(err));
}

let categoryIcons = {};

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
    });
    let layerControl = L.control.layers(null, layerGroups).addTo(map);
}

function createLeafletMarker(feature) {
    if (categoryIcons[feature.properties['category_name']] == null) {
        categoryIcons[feature.properties['category_name']] = L.icon({
            iconUrl: `./img/${feature.properties['category_icon_file']}`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }
    return L.marker(
        [feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 
        {icon: categoryIcons[feature.properties['category_name']]})
    .bindPopup(createLeafletPopup(feature));
}

function createLeafletPopup(feature) {
    let popupContent = document.createElement('div');

    let title = document.createElement('span');
    title.className = 'popupDestination';
    title.innerHTML = `${feature.properties['google_place']}<br>`;

    let link = document.createElement('a');
    link.href = 'https://www.google.com/maps/search/?api=1&query=Google&query_place_id=' + feature.properties['google_place_id'];
    link.target = '_blank';
    link.innerHTML = '(Get directions on Google Maps)';
    
    let recommendationList = document.createElement('div');

    feature.properties['recommendations'].forEach(recommendation => {
        let rec = document.createElement('p');
        rec.innerHTML = `"${recommendation.description}"<br><strong>- <em>${recommendation.first_name}</em></strong>`;
        recommendationList.appendChild(rec);
    });

    popupContent.appendChild(title);
    popupContent.appendChild(link);
    popupContent.appendChild(recommendationList);

    return popupContent;
}
