//Création de la map
let map = L.map('map',{
    center : [47, 2],
    zoom : 6,
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Tokens API
let tokenWaqi = '3287ab1c8807044f49dfe0164eda3dae042fb419';

let tokenMeteoConcept = '0cef72a614b0cfb1b59c7085e1b38143358c6de20de14ab8e975a7b0924d4d62';

//Tableaux villes et insee
let cities = [
    'paris',
    'marseille',
    'lyon',
    'toulouse',
    'nice',
    'nantes',
    'montpellier',
    'strasbourg',
    'bordeaux',
    'lille'
];

let insees = [
    '75056',
    '13055',
    '69123',
    '31555',
    '06088',
    '44109',
    '34172',
    '67482',
    '33063',
    '59350'
]

//Création des groupes de layer
let layerGroupAir = L.layerGroup();
let layerGroupMeteo = L.layerGroup();

//Boucle pour créer marqueurs qualité de l'air
for(let city of cities){
    fetch(`https://api.waqi.info/feed/${city}/?token=${tokenWaqi}`)
        .then(response => response.json())
        .then(json => createMarker(json.data))
        .then(marker => marker.addTo(layerGroupAir));   
}

//Boucle pour créer marqueurs météo
for(let insee of insees){
    fetch(`https://api.meteo-concept.com/api/forecast/nextHours?token=${tokenMeteoConcept}&insee=${insee}`)
        .then(response => response.json())
        .then(json => weatherForecast(json.forecast[0]))
        .then(marker => marker.addTo(layerGroupMeteo));
}

//Création filtres
let layerControl = L.control.layers().addTo(map);
layerControl.addBaseLayer(layerGroupAir, 'Qualité de l\'air');
layerControl.addBaseLayer(layerGroupMeteo, 'Météo');

//Fonction création marqueurs qualité de l'air
function createMarker(data) {
    let airQualityColor = 0;
    if (data.aqi<51){
        airQualityColor='green';
    } else if (50<data.aqi && data.aqi<101){
        airQualityColor='yellow';
    } else if (100<data.aqi && data.aqi<151){
        airQualityColor='orange';
    } else if (150<data.aqi && data.aqi<201){
        airQualityColor='red';
    } else if (200<data.aqi && data.aqi<301){
        airQualityColor='purple';
    } else if (300<data.aqi){
        airQualityColor='brown';
    }

    let marker = L.circle([data.city.geo[0], data.city.geo[1]], {
        color: airQualityColor,
        fillColor: airQualityColor,
        fillOpacity: 1,
        radius: 10000
    });

    return marker.bindPopup(`
        <h3>${data.city.name}</h3><br>
        <b>AQI: </b>${data.aqi?data.aqi:'pas de données disponibles'}<br>
        <b>PM2.5: </b>${data.iaqi.pm25?data.iaqi.pm25.v:'pas de données disponibles'}<br>
        <b>PM10: </b>${data.iaqi.pm10?data.iaqi.pm10.v:'pas de données disponibles'}<br>
        <b>O3: </b>${data.iaqi.o3?data.iaqi.o3.v:'pas de données disponibles'}<br>
        <b>NO2: </b>${data.iaqi.no2?data.iaqi.no2.v:'pas de données disponibles'}<br>
        <b>SO2: </b>${data.iaqi.so2?data.iaqi.so2.v:'pas de données disponibles'}<br>
        <b>CO: </b>${data.iaqi.co?data.iaqi.co.v:'pas de données disponibles'}<br>
    `);
};

//Fonction création marqueurs météo
function weatherForecast(data){
    let fileName = '';
    let weather = data.weather;

    if (weather===0){
        fileName='wi-day-sunny';
    }else if (0<weather && weather<8){
        fileName='wi-day-cloudy';
    } else if (9<weather && weather<17 || 29<weather && weather<79 || 209<weather && weather<220 || 223<weather && weather<233){
        fileName='wi-day-rain';
    } else if (99<weather && weather<142){
        fileName='wi-day-lightning';
    } else if (19<weather && weather<23 || weather === 142 || 219<weather && weather<223 || weather===235){
        fileName='wi-day-snow';
    }

    let myIcon = L.icon({
        iconUrl: `assets/${fileName}.svg`,
        iconSize: [60, 60]
    });
    
    return L.marker([data.latitude, data.longitude], {icon: myIcon});
}

//Input Ville
const ville = document.getElementById('ville');
const button = document.getElementById('button');

button.addEventListener("click", async (e)=>{
    e.preventDefault();
    if(ville.value !== ''){
        fetch(`https://api.waqi.info/feed/${ville.value}/?token=${tokenWaqi}`)
        .catch(error=>console.log(error))
        .then(response => response.json())
        .then(json => createMarker(json.data))
        .then(marker => marker.addTo(layerGroupAir));

        let inseeCode = await getInseeByName(ville.value);
        
        fetch(`https://api.meteo-concept.com/api/forecast/nextHours?token=${tokenMeteoConcept}&insee=${inseeCode}`)
        .then(response => response.json())
        .then(json => weatherForecast(json.forecast[0]))
        .then(marker => marker.addTo(layerGroupMeteo));
    }
});

function getInseeByName(ville){
    ville = ville.toLowerCase();
    ville = ville.charAt(0).toUpperCase()+ville.slice(1);
    return fetch(`https://geo.api.gouv.fr/communes?nom=${ville}&fields=nom&format=json&geometry=centre`)
        .then(response => response.json())
        .then(json => json.find(obj => obj.nom === ville))
        .then(result => result.code);
}

