document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CARGA DINÁMICA DE PROYECTOS (JSON)
    // Usamos './' explícito para evitar problemas de rutas de servidores locales
    fetch('./data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo encontrar o leer el archivo data.json");
            }
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('proyectos-container');
            if (container) {
                container.innerHTML = ''; // Limpiar el contenedor
                
                data.proyectos.forEach(p => {
                    container.innerHTML += `
                        <div class="proyecto-card">
                            <div>
                                <h3>${p.titulo}</h3>
                                <p>${p.descripcion}</p>
                            </div>
                            <a href="${p.link}" class="btn">Ver Código</a>
                        </div>
                    `;
                });
            }
        })
        .catch(error => {
            console.error('Error cargando los proyectos:', error);
            const container = document.getElementById('proyectos-container');
            if (container) {
                container.innerHTML = `<p style="color: red; grid-column: 1/-1; text-align: center;">Error al cargar proyectos dinámicos en local. Asegúrate de abrir la carpeta raíz del proyecto.</p>`;
            }
        });

    // 2. MENÚ HAMBURGUESA INTERACTIVO
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Cambia el símbolo del botón entre hamburguesa (☰) y cruz (✕)
            menuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });

        // Cerrar el menú automáticamente al hacer clic en cualquier sección
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // 3. EFECTO VISUAL EN EL NAVBAR AL HACER SCROLL
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 50) {
                nav.style.boxShadow = '0 10px 30px -10px rgba(2,12,27,0.7)';
                nav.style.padding = '0.5rem 0';
            } else {
                nav.style.boxShadow = 'none';
                nav.style.padding = '0';
            }
        }
    });
});