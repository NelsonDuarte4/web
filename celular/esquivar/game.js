// --- VARIABLES DEL JUEGO ---
const jugador = document.getElementById('jugador');
const gameContainer = document.getElementById('game-container');
const flashLayer = document.getElementById('flash-layer');
const fogOfWar = document.getElementById('fog-of-war');
const scoreText = document.getElementById('score');
const levelText = document.getElementById('level-txt');
const highscoreText = document.getElementById('highscore');
const comboBadge = document.getElementById('combo-badge');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreText = document.getElementById('final-score');
const rankingDisplay = document.getElementById('ranking-display');

const posicionesCarril = [16.666, 50, 83.333]; 
let carrilActual = 1; 

let puntos = 0;
let record = localStorage.getItem('record_esquiva') || 0;
highscoreText.innerText = record;

let juegoActivo = true;
let listaElementos = [];
let listaLineas = []; 

let velocidadObjetos = 5; 
let tiempoAparicion = 1100; 
let bucleElementos;

let tieneEscudo = false; 
let monedasConsecutivas = 0;
let multiplicadorCombo = 1;
let nivelActual = 1;

const coloresNiveles = ['#1a1a1a', '#0a192f', '#190a2f', '#2f0a19', '#0a2f24'];

// --- AUDIO PROCEDURAL ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

function reproducirSonido(tipo) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (tipo === 'punto') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(700, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.06);
    } else if (tipo === 'moneda') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.07); 
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (tipo === 'near_miss') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.12);
    } else if (tipo === 'escudo_up') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(250, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.25);
    } else if (tipo === 'escudo_break') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (tipo === 'choque') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(140, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.4);
    } else if (tipo === 'nivel') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); 
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); 
        oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); 
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.4);
    }
}

// --- EFECTOS VISUALES MEJORADOS ---
function crearParticulas(xPercentage, yPixels, color) {
    // Calculamos el x real en píxeles basado en su porcentaje del contenedor
    const containerWidth = gameContainer.offsetWidth;
    const xPixels = (xPercentage / 100) * containerWidth;

    for (let i = 0; i < 10; i++) {
        const particula = document.createElement('div');
        particula.classList.add('particula');
        particula.style.backgroundColor = color;
        particula.style.left = xPixels + 'px';
        particula.style.top = yPixels + 'px';
        
        // Explosión física con mayor rango dinámico
        const moveX = (Math.random() - 0.5) * 140;
        const moveY = (Math.random() - 0.5) * 140;
        particula.style.setProperty('--moveX', moveX + 'px');
        particula.style.setProperty('--moveY', moveY + 'px');
        
        gameContainer.appendChild(particula);
        setTimeout(() => particula.remove(), 450);
    }
}

function crearEstela(posicionXOriginal) {
    const estela = document.createElement('div');
    estela.classList.add('ghost-trail');
    estela.style.left = posicionXOriginal;
    if (tieneEscudo) estela.style.border = "3px solid #00bfff";
    gameContainer.appendChild(estela);
    setTimeout(() => estela.remove(), 200);
}

function actualizarPosicionJugador() {
    const posicionAnterior = jugador.style.left;
    jugador.style.left = posicionesCarril[carrilActual] + "%";
    
    // Pescamos la dirección y aplicamos la inclinación limpia (Juice)
    if (posicionAnterior && juegoActivo) {
        const diff = parseFloat(jugador.style.left) - parseFloat(posicionAnterior);
        if (diff !== 0) {
            const angulo = diff > 0 ? 18 : -18; 
            jugador.style.transform = `translateX(-50%) rotate(${angulo}deg)`;
            setTimeout(() => {
                if (juegoActivo) jugador.style.transform = "translateX(-50%) rotate(0deg)";
            }, 150);
        }
    }
    
    if (posicionAnterior && posicionAnterior !== jugador.style.left) {
        crearEstela(posicionAnterior);
    }
}
actualizarPosicionJugador(); 

function lanzarTextoFlotante(texto, color, yPos) {
    const divTxt = document.createElement('div');
    divTxt.classList.add('texto-flotante');
    divTxt.innerText = texto;
    divTxt.style.color = color;
    divTxt.style.left = posicionesCarril[carrilActual] + "%";
    divTxt.style.top = yPos + "px";
    gameContainer.appendChild(divTxt);
    setTimeout(() => divTxt.remove(), 550);
}

