"use strict";

function loadData () {
  fetch("corona-testungen-muenster-geo.json")
    .then(function (response) {
      return response.json();
    })
    .then(initMap);
}

function onEachFeature(feature, layer) {
  var popupContent = '<h5 class="popup-headline">'
    + feature.properties.name + "</h5>"
    + '<p class="popup-address">' + feature.properties.address + ", " + feature.properties.info + "</p>";

  var tooltipContent = feature.properties.name;

  layer.bindPopup(popupContent);
  layer.bindTooltip(tooltipContent);
}

function initMap(data) {
  var map = L.map("map").setView([51.9601, 7.5939], 12);
  window.lmap = map;

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png", {
    maxZoom: 16,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    id: "mapbox.light"
  }).addTo(map);

  var dataLayer = L.geoJSON(data, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: "#3273dc",
        color: "#5d5d5d",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    }
  }).addTo(map);

  map.fitBounds(dataLayer.getBounds(), { padding: [ 1, 1 ] });
}

window.addEventListener("DOMContentLoaded", loadData);
