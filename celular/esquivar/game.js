// --- VARIABLES DEL JUEGO ---
const jugador = document.getElementById('jugador');
const gameContainer = document.getElementById('game-container');
const parallaxBg = document.getElementById('parallax-bg'); 
const flashLayer = document.getElementById('flash-layer');
const fogOfWar = document.getElementById('fog-of-war');
const scoreText = document.getElementById('score');
const levelText = document.getElementById('level-txt');
const highscoreText = document.getElementById('highscore');
const comboBadge = document.getElementById('combo-badge');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreText = document.getElementById('final-score');
const rankingDisplay = document.getElementById('ranking-display');

// CACHÉ DE DIMENSIONES (Optimización responsiva)
let altoContenedor = gameContainer.offsetHeight;
let anchoPantalla = gameContainer.offsetWidth;
window.addEventListener('resize', () => {
    altoContenedor = gameContainer.offsetHeight;
    anchoPantalla = gameContainer.offsetWidth;
});

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
let parallaxY = 0; 

let tieneEscudo = false; 
let monedasConsecutivas = 0;
let multiplicadorCombo = 1;
let nivelActual = 1;

const coloresNiveles = ['#1a1a1a', '#0a192f', '#190a2f', '#2f0a19', '#0a2f24'];

// --- AUDIO PROCEDURAL (SND FX & MÚSICA DE FONDO) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

let loopMusica;
let pasoMusica = 0;
const notasMusicaBase = [110.00, 130.81, 146.83, 164.81, 196.00, 164.81, 146.83, 130.81];

function iniciarMusicaFondo() {
    if (loopMusica) clearInterval(loopMusica);
    
    let intervaloPaso = Math.max(140, 220 - (nivelActual * 12)); 
    
    loopMusica = setInterval(() => {
        if (!juegoActivo) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscBajo = audioCtx.createOscillator();
        const oscArpegio = audioCtx.createOscillator();
        const gainMusica = audioCtx.createGain();
        
        oscBajo.connect(gainMusica);
        oscArpegio.connect(gainMusica);
        gainMusica.connect(audioCtx.destination);
        
        oscBajo.type = 'triangle';
        let freqBajo = notasMusicaBase[pasoMusica % notasMusicaBase.length];
        
        if (nivelActual >= 3 && pasoMusica % 4 === 0) freqBajo *= 2;
        oscBajo.frequency.setValueAtTime(freqBajo, audioCtx.currentTime);
        
        if (pasoMusica % 2 === 0) {
            oscArpegio.type = 'sine';
            let freqArp = notasMusicaBase[(pasoMusica + 2) % notasMusicaBase.length] * 4; 
            oscArpegio.frequency.setValueAtTime(freqArp, audioCtx.currentTime);
            oscArpegio.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.08);
        } else {
            oscArpegio.frequency.setValueAtTime(0, audioCtx.currentTime);
        }
        
        // VOLUMEN MAESTRO INTEGRADO AL 0.05
        gainMusica.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainMusica.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
        
        oscBajo.start();
        oscArpegio.start();
        oscBajo.stop(audioCtx.currentTime + 0.19);
        oscArpegio.stop(audioCtx.currentTime + 0.19);
        
        pasoMusica++;
    }, intervaloPaso);
}

function detenerMusicaFondo() {
    clearInterval(loopMusica);
}

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
function crearParticulas(xPercentage, yPixels, color) {
    const xPixels = (xPercentage / 100) * anchoPantalla;

    for (let i = 0; i < 12; i++) {
        const particula = document.createElement('div');
        particula.classList.add('particula');
        particula.style.backgroundColor = color;
        particula.style.boxShadow = `0 0 10px ${color}`; 
        particula.style.left = xPixels + 'px';
        particula.style.top = yPixels + 'px';
        
        const moveX = (Math.random() - 0.5) * 160;
        const moveY = (Math.random() - 0.5) * 160;
        particula.style.setProperty('--moveX', moveX + 'px');
        particula.style.setProperty('--moveY', moveY + 'px');
        
        gameContainer.appendChild(particula);
        setTimeout(() => particula.remove(), 450);
    }
}