function crearLineasVelocidad() {
    for(let i=0; i<12; i++) {
        const linea = document.createElement('div');
        linea.classList.add('linea-velocidad');
        resetearLinea(linea);
        linea.style.top = Math.random() * gameContainer.offsetHeight + "px";
        gameContainer.appendChild(linea);
        listaLineas.push(linea);
    }
}

function resetearLinea(linea) {
    linea.style.left = Math.random() * 100 + "%";
    linea.style.top = "-120px";
    linea.style.height = (Math.random() * 80 + 40) + "px";
}

// --- CONTROLES ---
function manejarEntrada(clientX) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!juegoActivo) return;

    const anchoPantalla = gameContainer.offsetWidth;
    const clickX = clientX - gameContainer.getBoundingClientRect().left;

    if (clickX < anchoPantalla / 2) {
        if (carrilActual > 0) carrilActual--;
    } else {
        if (carrilActual < 2) carrilActual++;
    }
    actualizarPosicionJugador();
}

gameContainer.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON') return; 
    e.preventDefault(); 
    manejarEntrada(e.touches[0].clientX);
}, { passive: false });

gameContainer.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    manejarEntrada(e.clientX);
});

window.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!juegoActivo) return;
    if (e.key === "ArrowLeft" && carrilActual > 0) carrilActual--;
    if (e.key === "ArrowRight" && carrilActual < 2) carrilActual++;
    actualizarPosicionJugador();
});

// --- BUCLE PRINCIPAL Y GESTIÓN DE ELEMENTOS ---
function crearElemento() {
    if (!juegoActivo) return;

    const carrilAzar = Math.floor(Math.random() * 3);
    const nuevoElem = document.createElement('div');
    
    const azarTipo = Math.random();
    let tipo = 'obstaculo';

    if (azarTipo < 0.72) {
        tipo = 'obstaculo';
    } else if (azarTipo < 0.93) {
        tipo = 'moneda';
    } else {
        tipo = 'escudo';
    }

    // Algoritmo anti-bloqueo total
    if (tipo === 'obstaculo') {
        let carrilesOcupados = new Set();
        listaElementos.forEach(obj => {
            if (obj.tipo === 'obstaculo' && obj.y < 240) {
                carrilesOcupados.add(obj.carril);
            }
        });
        if (carrilesOcupados.size >= 2 && !carrilesOcupados.has(carrilAzar)) {
            tipo = Math.random() < 0.75 ? 'moneda' : 'escudo';
        }
    }

    if (tipo === 'obstaculo') {
        nuevoElem.classList.add('obstaculo');
    } else if (tipo === 'moneda') {
        nuevoElem.classList.add('moneda');
    } else {
        nuevoElem.classList.add('escudo-item');
    }

    nuevoElem.style.left = posicionesCarril[carrilAzar] + "%";
    nuevoElem.style.top = "-60px"; 
    
    const infoElemento = {
        elemento: nuevoElem,
        carril: carrilAzar,
        tipo: tipo,
        y: -60,
        nearMissRegistrado: false 
    };

    gameContainer.appendChild(nuevoElem);
    listaElementos.push(infoElemento);
}

function iniciarGenerador() {
    clearInterval(bucleElementos);
    bucleElementos = setInterval(crearElemento, tiempoAparicion);
}

