mapboxgl.accessToken = 'pk.eyJ1IjoiY2xhaXJlLWdhbGwiLCJhIjoiY21kNmw1M2JtMDlqczJxcHR1NjMxZjA2NSJ9.4RsfacX1wV7fzgRQtJ2_lQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/claire-gall/cmdck3krn00ti01sa44zj056i', // cleaner style URL
    zoom: 2,
    center: [108, 4]
});

map.on('style.load', () => {
    map.setFog({});
});

map.on('load', () => {
    map.addSource('elevation-source', {
        type: 'geojson',
        data: 'output_path.geojson' // make sure this file exists and is valid
    });

    map.addLayer({
        id: 'elevation-layer',
        type: 'fill',
        source: 'elevation-source',
        paint: {
            'fill-color': 'yellow',
            'fill-opacity': 0.5
        }
    });
});