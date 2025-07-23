// Map and construction variables
let map, marker, currentLocation;
let buildingHeight = 0;
let buildingFloors = 0;
let originalSoilType = 'Unknown';
let slopeAngle = 0;
let selectedLocation = null; // Track the clicked location
// Add to script.js
let scene, camera, renderer;
function startApp() {
    // Animate fade-out and scale down welcome screen
    gsap.to('#welcome-screen', {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: 'power3.inOut',
      onComplete: () => {
        document.getElementById('welcome-screen').style.display = 'none';
        
        // Animate fade-in and scale up map section
        document.getElementById('map-section').classList.remove('hidden');
        gsap.fromTo(
          '#map-section',
          { opacity: 0, scale: 1.1 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.inOut',
            onComplete: initMap,
          }
        );
      },
    });
  }
  
function initialize3DView() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('threejs-container').appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
}

function generateBuildingModel() {
  // Create building geometry based on user inputs
  const geometry = new THREE.BoxGeometry(
    10, 
    buildingHeight * 3, // Scale for visualization
    10
  );
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x4caf50,
    wireframe: true
  });
  const building = new THREE.Mesh(geometry, material);
  scene.add(building);
  
  camera.position.set(20, 30, 20);
  camera.lookAt(0, 0, 0);
  
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}


function onMapClick(e) {
    if (marker) map.removeLayer(marker);
    
    marker = L.marker(e.latlng).addTo(map);
  
    // Animate marker drop using GSAP
    gsap.from(marker.getElement(), {
      y: -50, // Start above the map
      opacity: 0,
      duration: 0.5,
      ease: 'bounce.out', // Bouncy drop effect
    });
  
    determineTerrainFeatures(e.latlng.lat, e.latlng.lng);
    
    showBuildingPopup();
  }
  

// New reselect function
function initReselectButton() {
  document.getElementById('reselect-btn').addEventListener('click', () => {
    // Clear previous selection
    if (marker) map.removeLayer(marker);
    document.getElementById('building-popup').classList.add('hidden');
    
    // Show instructions
    L.popup()
      .setLatLng(map.getCenter())
      .setContent("Click a new location on the map")
      .openOn(map);
    
    // Reset form
    document.getElementById('height').value = '';
    document.getElementById('floors').value = '';
    document.getElementById('warning-msg').textContent = '';
  });
}

// Initialize in your DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // ... your existing code
  initReselectButton();
});
// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Welcome screen animation
    document.getElementById('start-btn').addEventListener('click', startApp);
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('change', toggleTheme);
    
    // Building submission
    document.getElementById('submit-building').addEventListener('click', submitBuilding);
    
    // Start construction button
    document.getElementById('go-to-builder').addEventListener('click', startConstruction);
});


function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function initMap() {
    map = L.map('map').setView([10.09, 77.03], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create control containers with proper positioning
    const topLeftControls = L.control({ position: 'topleft' });
    const topRightControls = L.control({ position: 'topright' });

    // Search controls (top-left)
    topLeftControls.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-control search-container');
        div.innerHTML = `
            <input type="text" id="search-input" placeholder="Search location...">
            <button id="search-btn" class="map-btn">
                <span class="btn-icon">🔍</span>
            </button>
        `;
        return div;
    };

    // GPS and theme controls (top-right)
    topRightControls.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-control gps-container');
        div.innerHTML = `
            
        `;
        return div;
    };

    // Add controls to map
    topLeftControls.addTo(map);
    topRightControls.addTo(map);

    // Event listeners
    document.getElementById('search-btn').addEventListener('click', searchLocation);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation();
    });
    document.getElementById('gps-btn').addEventListener('click', locateUser);

    // Map click handler
    map.on('click', onMapClick);
}


function searchLocation() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const result = data[0];
                map.setView([result.lat, result.lon], 15);
                
                // Simulate getting terrain data for this location
                setTimeout(() => {
                    determineTerrainFeatures(result.lat, result.lon);
                }, 1000);
            }
        })
        .catch(error => console.error('Search error:', error));
}

function locateUser() {
    const gpsBtn = document.getElementById('gps-btn');
    gpsBtn.innerHTML = '<span class="btn-icon">⌛</span><span class="btn-text">Locating...</span>';
    gpsBtn.classList.add('loading');
    
    map.locate({ 
        setView: true, 
        maxZoom: 16,
        enableHighAccuracy: true,
        timeout: 10000 // 10 seconds
    });
}

