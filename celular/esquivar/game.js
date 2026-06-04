// --- VARIABLES DEL JUEGO ---
const jugador = document.getElementById('jugador');
const gameContainer = document.getElementById('game-container');
const flashLayer = document.getElementById('flash-layer');
const scoreText = document.getElementById('score');
const levelText = document.getElementById('level-txt');
const highscoreText = document.getElementById('highscore');
const comboBadge = document.getElementById('combo-badge');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreText = document.getElementById('final-score');
const rankingDisplay = document.getElementById('ranking-display');

const posicionesCarril = [16.66, 50, 83.33]; 
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

// --- EFECTOS VISUALES ---
function crearEstela(posicionXOriginal) {
    const estela = document.createElement('div');
    estela.classList.add('ghost-trail');
    estela.style.left = posicionXOriginal;
    if (tieneEscudo) estela.style.border = "3px solid #00bfff";
    gameContainer.appendChild(estela);
    setTimeout(() => estela.remove(), 250);
}

function actualizarPosicionJugador() {
    const posicionAnterior = jugador.style.left;
    jugador.style.left = posicionesCarril[carrilActual] + "%";
    
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
    setTimeout(() => divTxt.remove(), 600);
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

// --- CONTROLES (MÓVIL Y TECLADO) ---
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

// --- LÓGICA PRINCIPAL DEL BUCLE ---
function crearElemento() {
    if (!juegoActivo) return;

    const carrilAzar = Math.floor(Math.random() * 3);
    const nuevoElem = document.createElement('div');
    
    const azarTipo = Math.random();
    let tipo = 'obstaculo';

    if (azarTipo < 0.72) {
        nuevoElem.classList.add('obstaculo');
        tipo = 'obstaculo';
    } else if (azarTipo < 0.93) {
        nuevoElem.classList.add('moneda');
        tipo = 'moneda';
    } else {
        nuevoElem.classList.add('escudo-item');
        tipo = 'escudo';
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

        if (obj.y + 55 >= jugadorY && obj.y + 10 <= jugadorY + 55) {
            if (obj.carril === carrilActual) {
                
                if (obj.tipo === 'obstaculo') {
                    if (tieneEscudo) {
                        tieneEscudo = false;
                        jugador.classList.remove('protegido');
                        reproducirSonido('escudo_break');
                        lanzarTextoFlotante('ESCUDO ROTO', '#00bfff', jugadorY - 20);
                        
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
                    
                    obj.elemento.remove();
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
        
        flashLayer.style.backgroundColor = "rgba(255,255,255,0.8)";
        flashLayer.classList.add('flash');
        setTimeout(() => {
            flashLayer.classList.remove('flash');
            flashLayer.style.backgroundColor = "transparent";
        }, 400);
    }
}

// --- CONEXIÓN DE ENTRADA/SALIDA FIREBASE REALTIME ---
function mostrarRanking() {
    rankingDisplay.innerHTML = "Cargando Líderes Mundiales...";
    window.db.ref('ranking/').orderByChild('puntos').limitToLast(5).once('value', (snapshot) => {
        let items = [];
        snapshot.forEach((child) => { items.push(child.val()); });
        items.sort((a, b) => b.puntos - a.puntos); 
        rankingDisplay.innerHTML = "<h3>🏆 TOP 5 GLOBAL</h3>" + 
            items.map((jugador, i) => `<p>${i+1}. ${jugador.nombre} — ${jugador.puntos} pts</p>`).join('');
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
    
    finalScoreText.innerText = puntos;

    if (puntos > record) {
        record = puntos;
        localStorage.setItem('record_esquiva', record);
        highscoreText.innerText = record;

        setTimeout(() => {
            let nombre = prompt("¡NUEVO RÉCORD! Escribe tu nombre para la tabla de clasificación:");
            if (nombre) {
                // Limpiamos el nombre para que sea una clave válida en Firebase
                let nombreKey = nombre.trim().replace(/\s+/g, '_').replace(/[.#$\[\]]/g, '');
                
                if (nombreKey !== "") {
                    // Usamos set() en lugar de push() para sobreescribir si el nombre ya existe
                    window.db.ref('ranking/' + nombreKey).set({
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
    gameContainer.style.backgroundColor = coloresNiveles[0];
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