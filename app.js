// /frontend_amplify/app.js

// **NUEVO: URL BASE DE LA API DEL BACKEND (ALB)**
// **REEMPLAZA ESTE VALOR CON EL DNS REAL DE TU ALB DE AWS (ej: http://balatro-alb-1234.elb.amazonaws.com)**
const API_BASE_URL = 'http://[DNS_DEL_ALB_AQUÍ]'; 

const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
const jokerDetails = document.getElementById('jokerDetails');
const jokerName = document.getElementById('jokerName');
const jokerImage = document.getElementById('jokerImage');
const jokerDescription = document.getElementById('jokerDescription');
const jokerCost = document.getElementById('jokerCost');
const jokerRarity = document.getElementById('jokerRarity');
const addToRunButton = document.getElementById('addToRunButton');
const runContainer = document.getElementById('jokerRunSlots');

let jokersList = []; // Contiene TODOS los jokers cargados desde /api/jokers
let selectedJokers = [];

function showSuggestions(list) {
    suggestions.innerHTML = '';

    if (list.length === 0) {
        suggestions.style.display = 'none';
        return;
    }

    suggestions.style.display = 'block';

    list.forEach((joker) => {
        const li = document.createElement('li');
        li.textContent = joker.name;
        
        li.addEventListener('click', () => {
            showJokerDetails(joker);
            suggestions.style.display = 'none';
            searchInput.value = joker.name;
        });

        suggestions.appendChild(li);
    });
}

function highlightMult(description) {
    return description.replace(/(\+?\d+\s*Mult)/gi, '<span class="mult-effect">$1</span>');
}

function setRarityColor(rarity) {
    const r = rarity?.toLowerCase();

    if (r === 'rare') return 'rarity-rare';
    if (r === 'uncommon') return 'rarity-uncommon';
    if (r === 'common') return 'rarity-common';

    return '';
}

function showJokerDetails(joker) {
    jokerName.textContent = joker.name;
    jokerDescription.innerHTML = joker.description ? highlightMult(joker.description): 'No description';
    jokerCost.textContent = joker.cost || '-';

    const rarityClass = setRarityColor(joker.rarity || '');
    jokerRarity.textContent = joker.rarity || '-';
    jokerRarity.className = rarityClass;

    if (joker.ImageUrl) {
        jokerImage.src = joker.ImageUrl;
        jokerImage.style.display = 'block';
    } else {
        jokerImage.style.display = 'none';
    }

    jokerDetails.style.display = 'block';
    addToRunButton.style.display = 'inline-block';
}

addToRunButton.onclick = () => {
    if (selectedJokers.length >= 5) {
        alert("You can only carry 5 Jokers.");
        return;
    }
    
    // Obtenemos el Joker completo desde la lista global
    const name = jokerName.textContent;
    const fullJoker = jokersList.find(j => j.name === name);

    if (selectedJokers.some(j => j.name === name)) {
        alert("You already have this Joker in hand.");
        return;
    }
    
    // Usamos el objeto completo para asegurar que los datos son consistentes
    if (fullJoker) {
        const joker = {
            name: fullJoker.name,
            imageUrl: fullJoker.ImageUrl || '' 
        };
        selectedJokers.push(joker);
        renderRunJokers();
    }
};

function removeJokerFromRun(index) {
    selectedJokers.splice(index, 1);
    renderRunJokers();
}

function renderRunJokers() {
    runContainer.innerHTML = '';
    selectedJokers.forEach((joker, index) => {
        const card = document.createElement('div');
        card.className = 'joker-card-slot';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '✖';
        removeBtn.onclick = () => removeJokerFromRun(index);
        card.appendChild(removeBtn);

        // LÓGICA DE IMAGEN CORREGIDA: Si no hay URL, mostramos el nombre
        if (joker.imageUrl) {
            const img = document.createElement('img');
            img.src = joker.imageUrl;

            // Event listeners para la imagen
            img.addEventListener('mousemove', (e) => {
                const rect = img.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * 10;
                const rotateY = ((x - centerX) / centerX) * -10;
                img.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
            });

            img.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });

            card.appendChild(img);
        } else {
            // Mostrar el nombre como fallback si no hay imagen
            const nameDiv = document.createElement('div');
            nameDiv.className = 'joker-name-placeholder';
            nameDiv.textContent = joker.name; 
            card.appendChild(nameDiv);
        }

        runContainer.appendChild(card);
    });
}

// **LÓGICA DE BÚSQUEDA EN EL CLIENTE**
async function searchJokers(query) {
    const q = query.trim().toLowerCase();
    
    if (!q) {
        suggestions.style.display = 'none';
        jokerDetails.style.display = 'none';
        return;
    }

    // Filtrar los datos que ya tenemos en memoria (jokersList)
    const results = jokersList.filter(joker => {
        // Usa includes() en el nombre, insensible a mayúsculas/minúsculas
        return joker.name && joker.name.toLowerCase().includes(q);
    });
    
    showSuggestions(results);
}

let debounceTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
    searchJokers(e.target.value.trim());
    }, 300);
});

jokerImage.addEventListener('mousemove', (e) => {
    const rect = jokerImage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * -10;
    jokerImage.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
});

jokerImage.addEventListener('mouseleave', () => {
    jokerImage.style.transform = 'scale(1)';
});

document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO CRÍTICO: La URL ahora es absoluta, apuntando al ALB
    fetch(`${API_BASE_URL}/api/jokers`) 
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            jokersList = data; // Almacenar todos los datos
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert(`No se pudo cargar la data inicial. Verifique el Backend y la URL del ALB. Error: ${error.message}`); 
        });
});