class CounselingMap extends HTMLElement {
  constructor () {
    super();

    //create boilerplate html
    const counselingWidget = document.createElement('div');
        counselingWidget.id = 'counseling-widget';

    counselingWidget.innerHTML = `
    <div class="map-container">
    
        <div id="map"></div>
    </div>
    
    <div class="filter-container">
        <div class="input">
            <label for="city-select">City</label>
            <select id="city-select" onchange="setFilter()"></select>
        </div>
        <div class="input">
            <label for="specialty-select">Specialty</label>
            <select id="specialty-select" onchange="setFilter()"></select>
        </div>
    </div>
    
    <div class="locations">
        <ul id="locations-list">
            
        </ul>
    </div>
    
    <section id="note">
        <p><em>NOTE:  The appearance of any particular provider on this list is for referral options only, and is not intended as an endorsement or recommendation by Pure Heart Church.  This referrals list is not exhaustive; additional treatment providers can be located by contacting "Focus on the Family" (<a href="www.family.org">www.family.org</a>) or Community Information & Referral (<a href="tel:602-263-8856">602-263-8856</a> or <a href="www.cir.org?>www.cir.org</a>) or <a href="http://www.aacc.net/divisions/christian-care-network">http://www.aacc.net/divisions/christian-care-network</a>).  Please provide Pure Heart Church with any feedback re: your experiences with any of the providers on this list.</em></p>
    </section>
    `
    this.appendChild(counselingWidget)

    //grab location data for counseling places
    const locations = JSON.parse(locationData)
    locations.sort((a, b) => {
        return a.order - b.order;
    })

    //create the map
    let map;
    // Attach your callback function to the `window` object
    window.initMap = function(filteredLocations) {
        const currentLocations = filteredLocations ? filteredLocations : locations;
        const pinLocations = currentLocations.filter(location => location.latLng).map(location => new google.maps.LatLng(location.latLng.lat,location.latLng.lng));
        // JS API is loaded and available
        map = new google.maps.Map(document.getElementById("map"), {
            center: mapOrigin,
            zoom: mapZoom,
            mapTypeControl: false,
            streetViewControl: false
        });
        if (currentLocations.length > 1) {
            var latlngbounds = new google.maps.LatLngBounds();
            for (var i = 0; i < pinLocations.length; i++) {
                latlngbounds.extend(pinLocations[i]);
            }
            map.fitBounds(latlngbounds);
        } else if (currentLocations.length < 1) {
            map.setCenter(mapOrigin)
            map.setZoom(mapZoom)
        } else {
            map.setCenter(pinLocations[0])
            map.setZoom(17)
        }
        //if filtered locations are passed in use those for pins instead of the list of all locations
        const mapLocations = filteredLocations ? filteredLocations : locations;

        let infoWindow = new google.maps.InfoWindow();
        //load all pins on the map
        for (let i = 0; i < mapLocations.length; i ++) {
            const {latLng, title, specialties} = mapLocations[i];

            const titleElem = `
                <div class="marker-title">
                    <h1>${title}</h1>
                    ${specialties ? `<div class="marker-info">
                        <p class="marker-info-label">Specialties:</p>
                        <p>${specialties.map(specialty => specialty).join(', ')}</p>
                    </div>` : ''}
                </div>
            `

            const marker = new google.maps.Marker({
                position: latLng,
                map,
                title: titleElem,
                label: {
                    text: `${i + 1}`,
                    color: "#FFFFFF"
                },
            })
            // Add a click listener for each marker, and set up the info window.
            marker.addListener("click", () => {
                infoWindow.close();
                infoWindow.setContent(marker.getTitle());
                infoWindow.open(marker.getMap(), marker);
            });
        }
    };


    //funcion which zooms the map on the point of the location when you use the 'veiw on map' button
    window.zoomOnPoint = (lat, lng) => {
        map.setCenter({lat: lat, lng: lng})
        map.setZoom(18)
        // map.setCenter(new GLatLng(lat, lon), );
    }

    //function to list all the locations so it can be updated by running the function
    const locationsListDOM = document.getElementById('locations-list');
    const loadLocationsList = (locations) => {

        locationsListDOM.innerHTML = locations.map((location, i) => {
            const {latLng, title, specialties, phone, email, addressLine, city, state, zip, website} = location;
            return `
                <li class="location-container">
                    <div class="header">
                        <h1>${i + 1}. ${title}</h1>
                        ${latLng ? `<button class="btn" onclick="map.scrollIntoView({behavior: 'smooth'}); zoomOnPoint(${latLng.lat}, ${latLng.lng})">View On Map</button>` : ''}
                    </div>
                    <div class="info-container">
                        <p class="label">Specialties</p>
                        <p>${specialties ? specialties.map(specialty => specialty).join(', ') : 'N/A'}</p>
                    </div>
                    <div class="info-container">
                        <p class="label">Contact Phone</p>
                        ${phone ? `<a class="link" href="tel:${phone}">${phone}</a>` : '<p>N/A</p>'}
                    </div>
                    <div class="info-container">
                        <p class="label">Contact Email</p>
                        ${email ? `<a class="link" href="mailto:${email}">${email}</a>` : '<p>N/A</p>'}
                    </div>
                    <div class="info-container">
                        <p class="label">Address</p>
                        ${addressLine && city && state && zip ? `<p>${addressLine}</p><p>${city}, ${state} ${zip}</p>` : '<p>N/A</p>'}
                        
                    </div>
                    <div class="info-container">
                        <p class="label">Website</p>
                        ${website ? `<a class="link" target="_blank" href="${website}">${website.replace(/^https?:\/\//, '')}</a>` : '<p>N/A</p>'}
                    </div>
                </li>
            `
        }).join('')
    }
    loadLocationsList(locations);

    //get cities and specialties from locations and make them filter options in the select dropdown menu
    const citySelectDOM = document.getElementById('city-select');
    const specialtySelectDOM = document.getElementById('specialty-select');

    const allCities = [...new Set(locations.filter(location => location.city).map(location => location.city))]
    let allSpecialties = [];
    locations.filter(location => location.specialties).forEach(location => allSpecialties = [... new Set(allSpecialties.concat(location.specialties))])

    const citySelectHTML = allCities.map(city => {
        return `
    <option value="${city}">${city}</option>
        `
    })
    citySelectHTML.unshift(`<option value="0">All</option>`)
    citySelectDOM.innerHTML = citySelectHTML.join('')

    const specialtySelectHTML = allSpecialties.map(specialty => {
        return `
    <option value="${specialty}">${specialty}</option>
        `
    })
    specialtySelectHTML.unshift(`<option value="0">All</option>`)
    specialtySelectDOM.innerHTML = specialtySelectHTML.join('')

    //runs on the change of the select inputs
    //edits the list of locations, changes the pins on the map to match the list below
    window.setFilter = () => {
        const city = citySelectDOM.value;
        const specialty = specialtySelectDOM.value;
        
        let filteredLocations;

        if (city == 0 && specialty == 0) {
            filteredLocations = locations;
        } else if (city == 0 && specialty) {
            filteredLocations = locations.filter(location => location.specialties).filter(location => location.specialties.includes(specialty));
        } else if (city && specialty == 0) {
            filteredLocations = locations.filter(location => location.city).filter(location => location.city == city);
        } else {
            filteredLocations = locations.filter(location => location.city && location.specialties).filter(location => location.city == city && location.specialties.includes(specialty));
        }

        loadLocationsList(filteredLocations)
        initMap(filteredLocations)
    }

    const googleAPIScriptDOM = document.createElement('script');
    googleAPIScriptDOM.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBQURtg-e0VW7VvySFIrDsYAOLIG9o80GQ&callback=initMap";
    document.body.appendChild(googleAPIScriptDOM);
  }
}

customElements.define('counseling-map', CounselingMap)