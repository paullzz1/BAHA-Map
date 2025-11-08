mapboxgl.accessToken = 'pk.eyJ1IjoicGF1bGx6eiIsImEiOiJjbHNueGMxYWgwOHpvMmtuemEydHNmeDV4In0.JetyXo65-dGtsabt-mujBA';

// Initialize the map with a neutral base style
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11', // use standard style first
  center: [-122.2711, 37.8716], // Berkeley
  zoom: 13.5
});

// Create a variable to hold the currently open popup
let currentPopup = null;

map.on('load', () => {
  // Add your GeoJSON source
  map.addSource('points-data', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/paullzz1/BAHA-Map/refs/heads/main/data/183data.geojson'
  });

  // Neon Color layer for the points
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

  // Change cursor to pointer on hover
  map.on('mouseenter', 'points-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'points-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  // Reusable function to create and show a popup
  function createAndShowPopup(feature) {
    const props = feature.properties;
    const coordinates = feature.geometry.coordinates.slice();

    // Close the current popup if one exists
    if (currentPopup) {
      currentPopup.remove();
    }
    
    // Ensure popup appears at the correct longitude
    while (Math.abs(map.getCenter().lng - coordinates[0]) > 180) {
      coordinates[0] += map.getCenter().lng > coordinates[0] ? 360 : -360;
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

    currentPopup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 10,
      maxWidth: '300px'
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
      
    // Set a listener to nullify currentPopup when it's closed
    currentPopup.on('close', () => {
      currentPopup = null;
    });
  }

  // Build the interactive sidebar
  map.on('data', function buildSidebarOnDataLoad(e) {
    // Wait until the source is loaded and features are available
    if (e.sourceId === 'points-data' && e.isSourceLoaded && map.querySourceFeatures('points-data').length > 0) {
      
      const features = map.querySourceFeatures('points-data');
      const listings = document.getElementById('listings');
      listings.innerHTML = ''; // Clear any existing listings
      
      // Use a Map to store unique features by their ID, preventing duplicates
      const uniqueFeatures = new Map();
      features.forEach(feature => {
        const id = feature.id || JSON.stringify(feature.geometry.coordinates);
        if (!uniqueFeatures.has(id)) {
          uniqueFeatures.set(id, feature);
        }
      });

      // Sort features alphabetically by Landmark name
      const sortedFeatures = [...uniqueFeatures.values()].sort((a, b) => {
        const nameA = a.properties.Landmark || '';
        const nameB = b.properties.Landmark || '';
        return nameA.localeCompare(nameB);
      });

      for (const feature of sortedFeatures) {
        const props = feature.properties;
        const id = feature.id || JSON.stringify(feature.geometry.coordinates);

        const listingEl = document.createElement('div');
        listingEl.className = 'listing';
        listingEl.id = `listing-${id}`;

        // Add the listing's HTML content
        listingEl.innerHTML = `
          <h4>${props.Landmark || 'Unknown Landmark'}</h4>
          <p>${props.Address || 'N/A'}</p>
        `;

        // Add click event to the sidebar listing
        listingEl.addEventListener('click', () => {
          // 1. Fly to the point
          map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 17, // Zoom in closer
            speed: 0.8
          });

          // 2. Open the popup
          createAndShowPopup(feature);
        });

        listings.appendChild(listingEl);
      }
      
      // Remove this listener so it doesn't run again
      map.off('data', buildSidebarOnDataLoad);
    }
  });

  // Popup on map click
  map.on('click', 'points-layer', (e) => {
    if (e.features && e.features.length > 0) {
        createAndShowPopup(e.features[0]);
    }
  });
});

// --- Inject custom popup styles into the document head ---
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