function juegoLoop() {
    if (!juegoActivo) return;

    const altoContenedor = gameContainer.offsetHeight;
    const jugadorY = altoContenedor - 50 - 55; 

    for(let i=0; i<listaLineas.length; i++) {
        let linea = listaLineas[i];
        let topActual = parseFloat(linea.style.top);
        topActual += (velocidadObjetos * 1.8); 
        linea.style.top = topActual + "px";
        if(topActual > altoContenedor) {
            resetearLinea(linea);
        }
    }

    for (let i = listaElementos.length - 1; i >= 0; i--) {
        let obj = listaElementos[i];
        obj.y += velocidadObjetos;
        obj.elemento.style.top = obj.y + "px";

        // Lógica de evasión (Near Miss) perfectamente calibrada al centro
        if (obj.tipo === 'obstaculo' && !obj.nearMissRegistrado) {
            if (obj.y + 55 >= jugadorY && obj.y <= jugadorY + 55) {
                if (Math.abs(obj.carril - carrilActual) === 1) {
                    obj.nearMissRegistrado = true;
                    puntos += 25; 
                    scoreText.innerText = puntos;
                    reproducirSonido('near_miss');
                    lanzarTextoFlotante('¡VALIENTE! +25', '#ff9900', jugadorY - 20);
                    revisarCambioNivel();
                }
            }
        }

        // Detección precisa de impactos corporales en el eje Y
        if (obj.y + 50 >= jugadorY && obj.y <= jugadorY + 50) {
            if (obj.carril === carrilActual) {
                
                if (obj.tipo === 'obstaculo') {
                    if (tieneEscudo) {
                        tieneEscudo = false;
                        jugador.classList.remove('protegido');
                        reproducirSonido('escudo_break');
                        lanzarTextoFlotante('ESCUDO ROTO', '#00bfff', jugadorY - 20);
                        
                        crearParticulas(posicionesCarril[obj.carril], obj.y + 25, '#00bfff');

                        flashLayer.classList.add('flash');
                        setTimeout(() => flashLayer.classList.remove('flash'), 200);

                        obj.elemento.remove();
                        listaElementos.splice(i, 1);
                    } else {
                        gameOver();
                        return;
                    }
                } 
                else if (obj.tipo === 'moneda') {
                    monedasConsecutivas++;
                    
                    if (monedasConsecutivas >= 6) {
                        multiplicadorCombo = 3;
                        comboBadge.style.backgroundColor = "#ff3366";
                        comboBadge.style.color = "#fff";
                        comboBadge.style.boxShadow = "0 0 15px #ff3366";
                    } else if (monedasConsecutivas >= 3) {
                        multiplicadorCombo = 2;
                        comboBadge.style.backgroundColor = "#ffd700";
                        comboBadge.style.color = "#000";
                        comboBadge.style.boxShadow = "0 0 10px #ffd700";
                    } else {
                        multiplicadorCombo = 1;
                    }

                    if(multiplicadorCombo > 1) {
                        comboBadge.innerText = `Combo x${multiplicadorCombo}`;
                        comboBadge.style.display = "inline-block";
                        comboBadge.style.transform = "scale(1.2)";
                        setTimeout(() => comboBadge.style.transform = "scale(1)", 100);
                    }

                    puntos += (50 * multiplicadorCombo); 
                    scoreText.innerText = puntos;
                    reproducirSonido('moneda');
                    
                    lanzarTextoFlotante(`+${50 * multiplicadorCombo}`, '#ffd700', jugadorY - 15);
                    
                    // CORREGIDO: Animación pulida pop en moneda antes de sacarla del DOM
                    const elMoneda = obj.elemento;
                    elMoneda.classList.add('moneda-recogida');
                    setTimeout(() => { if(elMoneda.parentNode) elMoneda.remove(); }, 250);
                    
                    listaElementos.splice(i, 1);
                    revisarCambioNivel();
                } 
                else if (obj.tipo === 'escudo') {
                    tieneEscudo = true;
                    jugador.classList.add('protegido');
                    reproducirSonido('escudo_up');
                    lanzarTextoFlotante('ESCUDO ACTIVO', '#e0ffff', jugadorY - 20);
                    obj.elemento.remove();
                    listaElementos.splice(i, 1);
                }
            }
        }

        if (obj.y > altoContenedor) {
            obj.elemento.remove();
            
            if (obj.tipo === 'obstaculo') {
                puntos += 10;
                scoreText.innerText = puntos;
                reproducirSonido('punto');
                revisarCambioNivel();
            } 
            else if (obj.tipo === 'moneda') {
                if (monedasConsecutivas > 0) {
                    monedasConsecutivas = 0;
                    multiplicadorCombo = 1;
                    comboBadge.style.display = "none";
                    lanzarTextoFlotante('COMBO ROTO', '#ff3366', 120);
                }
            }
            
            listaElementos.splice(i, 1);
        }
    }

    requestAnimationFrame(juegoLoop);
}