// Update map event handlers
map.on('locationfound', (e) => {
    const gpsBtn = document.getElementById('gps-btn');
    gpsBtn.innerHTML = '<span class="btn-icon">📍</span><span class="btn-text">Located</span>';
    gpsBtn.classList.remove('loading');
    
    currentLocation = e.latlng;
    determineTerrainFeatures(e.latlng.lat, e.latlng.lng);
    
    // Add accuracy circle
    if (this._accuracyCircle) {
        map.removeLayer(this._accuracyCircle);
    }
    this._accuracyCircle = L.circle(e.latlng, e.accuracy/2, {
        color: '#136AEC',
        fillColor: '#136AEC',
        fillOpacity: 0.15,
        weight: 1
    }).addTo(map);
    
    // Reset button after 3 seconds
    setTimeout(() => {
        gpsBtn.innerHTML = '<span class="btn-icon">📍</span><span class="btn-text">Locate Me</span>';
    }, 3000);
});

map.on('locationerror', (e) => {
    const gpsBtn = document.getElementById('gps-btn');
    gpsBtn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Error</span>';
    gpsBtn.classList.remove('loading');
    gpsBtn.classList.add('error');
    
    console.error("Location error:", e.message);
    
    // Show error to user
    L.popup()
        .setLatLng(map.getCenter())
        .setContent(`<b>Location Error</b><br>${e.message}`)
        .openOn(map);
    
    // Reset button after 5 seconds
    setTimeout(() => {
        gpsBtn.innerHTML = '<span class="btn-icon">📍</span><span class="btn-text">Locate Me</span>';
        gpsBtn.classList.remove('error');
    }, 5000);
});

async function getSoilType(lat, lon) {
  // ===================== MANUAL REGION OVERRIDES =====================
  const manualRegions = [
    // Dindigul (Black Soil)
    {
      name: "Dindigul",
      coordinates: [
        [10.36, 77.96], [10.38, 77.95], [10.35, 77.98] // Dindigul area coordinates
      ],
      soil: "Black Cotton ",
      threshold: 0.1 // Degree radius for match
    },
    // Palladam (Black Soil)
    {
      name: "Palladam",
      coordinates: [[10.95, 77.30]],
      soil: "Black Cotton ",
      threshold: 0.05
    },
    // Shimla (Loamy Soil)
    {
      name: "Shimla",
      coordinates: [[31.10, 77.15]],
      soil: "Loamy ",
      threshold: 0.2
    },
    // Major Deserts
    {
      name: "Thar Desert",
      bounds: { minLat: 24.0, maxLat: 30.0, minLon: 68.0, maxLon: 75.0 },
      soil: "Desert "
    },
    {
      name: "Sahara Desert",
      bounds: { minLat: 18.0, maxLat: 30.0, minLon: -18.0, maxLon: 40.0 },
      soil: "Desert "
    }
  ];

  // Check manual regions first
  for (const region of manualRegions) {
    // Check coordinate-based regions (Dindigul, Palladam, Shimla)
    if (region.coordinates) {
      const isMatch = region.coordinates.some(([rLat, rLon]) => 
        Math.abs(lat - rLat) < region.threshold && 
        Math.abs(lon - rLon) < region.threshold
      );
      if (isMatch) return region.soil;
    }
    // Check bounded regions (deserts)
    else if (region.bounds) {
      if (
        lat >= region.bounds.minLat && lat <= region.bounds.maxLat &&
        lon >= region.bounds.minLon && lon <= region.bounds.maxLon
      ) return region.soil;
    }
  }

  // ===================== SCIENTIFIC SOIL DETECTION =====================
  try {
    const response = await fetch(`https://rest.soilgrids.org/query?lon=${lon}&lat=${lat}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    const clay = data?.properties?.clay?.['0-5cm']?.mean;
    const sand = data?.properties?.sand?.['0-5cm']?.mean;
    const silt = data?.properties?.silt?.['0-5cm']?.mean;
    const organic = data?.properties?.oc?.['0-5cm']?.mean;

    // ==== Soil Classification Logic ====
    // 1. Check for Black Cotton Soil (Dindigul/Palladam already handled above)
    if (clay > 35 && silt < 40 && organic > 1.5) return "Black Cotton ";

    // 2. Check for Desert Soil
    if (sand > 85 && clay < 10 && organic < 1) return "Desert ";

    // 3. Standard USDA Classification
    if (clay >= 40) return "Clay";
    if (sand >= 70) return "Sandy";
    if (silt >= 80) return "Silt";
    if (clay >= 27 && sand <= 20) return "Clay Loam";
    if (sand >= 43 && clay <= 7) return "Loamy Sand";
    if (silt >= 50 && clay < 27) return "Silt Loam";
    if (clay < 27 && sand >= 45) return "Sandy Loam";
    
    return "Loam"; // Default
  } catch (error) {
    console.error("Soil API failed:", error);
    // ===================== CLIMATE FALLBACK =====================
    try {
      const response = await fetch(
        `https://power.larc.nasa.gov/api/temporal/climatology/point?latitude=${lat}&longitude=${lon}&parameters=PRECTOT&format=JSON`
      );
      const data = await response.json();
      const rainfall = data.properties.PRECTOT.annual;

      if (rainfall < 250) return "Desert ";
      if (rainfall > 1500) return "Clay";
      return "Loam";
    } catch {
      return "Loam"; // Ultimate fallback
    }
  }
}
// Replace determineTerrainFeatures() in script.js
async function determineTerrainFeatures(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    const data = await response.json();

    const elevation = data.results[0].elevation;
    slopeAngle = await calculateSlope(lat, lon); // ✅ LIVE SLOPE
    originalSoilType = await getSoilType(lat, lon); // ✅ LIVE SOIL
    soilType = originalSoilType;

    updatePreviewBox();
    console.log(`Terrain - Elevation: ${elevation}m, Slope: ${slopeAngle}°, Soil: ${soilType}`);
  } catch (error) {
    console.error('Terrain analysis failed:', error);
  
    try {
      slopeAngle = await calculateSlope(lat, lon);
    } catch (slopeErr) {
      console.error('Slope fallback failed:', slopeErr);
      slopeAngle = Math.floor(Math.random() * 31); // fallback
    }
  
    try {
      originalSoilType = await getSoilType(lat, lon);
      soilType = originalSoilType;
    } catch (soilErr) {
      console.error('Soil fallback failed:', soilErr);
      soilType = "Unknown";
    }

    updatePreviewBox(); // Still update preview with whatever data we got
  }
}


