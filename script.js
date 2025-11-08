mapboxgl.accessToken = 'pk.eyJ1IjoicGF1bGx6eiIsImEiOiJjbHNueGMxYWgwOHpvMmtuemEydHNmeDV4In0.JetyXo65-dGtsabt-mujBA';

// Initialize the map with a neutral base style
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11', // use standard style first
  center: [-122.2711, 37.8716], // Berkeley
  zoom: 13.5
});

map.on('load', () => {
  // Add your GeoJSON source
  map.addSource('points-data', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/paullzz1/BAHA-Map/refs/heads/main/data/183data.geojson'
  });

  // Add NEON circle layer
  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: 'points-data',
    paint: {
      'circle-color': '#39ff14',          // bright neon green
      'circle-radius': 6,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.95,
      'circle-blur': 0.05
    }
  });

  // Hover cursor
  map.on('mouseenter', 'points-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'points-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  // Popup on click
  map.on('click', 'points-layer', (e) => {
    const feature = e.features[0];
    const coordinates = feature.geometry.coordinates.slice();
    const props = feature.properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const html = `
      <div class="popup-content">
        <h3>${props.Landmark || 'Unknown Landmark'}</h3>
        <p><strong>Address:</strong> ${props.Address || 'N/A'}</p>
        <p><strong>Architect & Date:</strong> ${props.Architect_Date || 'N/A'}</p>
        <p><strong>Designated:</strong> ${props.Designated || 'N/A'}</p>
        ${props.Link ? `<p><a href="${props.Link}" target="_blank">More Information ↗</a></p>` : ''}
        ${props.Notes ? `<p class="notes"><strong>Notes:</strong> ${props.Notes}</p>` : ''}
      </div>
    `;

    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 10,
      maxWidth: '300px'
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
  });
});

// --- Popup styles ---
const style = document.createElement('style');
style.textContent = `
  .mapboxgl-popup-content {
    background: rgba(28, 28, 30, 0.98);
    color: #f5f5f5;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
    font-family: 'Inter', sans-serif;
    padding: 14px 18px;
    opacity: 0;
    transform: translateY(5px);
    animation: popupFadeIn 0.25s ease-out forwards;
  }

  .mapboxgl-popup-tip {
    border-top-color: rgba(28, 28, 30, 0.98) !important;
  }

  .popup-content h3 {
    margin: 0 0 6px 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  .popup-content p {
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .popup-content a {
    color: #00FFFF;
    text-decoration: none;
    font-weight: 500;
  }

  .popup-content a:hover {
    text-decoration: underline;
  }

  .popup-content .notes {
    margin-top: 8px;
    font-style: italic;
    color: #cccccc;
  }

  @keyframes popupFadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