function revisarCambioNivel() {
    let nuevoNivelCalculado = Math.floor(puntos / 500) + 1;
    
    if (nuevoNivelCalculado > nivelActual) {
        nivelActual = nuevoNivelCalculado;
        levelText.innerText = nivelActual;
        
        velocidadObjetos += 0.9;
        if (tiempoAparicion > 400) {
            tiempoAparicion -= 100;
            iniciarGenerador();
        }
        
        reproducirSonido('nivel');
        
        const colorIndex = (nivelActual - 1) % coloresNiveles.length;
        gameContainer.style.backgroundColor = coloresNiveles[colorIndex];
        
        if (fogOfWar) {
            fogOfWar.style.background = `linear-gradient(to bottom, ${coloresNiveles[colorIndex]} 20%, transparent)`;
        }
        
        flashLayer.style.backgroundColor = "rgba(255,255,255,0.7)";
        flashLayer.classList.add('flash');
        setTimeout(() => {
            flashLayer.classList.remove('flash');
            flashLayer.style.backgroundColor = "transparent";
        }, 350);
    }
}

// --- CONEXIÓN FIREBASE REALTIME ---
function mostrarRanking() {
    rankingDisplay.innerHTML = "Cargando Líderes Mundiales...";
    db.ref('ranking/').orderByChild('puntos').limitToLast(5).once('value', (snapshot) => {
        let items = [];
        snapshot.forEach((child) => { items.push(child.val()); });
        items.sort((a, b) => b.puntos - a.puntos); 
        
        // CORREGIDO: Inyección HTML estructurada en filas limpias alineadas a la izquierda
        rankingDisplay.innerHTML = "<h3>🏆 TOP 5 GLOBAL</h3>" + 
            items.map((j, i) => `
                <div class="ranking-fila">
                    <span class="ranking-pos-nombre">${i+1}. ${j.nombre}</span>
                    <span class="ranking-puntos">${j.puntos} pts</span>
                </div>
            `).join('');
    }).catch(err => {
        rankingDisplay.innerHTML = "Error al cargar clasificación.";
    });
}

function gameOver() {
    juegoActivo = false;
    clearInterval(bucleElementos);
    
    reproducirSonido('choque');
    gameContainer.classList.add('shake');
    comboBadge.style.display = "none";
    jugador.style.transform = "translateX(-50%) rotate(0deg)";
    
    // Explosión masiva roja al perder alineada al centro del impacto
    crearParticulas(posicionesCarril[carrilActual], gameContainer.offsetHeight - 105, '#ff3366');
    
    finalScoreText.innerText = puntos;

    if (puntos > record) {
        record = puntos;
        localStorage.setItem('record_esquiva', record);
        highscoreText.innerText = record;

        setTimeout(() => {
            let nombre = prompt("¡NUEVO RÉCORD! Escribe tu nombre para la tabla de clasificación:");
            if (nombre) {
                let nombreKey = nombre.trim().replace(/\s+/g, '_').replace(/[.#$\[\]]/g, '');
                
                if (nombreKey !== "") {
                    db.ref('ranking/' + nombreKey).set({
                        nombre: nombre.trim(),
                        puntos: record,
                        fecha: new Date().toLocaleDateString()
                    }, () => {
                        mostrarRanking();
                    });
                } else {
                    mostrarRanking();
                }
            } else {
                mostrarRanking();
            }
        }, 100); 
    } else {
        mostrarRanking();
    }

    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 400);
}

function reiniciarJuego() {
    listaElementos.forEach(obj => obj.elemento.remove());
    listaElementos = [];

    puntos = 0;
    nivelActual = 1;
    monedasConsecutivas = 0;
    multiplicadorCombo = 1;
    tieneEscudo = false;
    
    scoreText.innerText = puntos;
    levelText.innerText = nivelActual;
    carrilActual = 1;
    velocidadObjetos = 5;
    tiempoAparicion = 1100;
    
    jugador.className = ""; 
    jugador.style.transform = "translateX(-50%) rotate(0deg)"; 
    gameContainer.style.backgroundColor = coloresNiveles[0];
    if (fogOfWar) fogOfWar.style.background = `linear-gradient(to bottom, ${coloresNiveles[0]} 20%, transparent)`;
    
    actualizarPosicionJugador();
    
    gameContainer.classList.remove('shake');
    gameOverScreen.style.display = "none";
    
    juegoActivo = true;
    iniciarGenerador();
    juegoLoop();
}

window.reiniciarJuego = reiniciarJuego;

// --- DISPARADORES DE INICIO ---
crearLineasVelocidad();
iniciarGenerador();
juegoLoop();
mostrarRanking();