function updatePreviewBox() {
  const previewBox = document.getElementById('preview-box');
  if (!previewBox.classList.contains('hidden')) {
      document.getElementById('original-soil').textContent = originalSoilType;
      document.getElementById('current-soil').textContent = soilType;
      document.getElementById('slope-angle').textContent = `${slopeAngle}°`;
  }
}

function togglePreviewBox(show) {
  const previewBox = document.getElementById('preview-box');
  previewBox.classList.toggle('hidden', !show);
}
  
function onMapClick(e) {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    
    // Determine terrain features for clicked location
    determineTerrainFeatures(e.latlng.lat, e.latlng.lng);
    togglePreviewBox(true);
    
    // Show building input popup
    document.getElementById('building-popup').classList.remove('hidden');
    document.getElementById('building-popup').dataset.slope = slopeAngle;
    document.getElementById('building-popup').dataset.soil = soilType;
}

function submitBuilding() {
    buildingHeight = parseInt(document.getElementById('height').value);
    buildingFloors = parseInt(document.getElementById('floors').value);
    
    if (!buildingHeight || !buildingFloors) {
        document.getElementById('warning-msg').textContent = '⚠️ Please enter valid values';
        return;
    }
    
    // Check height against slope
    const maxHeightForSlope = 10 + (30 - slopeAngle) * 0.5; // Simple formula
    if (buildingHeight > maxHeightForSlope) {
        document.getElementById('warning-msg').textContent = `⚠️ Too tall for this slope! Max recommended: ${Math.floor(maxHeightForSlope)}m`;
        return;
    }
    
    document.getElementById('building-popup').classList.add('hidden');
    showSuggestions();
    const validationRules = {
        Clay: { maxHeight: 15 + (30 - slopeAngle) * 0.4, maxFloors: 4 },
        Sandy: { maxHeight: 12 + (30 - slopeAngle) * 0.3, maxFloors: 3 },
        Gravel: { maxHeight: 18 + (30 - slopeAngle) * 0.6, maxFloors: 5 },
        Rock: { maxHeight: 25 + (30 - slopeAngle) * 0.8, maxFloors: 8 }
      };
    
      const limits = validationRules[soilType] || validationRules.Clay;
      
      if (buildingHeight > limits.maxHeight || buildingFloors > limits.maxFloors) {
        showValidationError(
          `⚠️ Exceeds ${soilType} soil limits! Max: ${limits.maxHeight}m / ${limits.maxFloors} floors`
        );
        return;
      }
      
      showSuggestions();
    }
    
    function showValidationError(message) {
      const errorBox = document.createElement('div');
      errorBox.className = 'error-message';
      errorBox.innerHTML = `
        <span>🚨 ${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
      `;
      document.body.appendChild(errorBox);
    }


