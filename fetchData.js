/* Not needed with the AWS Lambda function implementation */
/* Keeping around for reference */

console.log('...fetching data...');

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const {Client} = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const tableName = 'Table 1'

var Airtable = require('airtable');
Airtable.configure({
	endpointUrl: 'https://api.airtable.com',
	apiKey: process.env.AIRTABLE_API_KEY
});

var base = Airtable.base('appkNbmPVo67w2uMt');

global.placeData = [];

base(tableName).select({
	view: "Grid view",
	pageSize: 100
}).eachPage(function page(records, fetchNextPage) {
	records.forEach(function(record) {
		let place = record.get('Place');
		let recordID = record.id;

		let placeRecord = {};
		placeRecord.name = place;
		placeRecord.location = {};

		client
		.findPlaceFromText({
			params: {
				input: place,
				inputtype: "textquery",
				locationbias: "ipbias",
				key: process.env.GOOGLE_MAPS_API_KEY
			},
			timeout: 1000
		}, axios)
		.then(r => {
			if (r.data.status == 'OK') {
				let placeID = r.data.candidates[0].place_id;
				client.geocode({
					params: {
						place_id: placeID,
						key: process.env.GOOGLE_MAPS_API_KEY
					},
					timeout: 1000
				}, axios)
				.then (r => {
					if (r.data.status == 'OK') {
						let location = r.data.results[0].geometry.location;
						let lat = location.lat;
						let lng = location.lng;

						placeRecord.location.lat = lat;
						placeRecord.location.lng = lng;
						global.placeData.push(placeRecord);
						fs.writeFile('src/data/places.json', JSON.stringify(global.placeData), err => {
							if (err) {
							  console.error(err);
							}
							// file written successfully
						  });

						base(tableName).update([
							{
								"id": recordID,
								"fields": {
									"lat": lat,
									"lng": lng
								}
							}
						], function (err, records) {
							if (err) {
								console.error(err);
								return;
							  }
						});
					}
				})
				.catch( e=> {
					console.log(e);
				});
			}
		})
		.catch (e => {
			console.log(e);
		});
    });
}, function done(err) {
	if (err) {
		console.error(err);
		return;
	}
});