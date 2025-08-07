const { MapboxOverlay, PolygonLayer, ScatterplotLayer, LineLayer } = deck;

async function loadGeoJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

let currentMode = "elevation"; // "elevation" or "slope values"
let nodes, elevation_edges, slope_edges;
let map, deckOverlay;
let layer_spacing = 1000;
let n_layers = 8;

const layerToggles = {
  showElevation: true,
  showSlopes: true,
  showNodes: true,
  showEdges: true,
  invertLayers: false,
};

let autoRotate = true;
let rotateInterval = null;
let inactivityTimeout = null;
const ROTATE_SPEED = 0.2; // degrees per frame
const ROTATE_INTERVAL_MS = 40; // ms between frames
const ROTATE_RESUME_DELAY = 30000; // 30 seconds

//elevation and slope layers

// Update elevation by user input slider for layer spacing
const get_elevation = (cluster) => {
  const baseline = 2000;
  if (layerToggles.invertLayers) {
    return (cluster + 1) * layer_spacing + baseline;
  }
  return (n_layers - cluster) * layer_spacing + baseline;
};

const lightenColor = (color, amount = 0.5) => {
  // color: [r, g, b] or [r, g, b, a]
  return [
    Math.round(color[0] + (255 - color[0]) * amount),
    Math.round(color[1] + (255 - color[1]) * amount),
    Math.round(color[2] + (255 - color[2]) * amount),
    color.length > 3 ? color[3] : 255,
  ];
};

function elevationLayer(mode) {
  const color = `${mode}_color`;
  return new PolygonLayer({
    id: `elevation-${mode}`,
    data: [...elevation_edges.features],
    getPolygon: (f) => {
      const coords = f.geometry.coordinates;
      if (f.geometry.type === "Polygon") return coords;
      if (f.geometry.type === "MultiPolygon") return coords[0];
      return [];
    },
    getFillColor: (f) => [...f.properties[color], 200], // add alpha
    extruded: true,
    getElevation: (f) => (f.properties.num_floors || 1) * 14,
    pickable: true,
    stroked: false,
  });
}

function slopeLayer(mode) {
  const color = `${mode}_color`;
  return new PolygonLayer({
    id: "slope",
    data: [...slope_edges.features],
    getPolygon: (f) => {
      const coords = f.geometry.coordinates;
      if (f.geometry.type === "Polygon") return coords;
      if (f.geometry.type === "MultiPolygon") return coords[0];
      return [];
    },
    getFillColor: (f) => f.properties[color],
    pickable: true,
    extruded: false,
    stroked: true,
    getLineColor: [0, 0, 0, 200],
    lineWidthMinPixels: 1,
  });
}

function getLayers(mode) {
  const layers = [];
  if (layerToggles.showBlocks) layers.push(elevationLayer(mode));
  if (layerToggles.showBuildings) layers.push(slopeLayer(mode));
  return layers;
}

// Checkbox event listeners
[
  "showElevation",
  "showSlopes",
  "invertLayers",
].forEach((id) => {
  document.getElementById(id).addEventListener("change", (e) => {
    layerToggles[id] = e.target.checked;
    console.log(`${id} is now:`, layerToggles[id]);

    if (deckOverlay) {
      console.log("Updating layers with current mode:", currentMode);

      deckOverlay.setProps({ layers: getLayers(currentMode) });
    }
  });
});

// --------------------- event listeners  ---------------------

document.getElementById("spatialToggle").addEventListener("click", () => {
  currentMode = "spatial";
  document.getElementById("spatialToggle").classList.add("active");
  document.getElementById("semanticToggle").classList.remove("active");
  if (deckOverlay) deckOverlay.setProps({ layers: getLayers(currentMode) });
});
document.getElementById("semanticToggle").addEventListener("click", () => {
  currentMode = "semantic";
  document.getElementById("semanticToggle").classList.add("active");
  document.getElementById("spatialToggle").classList.remove("active");
  if (deckOverlay) deckOverlay.setProps({ layers: getLayers(currentMode) });
});
document.getElementById("layerSpacingSlider").addEventListener("input", (e) => {
  layer_spacing = Number(e.target.value);
  if (deckOverlay) deckOverlay.setProps({ layers: getLayers(currentMode) });
});

// Initialize the map and layers
async function initMap() {
  elevation = await loadGeoJSON("webmap-geodata/blocks.geojson");
  slope = await loadGeoJSON("webmap-geodata/buildings.geojson");
  elevation_edges = await loadGeoJSON(
    "webmap-geodata/spatial_network_edges.geojson"
  );
  slope_edges = await loadGeoJSON(
    "webmap-geodata/semantic_network_edges.geojson"
  );

  map = new maplibregl.Map({
    container: "map",
    style: "dark_matter.json",
    center: [-73.97, 40.8],
    zoom: 11,
    pitch: 90,
    antialias: true,
  });

  map.on("style.load", () => {
    map.getStyle().layers.forEach((layer) => {
      if (
        layer.type === "symbol" ||
        (layer.layout && layer.layout["text-field"])
      ) {
        map.setLayoutProperty(layer.id, "visibility", "none");
      }
    });
    deckOverlay = new MapboxOverlay({
      layers: getLayers(currentMode),
    });
    map.addControl(deckOverlay);
  });
}

initMap().then(setupRotationListeners);