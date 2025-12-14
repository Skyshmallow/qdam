class TerritoryConquest {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.currentPath = [];
        this.currentPolyline = null;
        this.isWalking = false;
        this.watchId = null;
        this.totalDistance = 0;
        this.todayDistance = 0;
        this.dailyLimit = 5000; // 5km in meters
        this.conqueredArea = 0; // Total conquered area in m²
        this.conqueredPolygon = null; // Single merged territory polygon
        this.lastPosition = null;
        this.debugMode = window.location.hash === '#debug';
        this.keyboardModeEnabled = false;
        this.debugLogging = false;
        this.lastCaptureAttempt = 0; // Prevent spam captures
        
        this.init();
    }

    async init() {
        try {
            // Register service worker
            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/sw.js');
            }

            // Initialize map
            await this.initMap();
            
            // Load saved data
            this.loadData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateUI();
            
            document.getElementById('loading').style.display = 'none';
        } catch (error) {
            this.showError('Failed to initialize app: ' + error.message);
        }
    }

    async initMap() {
        // Get user's current position
        const position = await this.getCurrentPosition();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Initialize map
        this.map = L.map('map').setView([lat, lng], 16);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add user marker
        this.userMarker = L.circleMarker([lat, lng], {
            color: '#2196F3',
            fillColor: '#2196F3',
            fillOpacity: 0.8,
            radius: 8
        }).addTo(this.map);

        // Load existing conquered area
        this.loadConqueredArea();
        
        // Add debug controls if in debug mode
        if (this.debugMode) {
            this.addDebugControls();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    setupEventListeners() {
        const startStopBtn = document.getElementById('startStopBtn');
        startStopBtn.addEventListener('click', () => {
            if (this.isWalking) {
                this.stopWalking();
            } else {
                this.startWalking();
            }
        });
    }



    async startWalking() {
        if (this.todayDistance >= this.dailyLimit) {
            this.showError('Daily limit reached! Come back tomorrow.');
            return;
        }

        try {
            this.isWalking = true;
            this.currentPath = [];
            
            // Get initial position
            const position = await this.getCurrentPosition();
            const latLng = [position.coords.latitude, position.coords.longitude];
            
            this.lastPosition = position;
            this.currentPath.push(latLng);
            
            // Update user marker position
            this.userMarker.setLatLng(latLng);
            this.map.panTo(latLng);

            // Start watching position (only if not in keyboard mode)
            if (!this.keyboardModeEnabled) {
                this.watchId = navigator.geolocation.watchPosition(
                    (position) => this.onPositionUpdate(position),
                    (error) => this.onPositionError(error),
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 1000
                    }
                );
            }

            // Create polyline for current path
            this.currentPolyline = L.polyline(this.currentPath, {
                color: '#FF5722',
                weight: 4,
                opacity: 0.8
            }).addTo(this.map);

            this.updateUI();
        } catch (error) {
            this.showError('Failed to start walking: ' + error.message);
            this.isWalking = false;
        }
    }

    stopWalking() {
        this.isWalking = false;
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        // Check if path forms a closed loop and capture territory
        if (this.currentPath.length > 3) {
            this.checkAndCaptureTerritory();
        }

        this.updateUI();
        this.saveData();
    }

    onPositionUpdate(position) {
        if (!this.isWalking) return;

        const latLng = [position.coords.latitude, position.coords.longitude];
        
        // Calculate distance from last position
        if (this.lastPosition) {
            const distance = this.calculateDistance(
                this.lastPosition.coords.latitude,
                this.lastPosition.coords.longitude,
                position.coords.latitude,
                position.coords.longitude
            );

            // Only add point if moved at least 5 meters (to reduce noise)
            if (distance >= 5) {
                this.debugLog(`Movement detected: ${distance.toFixed(1)}m`);
                
                // Check if new position is inside conquered territory
                const insideTerritory = this.isInsideConqueredTerritory(latLng);
                this.debugLog(`Inside conquered territory: ${insideTerritory}`);
                
                if (insideTerritory) {
                    // Don't add to path if inside conquered area - just update position and distance
                    this.todayDistance += distance;
                    this.userMarker.setLatLng(latLng);
                    this.map.panTo(latLng);
                    this.lastPosition = position;
                    this.debugLog('Not drawing path - inside conquered territory');
                    this.updateUI();
                    return;
                }
                
                // We're outside conquered territory, so add to path
                this.todayDistance += distance;
                this.currentPath.push(latLng);
                this.debugLog(`Added point to path. Total points: ${this.currentPath.length}`);
                
                // Update polyline (create new one if needed)
                if (!this.currentPolyline) {
                    this.currentPolyline = L.polyline(this.currentPath, {
                        color: '#FF5722',
                        weight: 4,
                        opacity: 0.8
                    }).addTo(this.map);
                } else {
                    this.currentPolyline.setLatLngs(this.currentPath);
                }
                
                // Update user marker
                this.userMarker.setLatLng(latLng);
                this.map.panTo(latLng);
                
                this.lastPosition = position;
                
                // Check if we've closed a loop
                this.checkForClosedLoop();
                
                // Check daily limit
                if (this.todayDistance >= this.dailyLimit) {
                    this.stopWalking();
                    this.showError('Daily limit reached! Walk completed automatically.');
                }
                
                this.updateUI();
            }
        }
    }

    debugLog(message) {
        if (!this.debugLogging || !this.debugMode) return;
        
        const logElement = document.getElementById('debugLog');
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString();
            logElement.innerHTML += `${timestamp}: ${message}<br>`;
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    onPositionError(error) {
        console.error('Position error:', error);
        this.showError('GPS error: ' + error.message);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    checkForClosedLoop() {
        if (this.currentPath.length < 5) {
            this.debugLog('Path too short to check for loop');
            return;
        }

        const currentPoint = this.currentPath[this.currentPath.length - 1];
        this.debugLog(`Checking loop for point: [${currentPoint[0].toFixed(6)}, ${currentPoint[1].toFixed(6)}]`);

        // Method 1: Check if we're close to the starting point
        const startPoint = this.currentPath[0];
        const distanceToStart = this.calculateDistance(
            startPoint[0], startPoint[1],
            currentPoint[0], currentPoint[1]
        );
        
        this.debugLog(`Distance to start: ${distanceToStart.toFixed(1)}m`);
        
        if (distanceToStart <= 25 && this.currentPath.length >= 8) {
            // Prevent spam capture attempts (wait at least 2 seconds between attempts)
            const now = Date.now();
            if (now - this.lastCaptureAttempt < 2000) {
                this.debugLog('CAPTURE COOLDOWN: Too soon since last attempt');
                return;
            }
            
            this.debugLog('LOOP DETECTED: Close to starting point');
            this.lastCaptureAttempt = now;
            this.captureTerritory();
            return;
        }

        // Method 2: Check if we've intersected with any existing conquered territory boundary
        if (this.conqueredTerritories && this.conqueredTerritories.length > 0) {
            for (let i = 0; i < this.conqueredTerritories.length; i++) {
                const territory = this.conqueredTerritories[i];
                
                // Check if current point is very close to any boundary point of existing territory
                for (const boundaryPoint of territory.coords) {
                    const distanceToBoundary = this.calculateDistance(
                        boundaryPoint[0], boundaryPoint[1],
                        currentPoint[0], currentPoint[1]
                    );
                    
                    if (distanceToBoundary <= 15) {
                        // Prevent spam capture attempts
                        const now = Date.now();
                        if (now - this.lastCaptureAttempt < 2000) {
                            this.debugLog('CAPTURE COOLDOWN: Too soon since last attempt');
                            return;
                        }
                        
                        this.debugLog(`LOOP DETECTED: Connected to existing territory boundary (${distanceToBoundary.toFixed(1)}m)`);
                        this.lastCaptureAttempt = now;
                        this.captureTerritory();
                        return;
                    }
                }
            }
        }
        
        this.debugLog('No loop detected');
    }

    checkAndCaptureTerritory() {
        // This is called when STOP is pressed
        this.debugLog('Manual capture check on STOP');
        this.checkForClosedLoop();

        // Remove current path polyline
        if (this.currentPolyline) {
            this.map.removeLayer(this.currentPolyline);
            this.currentPolyline = null;
        }
    }

    captureTerritory() {
        this.debugLog('=== CAPTURE TERRITORY ATTEMPT ===');
        
        // Create a closed polygon
        const closedPath = [...this.currentPath];
        this.debugLog(`Path length: ${closedPath.length} points`);
        
        if (closedPath.length < 4) {
            this.debugLog('CAPTURE FAILED: Path too short');
            return;
        }

        // Calculate area of new territory in square meters
        const newArea = this.calculatePolygonAreaInSquareMeters(closedPath);
        this.debugLog(`Calculated area: ${newArea.toFixed(1)} m²`);
        
        // Minimum area check (prevent tiny captures)
        if (newArea < 50) {
            this.debugLog('CAPTURE FAILED: Area too small - continuing path');
            this.showError(`Territory too small: ${newArea.toFixed(1)} m² (minimum 50 m²) - keep walking!`);
            // Don't clear the path - let user continue walking to make it bigger
            return;
        }

        // Create the new territory polygon
        const newPolygon = L.polygon(closedPath, {
            color: '#4CAF50',
            fillColor: '#4CAF50',
            fillOpacity: 0.3,
            weight: 2
        }).addTo(this.map);
        
        // Initialize territories array if needed
        if (!this.conqueredTerritories) {
            this.conqueredTerritories = [];
        }
        
        // Add new territory
        this.conqueredTerritories.push({
            polygon: newPolygon,
            coords: closedPath,
            area: newArea
        });
        
        // Set first territory as main polygon for compatibility
        if (!this.conqueredPolygon) {
            this.conqueredPolygon = newPolygon;
        }
        
        // Update total area
        this.conqueredArea += newArea;

        this.debugLog(`CAPTURE SUCCESS: +${newArea.toFixed(1)} m²`);
        this.debugLog(`Total conquered area: ${this.conqueredArea.toFixed(1)} m²`);

        // Clear current path and remove path line
        this.clearCurrentPath();
        
        // Save data
        this.saveData();

        // Show success message
        this.showSuccess(`Territory captured! +${this.formatArea(newArea)} 🏴`);
    }

    clearCurrentPath() {
        this.currentPath = [];
        if (this.currentPolyline) {
            this.map.removeLayer(this.currentPolyline);
            this.currentPolyline = null;
        }
        this.debugLog('Path cleared');
    }

    calculatePolygonAreaInSquareMeters(path) {
        if (path.length < 3) return 0;

        // Convert lat/lng coordinates to area in square meters
        // Using spherical excess formula for more accurate area calculation
        let area = 0;
        const R = 6371000; // Earth's radius in meters

        for (let i = 0; i < path.length; i++) {
            const j = (i + 1) % path.length;
            const lat1 = path[i][0] * Math.PI / 180;
            const lat2 = path[j][0] * Math.PI / 180;
            const deltaLng = (path[j][1] - path[i][1]) * Math.PI / 180;

            const E = 2 * Math.atan2(Math.tan(deltaLng / 2), (1 / Math.tan(lat1 / 2)) + (1 / Math.tan(lat2 / 2)));
            area += E;
        }

        return Math.abs(area * R * R / 2);
    }

    loadConqueredArea() {
        try {
            // Load conquered area
            const savedArea = localStorage.getItem('territoryConquest_conqueredArea');
            if (savedArea) {
                this.conqueredArea = parseFloat(savedArea);
            }

            // Load conquered territories
            const savedTerritories = localStorage.getItem('territoryConquest_conqueredTerritories');
            if (savedTerritories) {
                const territoriesData = JSON.parse(savedTerritories);
                this.conqueredTerritories = [];
                
                territoriesData.forEach((territoryData, index) => {
                    const polygon = L.polygon(territoryData.coords, {
                        color: '#4CAF50',
                        fillColor: '#4CAF50',
                        fillOpacity: 0.3,
                        weight: 2
                    }).addTo(this.map);
                    
                    this.conqueredTerritories.push({
                        polygon: polygon,
                        coords: territoryData.coords,
                        area: territoryData.area
                    });
                    
                    // Set the first one as the main conquered polygon for compatibility
                    if (index === 0) {
                        this.conqueredPolygon = polygon;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading conquered area:', error);
        }
    }

    updateUI() {
        // Update button
        const btn = document.getElementById('startStopBtn');
        const btnText = document.getElementById('btnText');
        const btnDistance = document.getElementById('btnDistance');
        
        if (this.isWalking) {
            btn.classList.add('stop');
            btnText.textContent = 'STOP';
            btnDistance.textContent = `${(this.todayDistance / 1000).toFixed(1)} km`;
        } else {
            btn.classList.remove('stop');
            btnText.textContent = 'START';
            btnDistance.textContent = '';
        }

        // Update progress ring
        const progressRing = document.querySelector('.progress-ring__progress');
        const circumference = 2 * Math.PI * 60; // radius = 60
        const progress = Math.min(this.todayDistance / this.dailyLimit, 1);
        const offset = circumference - (progress * circumference);
        progressRing.style.strokeDashoffset = offset;

        // Update stats
        document.getElementById('todayDistance').textContent = 
            `${(this.todayDistance / 1000).toFixed(1)} km`;
        document.getElementById('territoryCount').textContent = this.formatArea(this.conqueredArea);
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.style.background = '#4CAF50';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.style.background = '#f44336';
        }, 3000);
    }

    formatArea(areaInSquareMeters) {
        if (areaInSquareMeters < 10000) {
            return `${Math.round(areaInSquareMeters)} m²`;
        } else {
            return `${(areaInSquareMeters / 1000000).toFixed(2)} km²`;
        }
    }

    isInsideConqueredTerritory(latLng) {
        if (!this.conqueredTerritories || this.conqueredTerritories.length === 0) {
            return false;
        }

        // Check if point is inside any conquered territory
        for (const territory of this.conqueredTerritories) {
            if (this.isPointInPolygon(latLng, territory.coords)) {
                return true;
            }
        }
        return false;
    }

    isPointInPolygon(point, polygon) {
        const [lat, lng] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [lati, lngi] = polygon[i];
            const [latj, lngj] = polygon[j];

            if (((lngi > lng) !== (lngj > lng)) &&
                (lat < (latj - lati) * (lng - lngi) / (lngj - lngi) + lati)) {
                inside = !inside;
            }
        }

        return inside;
    }

    loadData() {
        try {
            // Load today's distance
            const today = new Date().toDateString();
            const savedDate = localStorage.getItem('territoryConquest_date');
            
            if (savedDate === today) {
                this.todayDistance = parseFloat(localStorage.getItem('territoryConquest_todayDistance') || '0');
            } else {
                // New day, reset distance
                this.todayDistance = 0;
                localStorage.setItem('territoryConquest_date', today);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('territoryConquest_todayDistance', this.todayDistance.toString());
            localStorage.setItem('territoryConquest_conqueredArea', this.conqueredArea.toString());
            localStorage.setItem('territoryConquest_date', new Date().toDateString());
            
            // Save conquered territories
            if (this.conqueredTerritories && this.conqueredTerritories.length > 0) {
                const territoriesData = this.conqueredTerritories.map(territory => ({
                    coords: territory.coords,
                    area: territory.area
                }));
                localStorage.setItem('territoryConquest_conqueredTerritories', JSON.stringify(territoriesData));
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    addDebugControls() {
        // Add debug panel
        const debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 1001;
            font-size: 14px;
            min-width: 200px;
        `;
        debugPanel.innerHTML = `
            <h3>🐛 Debug Mode</h3>
            <div style="margin: 10px 0;">
                <label>
                    <input type="checkbox" id="debugKeyboardMode"> Use Arrow Keys (No GPS)
                </label>
            </div>
            <div style="margin: 10px 0;">
                <label>
                    <input type="checkbox" id="debugLogging"> Show Debug Logs
                </label>
            </div>
            <button id="debugCapture" style="width: 100%; margin: 5px 0; padding: 8px;">Test Capture</button>
            <button id="debugReset" style="width: 100%; margin: 5px 0; padding: 8px; background: #f44336;">Reset All Data</button>
            <div id="debugLog" style="margin-top: 10px; font-size: 10px; background: #333; color: #0f0; padding: 5px; border-radius: 3px; max-height: 200px; overflow-y: auto; display: none;"></div>
            <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                Check the box above, then use ↑↓←→ arrow keys to move around the map
            </div>
        `;
        document.body.appendChild(debugPanel);

        // Add debug event listeners
        document.getElementById('debugCapture').addEventListener('click', () => {
            this.simulateCapture();
        });

        document.getElementById('debugReset').addEventListener('click', () => {
            this.resetAllData();
        });

        document.getElementById('debugKeyboardMode').addEventListener('change', (e) => {
            this.toggleKeyboardMode(e.target.checked);
        });

        document.getElementById('debugLogging').addEventListener('change', (e) => {
            this.debugLogging = e.target.checked;
            document.getElementById('debugLog').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    toggleKeyboardMode(enabled) {
        if (!this.debugMode) return; // Only allow in debug mode
        
        this.keyboardModeEnabled = enabled;
        
        if (enabled) {
            // Disable GPS tracking
            if (this.watchId) {
                navigator.geolocation.clearWatch(this.watchId);
                this.watchId = null;
            }
            
            // Add keyboard event listener
            document.addEventListener('keydown', this.handleKeyboardMovement.bind(this));
            this.showSuccess('Keyboard mode enabled! Use ↑↓←→ arrows to move 🎮');
        } else {
            // Remove keyboard event listener
            document.removeEventListener('keydown', this.handleKeyboardMovement.bind(this));
            this.showSuccess('Keyboard mode disabled. GPS will be used when walking.');
        }
    }

    handleKeyboardMovement(event) {
        if (!this.keyboardModeEnabled || !this.debugMode) return;
        
        // Only move if arrow keys are pressed
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            return;
        }
        
        event.preventDefault();
        
        const currentPos = this.userMarker.getLatLng();
        const moveDistance = 0.0001; // roughly 10 meters
        
        let newLat = currentPos.lat;
        let newLng = currentPos.lng;
        
        switch (event.code) {
            case 'ArrowUp':
                newLat += moveDistance;
                break;
            case 'ArrowDown':
                newLat -= moveDistance;
                break;
            case 'ArrowLeft':
                newLng -= moveDistance;
                break;
            case 'ArrowRight':
                newLng += moveDistance;
                break;
        }
        
        // Update marker position
        this.userMarker.setLatLng([newLat, newLng]);
        this.map.panTo([newLat, newLng]);
        
        // If walking, simulate position update
        if (this.isWalking) {
            const fakePosition = {
                coords: {
                    latitude: newLat,
                    longitude: newLng
                }
            };
            this.onPositionUpdate(fakePosition);
        }
    }

    simulateCapture() {
        // Create a small test polygon around current position
        const center = this.userMarker.getLatLng();
        const offset = 0.0005; // roughly 50m
        
        this.currentPath = [
            [center.lat - offset, center.lng - offset],
            [center.lat + offset, center.lng - offset],
            [center.lat + offset, center.lng + offset],
            [center.lat - offset, center.lng + offset]
        ];

        this.captureTerritory();
    }

    resetAllData() {
        if (confirm('Reset all conquered territories and data?')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TerritoryConquest();
});
