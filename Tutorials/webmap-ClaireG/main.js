var map = new maplibregl.Map({
    container: 'map', // container id
    style: 'style.json', // style URL for basemap
    center: [-73.97144, 40.70491], // starting position [lng, lat]
    zoom: 10 // starting zoom
});
map.addControl(new maplibregl.NavigationControl());
// Fetch pizza restaurant data from the NYC Open Data API
const jsonFeatures = fetch(
    "https://data.cityofnewyork.us/resource/43nn-pn8j.geojson?cuisine_description=Pizza&$limit=10000"
)
    .then((response) => response.json())
    .then((data) => {
        data.features.forEach((feature) => {
            feature.geometry = {
                type: "Point",
                coordinates: [
                    Number(feature.properties.longitude),
                    Number(feature.properties.latitude),
                ],
            };
            map.on('load', () => {
            map.addSource('restaurants', {
        type: 'geojson',
        data: data
        });

        map.addLayer({
            'id': 'restaurants-layer',
            'type': 'circle',
            'source': 'restaurants',
            paint: {
                "circle-radius": 6,
                "circle-stroke-width": 2,
                "circle-color": "#ff7800",
                "circle-stroke-color": "white",
            }
        });
    map.on("click", "restaurants-layer", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.dba
        new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });
    });
})}
.catch((error) => console.error("Error fetching data:", error));

const { createClient } = window.supabase;
const supabaseUrl = 'https://gaakyqheoetpsezponfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYWt5cWhlb2V0cHNlenBvbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTM2NjMsImV4cCI6MjA2ODk2OTY2M30.Klpf-yFHgP5uR8nR3LqwIWA_KbDMMhJQxU6kw2s7tMA';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function querySupabase() {
    const { data, error } = await supabaseClient
        .from("pizza res inspection1")
        .select("*")
        .limit(100);

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log("Data fetched successfully:", data);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    querySupabase();
});

async function queryWithinDistance(point, n = 1000) {
        const { data, error } = await supabaseClient.rpc(
        "find_nearest_n_restaurants",
        {
            lat: point[1],
            lon: point[0],
            n: n,
        }
        );

        if (error) {
        console.error("Error fetching nearest points:", error);
        } else {
        console.log("Nearest points fetched successfully:", data);
        map.addLayer({
            'id': 'proximity-layer',
            'type': 'square',
            'source': 'pizza-place',
            paint: {
                "square-radius": 4,
                "square-stroke-width": 2,
                "square-color": "#343BA0",
                "square-stroke-color": "midnight blue",
            }
        });
        map.on("click", "proximity-layer", (e) => {
            const coordinates = e.features [0].geometry.coordinates.slice();
            const description = e.features [0].properties.dba
            new maplibregl.Popup ()
            .setLngLat (coordinates)
            .setHTML (description)
            .addTo(map);
        })
    };
        map.on("click", (e) => {
            const point = [e.lngLat.lng, e.lngLat.lat];
            queryWithinDistance(point, 1000);
});
}