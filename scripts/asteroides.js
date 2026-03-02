/**
 * CONFIGURACIÓN Y ESTADO
 */
const API_KEY = "Qty8lZJmSAaLTYDkkur5zHevkjdwa9g7aS8ylodI";
const BASE_URL = "https://api.nasa.gov/neo/rest/v1/feed?";
const gallery = document.getElementById("gallery");
const statusContainer = document.getElementById("statusContainer");

// Restringir fecha máxima a hoy
const todayStr = new Date().toISOString().split("T")[0];
document.getElementById("start").max = todayStr;

/**
 * SERVICIOS (LÓGICA DE DATOS)
 */
async function apiCall(params = "") {
    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}?${params}&api_key=${API_KEY}`);
        if (!response.ok) throw new Error("Error en la respuesta de la NASA");
        const data = await response.json();
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        showToast("🚀 Error de conexión");
        console.error(error);
        return [];
    } finally {
        showLoading(false);
    }
}

/**
 * UI HELPERS
 */
function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function showLoading(isLoading) {
    statusContainer.innerHTML = isLoading ? '<div class="loader">Sincronizando con satélites...</div>' : '';
}

function renderGallery(items) {
    gallery.innerHTML = "";
    if (items.length === 0) {
        gallery.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>No se encontraron imágenes en este sector.</p>";
        return;
    }
    const neo = items[0].near_earth_objects;
    const dates = Object.keys(neo);

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const asteroids = neo[date];

        for (let j = 0; j < asteroids.length; j++) {
            createCard(asteroids[j]);
        }
    }

}

/**
 * COMPONENTES
 */
function createCard(data) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="card-content">
            <small>${data.close_approach_data[0].close_approach_date}</small>
            <h3>${data.name}</h3>
        </div>
    `;
    card.onclick = () => openModal(data);
    gallery.appendChild(card);
}

function openModal(data) {
    const isFavorite = checkIfFavorite(data.date);
    document.getElementById("modalBody").innerHTML = `
        <small style="color:var(--primary)">${data.close_approach_data[0].close_approach_date}</small>
        <h2 style="margin:10px 0">${data.name}</h2>
        <p style="line-height:1.6; color:#cbd5e1; margin-bottom:20px">Mide entre ${data.estimated_diameter.meters.estimated_diameter_min} metros y ${data.estimated_diameter.meters.estimated_diameter_max}</p>
        
        <div style="display:flex; gap:10px">
            <button class="btn" style="background:${isFavorite ? '#ef4444':'#22c55e'}; color:white" 
                onclick='toggleFavorite(${JSON.stringify(data).replace(/'/g, "&apos;")})'>
                ${isFavorite ? '🗑️ Eliminar de Favoritos' : '❤️ Guardar en Favoritos'}
            </button>
        </div>
    `;
    document.getElementById("modal").classList.add("active");
}

function closeModal() {
    document.getElementById("modal").classList.remove("active");
}

/**
 * GESTIÓN DE FAVORITOS (LOCALSTORAGE)
 */
function getFavorites() {
    return JSON.parse(localStorage.getItem("nasa_favs")) || [];
}

function checkIfFavorite(date) {
    return getFavorites().some(f => f.date === date);
}

function toggleFavorite(data) {
    let favs = getFavorites();
    const index = favs.findIndex(f => f.date === data.date);

    if (index === -1) {
        favs.push(data);
        showToast("Guardado en favoritos 🚀");
    } else {
        favs.splice(index, 1);
        showToast("Eliminado de favoritos");
    }

    localStorage.setItem("nasa_favs", JSON.stringify(favs));
    closeModal();
    // Si estábamos viendo favoritos, refrescar la vista
    if (gallery.dataset.view === "favorites") showFavorites();
}

function showFavorites() {
    gallery.dataset.view = "favorites";
    const favs = getFavorites();
    renderGallery(favs);
}

/**
 * ACCIONES PRINCIPALES
 */
async function loadToday() {
    gallery.dataset.view = "all";
    const data = await apiCall();
    renderGallery(data);
}

async function loadRange() {
    const start = document.getElementById("start").value;
    
    if (!start) return showToast("Faltan fechas");

    gallery.dataset.view = "all";
    const data = await apiCall(`&start_date=${start}`);
    renderGallery(data.reverse());
}

// Carga inicial
loadToday();