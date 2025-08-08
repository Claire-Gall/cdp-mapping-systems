const map = new maplibregl.Map({
    container: 'map',
    style: 'style.json', // Or a valid URL to a working style
    zoom: 5,
    center: [108, 4]
});

map.addControl(new maplibregl.NavigationControl());

map.on('style.load', () => {
    map.setFog({});
});

map.on('load', () => {
    map.addSource('output_geojson_path', {
        type: 'geojson',
        data: 'output_geojson_path.geojson'
    });
});