function actualizarPosicionJugador() {
    const posicionAnterior = jugador.style.left;
    jugador.style.left = posicionesCarril[carrilActual] + "%";

    if (posicionAnterior && posicionAnterior !== jugador.style.left) {
        const diff = parseFloat(jugador.style.left) - parseFloat(posicionAnterior);

        jugador.classList.remove('moviendo-izq', 'moviendo-der');

        if (diff > 0) {
            jugador.classList.add('moviendo-der');
        } else {
            jugador.classList.add('moviendo-izq');
        }

        setTimeout(() => {
            jugador.classList.remove('moviendo-izq', 'moviendo-der');
        }, 150);

        const estela = document.createElement('div');
        estela.classList.add('ghost-trail');
        estela.style.left = posicionAnterior;

        if (tieneEscudo) {
            estela.style.backgroundColor = "rgba(0,191,255,0.4)";
        }

        gameContainer.appendChild(estela);
        setTimeout(() => { estela.remove(); }, 250);
    }
}

function lanzarTextoFlotante(texto, color, yPos) {
    const divTxt = document.createElement('div');
    divTxt.classList.add('texto-flotante');
    divTxt.innerText = texto;
    divTxt.style.color = color;
    divTxt.style.textShadow = `0 0 8px ${color}`;
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
        linea.style.top = Math.random() * altoContenedor + "px";
        gameContainer.appendChild(linea);
        listaLineas.push(linea);
    }
}

function resetearLinea(linea) {
    linea.style.left = Math.random() * 100 + "%";
    linea.style.top = "-120px";
    linea.style.height = (Math.random() * 80 + 40) + "px";
}

// --- CONTROLES MÓVIL Y DESKTOP ---
function manejarEntradaTap(clientX) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!juegoActivo) return;

    const clickX = clientX - gameContainer.getBoundingClientRect().left;

    if (clickX < anchoPantalla / 2) {
        if (carrilActual > 0) carrilActual--;
    } else {
        if (carrilActual < 2) carrilActual++;
    }
    actualizarPosicionJugador();
}

gameContainer.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return; 
    e.preventDefault(); 
    manejarEntradaTap(e.touches[0].clientX);
}, { passive: false });

gameContainer.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    manejarEntradaTap(e.clientX);
});

window.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!juegoActivo) return;
    if (e.key === "ArrowLeft" && carrilActual > 0) carrilActual--;
    if (e.key === "ArrowRight" && carrilActual < 2) carrilActual++;
    actualizarPosicionJugador();
});