function showSuggestions() {
    const list = document.getElementById('suggestions-list');
    
    // Calculate footing dimensions based on building and terrain
    const footingDimensions = calculateFootingDimensions();
    const reinforcement = calculateReinforcement();
    
    list.innerHTML = `
        <li><b>Location Data:</b> ${soilType} soil, ${slopeAngle}° slope</li>
        <li><b>Recommended Foundation:</b> ${getFoundationType()}</li>
        <li><b>Footing Dimensions:</b> ${footingDimensions.width}m × ${footingDimensions.depth}m × ${footingDimensions.height}m</li>
        <li><b>Reinforcement:</b> ${reinforcement.bars}mm bars @ ${reinforcement.spacing}mm spacing</li>
        <li><b>Drainage:</b> ${getDrainageRecommendation()}</li>
        <li><b>Material Suggestions:</b> ${getMaterialRecommendations()}</li>
    `;
    
    document.getElementById('suggestion-box').classList.remove('hidden');
}

function calculateFootingDimensions() {
    // Base dimensions on building size and soil type
    const baseSize = 1.0 + (buildingHeight / 10) + (buildingFloors * 0.2);
    
    // Adjust for soil type
    let sizeMultiplier = 1.0;
    if (soilType === 'Clay') sizeMultiplier = 1.2;
    if (soilType === 'Sandy') sizeMultiplier = 1.1;
    if (soilType === 'Rock') sizeMultiplier = 0.9;
    
    // Adjust for slope
    const slopeAdjustment = 1 + (slopeAngle * 0.01);
    
    const width = Math.round((baseSize * sizeMultiplier * slopeAdjustment) * 10) / 10;
    const depth = Math.round((baseSize * sizeMultiplier * slopeAdjustment) * 10) / 10;
    const height = 0.5 + (buildingHeight * 0.05);
    
    return { width, depth, height };
}

function calculateReinforcement() {
    // Base reinforcement on building size
    let barSize = 10 + (buildingHeight / 3);
    let spacing = 150 - (buildingHeight * 2);
    
    // Adjust for soil type
    if (soilType === 'Clay') {
        barSize += 2;
        spacing -= 10;
    }
    if (soilType === 'Sandy') {
        barSize += 1;
        spacing -= 5;
    }
    
    // Ensure reasonable values
    barSize = Math.max(10, Math.min(20, Math.round(barSize)));
    spacing = Math.max(100, Math.min(200, Math.round(spacing)));
    
    return { bars: barSize, spacing };
}

function getFoundationType() {
    if (slopeAngle > 15) return 'Piled Foundation';
    if (soilType === 'Clay') return 'Raft Foundation';
    if (soilType === 'Sandy') return 'Strip Foundation';
    if (buildingHeight > 15 || buildingFloors > 3) return 'Deep Strip Foundation';
    return 'Pad Foundation';
}

function getDrainageRecommendation() {
    if (slopeAngle > 10) return 'Install French drains around perimeter';
    if (soilType === 'Clay') return 'Include sub-surface drainage system';
    return 'Standard perimeter drainage';
}

function getMaterialRecommendations() {
    let materials = [];
    
    if (soilType === 'Rock') materials.push('Stone masonry');
    if (soilType === 'Clay') materials.push('Reinforced concrete');
    if (buildingHeight > 10) materials.push('Steel frame construction');
    
    if (materials.length === 0) materials.push('Brick with concrete blocks');
    
    return materials.join(', ');
}

function startConstruction() {
    document.getElementById('suggestion-box').classList.add('hidden');
    document.getElementById('map-section').classList.add('hidden');
    document.getElementById('threejs-canvas').classList.remove('hidden');
    
    // Get the Three.js canvas element
    const canvas = document.getElementById('three-canvas');
    
    // If Three.js scene already exists, just update it
    if (window.constructionScene) {
        window.constructionScene.initConstruction(buildingHeight, buildingFloors);
        window.constructionScene.animateConstruction(buildingHeight, buildingFloors);
    } else {
        // Initialize Three.js scene for the first time
        import('./three-scene.js').then(module => {
            window.constructionScene = new module.ConstructionScene(canvas);
            window.constructionScene.initConstruction(buildingHeight, buildingFloors);
            window.constructionScene.animateConstruction(buildingHeight, buildingFloors);
        });
    }
}
// Close button functionality
document.querySelector('.close-btn')?.addEventListener('click', () => {
  document.getElementById('plan-overlay').style.display = 'none';
});