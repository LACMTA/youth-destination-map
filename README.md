# youth-destination-map

## Destinations

Attendees of the 2023 Youth Summit, the members of the 2024 Youth Council, and peers of the 2024 Youth council were asked to contribute destinations for this guide: places they like to visit, hidden gems that other teens should know about, etc.

The Google Places API is used to auto-suggest locations for contributors to choose from.

In 2024, we started asking contributors to provide their first name and the reason for their recommendation.

## Tech Stack

This website is built using 11ty and hosted on GitHub.

### Form Submissions

Destinations submitted through the form are passed to an AWS Lambda function, which will then store the data in an Airtable base.

The Airtable base has automations that will take the form inputs and separate the data into two separate tables: one for destinations, and one for recommendations.  Each recommendation is tied to a destination.

### Map

The map calls an AWS Lambda function that reads from the recommendations table in Airtable, and it returns JSON data that is an array of destination objects, each with an array of recommendations.

MapLibre is used to create the map, markers, and popups.  The basemap uses a hybrid vector/rastor basemap created by Metro to include rail lines, busways, and stations.

## Contributing

Suggestions on how improve the code and infrastructure on this project are always welcome!