// --- BUCLE PRINCIPAL DE RENDERIZADO ---
function crearElemento() {
    if (!juegoActivo) return;

    const carrilAzar = Math.floor(Math.random() * 3);
    const nuevoElem = document.createElement('div');
    
    const azarTipo = Math.random();
    let tipo = 'obstaculo';

    if (azarTipo < 0.72) {
        nuevoElem.classList.add('obstaculo-pincho');
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

    const jugadorY = altoContenedor - 50 - 55; 

    // Movimiento Parallax de fondo
    parallaxY += velocidadObjetos * 0.4;
    if (parallaxY >= 60) parallaxY = 0; 
    if (parallaxBg) parallaxBg.style.transform = `translateY(${parallaxY}px)`;

    // Efecto de vibración sutil según la velocidad actual
    let vibracion = Math.max(0, (velocidadObjetos - 5) * 0.35); 
    if (vibracion > 0) {
        const offsetX = (Math.random() - 0.5) * vibracion;
        const offsetY = (Math.random() - 0.5) * vibracion;
        gameContainer.style.setProperty('--cam-shake-x', `${offsetX}px`);
        gameContainer.style.setProperty('--cam-shake-y', `${offsetY}px`);
    }

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

        // Registro de Esquivas Cercanas (Valiente)
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

        // Colisiones directas
        if (obj.y + 50 >= jugadorY && obj.y <= jugadorY + 50) {
            if (obj.carril === carrilActual) {
                
                if (obj.tipo === 'obstaculo') {
                    if (tieneEscudo) {
                        tieneEscudo = false;
                        
                        // QUITAMOS ESCUDO CON SEGURIDAD
                        jugador.classList.remove('protegido');
                        
                        reproducirSonido('escudo_break');
                        lanzarTextoFlotante('¡ESCUDO ROTO!', '#00bfff', jugadorY - 20);
                        
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
                    
                    const elMoneda = obj.elemento;
                    elMoneda.classList.add('moneda-recogida');
                    setTimeout(() => { if(elMoneda.parentNode) elMoneda.remove(); }, 250);
                    
                    listaElementos.splice(i, 1);
                    revisarCambioNivel();
                } 
                else if (obj.tipo === 'escudo') {
                    tieneEscudo = true;
                    
                    // COLOCAMOS ESCUDO CON SEGURIDAD
                    jugador.classList.add('protegido');
                    
                    reproducirSonido('escudo_up');
                    lanzarTextoFlotante('ESCUDO ACTIVO', '#e0ffff', jugadorY - 20);
                    
                    flashLayer.style.backgroundColor = "rgba(0, 191, 255, 0.4)";
                    flashLayer.classList.add('flash');
                    setTimeout(() => {
                        flashLayer.classList.remove('flash');
                        flashLayer.style.backgroundColor = "transparent";
                    }, 200);

                    obj.elemento.remove();
                    listaElementos.splice(i, 1);
                }
            }
        }

        // Elementos que salen de la pantalla
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
        iniciarMusicaFondo();
        
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
    detenerMusicaFondo(); 
    
    gameContainer.style.setProperty('--cam-shake-x', `0px`);
    gameContainer.style.setProperty('--cam-shake-y', `0px`);
    
    reproducirSonido('choque');
    gameContainer.classList.add('shake');
    finalScoreText.innerText = puntos;

    if (puntos > record) {
        record = puntos;
        localStorage.setItem('record_esquiva', record);
        highscoreText.innerText = record;
        document.getElementById('registro-record').style.display = 'block';
    } else {
        document.getElementById('registro-record').style.display = 'none';
        mostrarRanking();
    }

    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 400);
}

function guardarPuntaje() {
    const input = document.getElementById('nombre-input');
    const nombre = input.value.trim();
    
    if (nombre === "") {
        alert("Por favor, introduce un nombre.");
        return;
    }

    let nombreKey = nombre.replace(/\s+/g, '_').replace(/[.#$\[\]]/g, '');
    
    db.ref('ranking/' + nombreKey).set({
        nombre: nombre,
        puntos: record,
        fecha: new Date().toLocaleDateString()
    }).then(() => {
        document.getElementById('registro-record').style.display = 'none';
        mostrarRanking();
    }).catch(err => {
        console.error("Error al guardar:", err);
    });
}

function reiniciarJuego() {
    document.getElementById('registro-record').style.display = 'none';
    document.getElementById('nombre-input').value = "";

    listaElementos.forEach(obj => obj.elemento.remove());
    listaElementos = [];

    puntos = 0;
    nivelActual = 1;
    monedasConsecutivas = 0;
    multiplicadorCombo = 1;
    tieneEscudo = false;
    parallaxY = 0;
    pasoMusica = 0;
    
    scoreText.innerText = puntos;
    levelText.innerText = nivelActual;
    carrilActual = 1;
    velocidadObjetos = 5;
    tiempoAparicion = 1100;
    
    jugador.classList.remove('protegido'); 
    gameContainer.style.backgroundColor = coloresNiveles[0];
    if (fogOfWar) fogOfWar.style.background = `linear-gradient(to bottom, ${coloresNiveles[0]} 20%, transparent)`;
    
    actualizarPosicionJugador();
    
    gameOverScreen.style.display = "none";
    gameContainer.classList.remove('shake');
    juegoActivo = true;
    
    iniciarGenerador();
    iniciarMusicaFondo(); 
    juegoLoop();
    mostrarRanking();
}

// Exponer funciones globales
window.guardarPuntaje = guardarPuntaje;
window.reiniciarJuego = reiniciarJuego;

// --- DISPARADORES DE INICIO ---
actualizarPosicionJugador(); // Configurar centrado inicial
crearLineasVelocidad();
iniciarGenerador();
iniciarMusicaFondo(); 
juegoLoop();
mostrarRanking();