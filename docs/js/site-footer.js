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

// Callback function for Google Map API
// as defined in src/_includes/default.liquid
function initMap() {
    console.log('Gmaps call returned');
    if (input !== null) {
        autocomplete = new google.maps.places.Autocomplete(input, options);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let form = document.getElementById('form')
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    document.getElementById('destination').addEventListener('input', handleInputChanged);
})

function handleInputChanged(event) {
    autocomplete.set('place',null);
}

function handleSubmit(event) {
    document.getElementById('confirmation').innerText = '';
    document.getElementById('saving').style.display = 'block';

    let google_place = autocomplete.getPlace();
    if (google_place == null || !google_place.geometry) {
        document.getElementById('destination').value = '';
        document.getElementById('confirmation').innerHTML = '<br><br>Please select a destination from the dropdown';
        document.getElementById('saving').style.display = 'none';
        event.preventDefault();
    } else {
        saveToAirtable();
        document.getElementById('destination').value = '';
        document.getElementById('first-name').value = '';
        document.getElementById('description').value = '';
        document.getElementById('category').value = '';
        autocomplete.set('place', null);
        event.preventDefault();
    }
}

function saveToAirtable() {
    let google_place = autocomplete.getPlace();
    if (google_place == null) {
        document.getElementById('destination').value = '';
        document.getElementById('confirmation').innerHTML = '<br><br>Please select a destination from the dropdown';
    } else if (!google_place.geometry) {
        document.getElementById('confirmation').innerHTML = '<br><br>Please select a destination from the dropdown';
        // document.getElementById('autocomplete').placeholder = 'Where do you want to go?';
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
        lambda_airtable_url += '&category=' + document.getElementById('category').value;
        
        console.log('Lambda write call: ' + lambda_airtable_url);

        postInsertData(lambda_airtable_url).then((data) => {
            console.log('write call return: ' + data);
            document.getElementById('saving').style.display = 'none';
            document.getElementById('confirmation').innerHTML = '<br><br>' + data + ' found via Google and added!';
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
