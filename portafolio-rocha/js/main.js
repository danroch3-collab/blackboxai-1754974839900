/* ===================================
   PORTAFOLIO ROCHA - JAVASCRIPT PRINCIPAL
   Desarrollador: Rocha
   Descripción: Funcionalidades principales del portafolio
   =================================== */

// ===================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ===================================

const CONFIG = {
    // Configuración de scroll suave
    scrollOffset: 80,
    scrollDuration: 800,
    
    // Configuración de animaciones
    animationDelay: 100,
    observerThreshold: 0.1,
    
    // Configuración de filtros
    filterAnimationDuration: 300,
    
    // Configuración de modal
    modalAnimationDuration: 300
};

// Variables globales
let isMenuOpen = false;
let currentFilter = 'all';
let scrollIndicator = null;
let scrollToTopBtn = null;
let intersectionObserver = null;

// ===================================
// INICIALIZACIÓN DEL DOCUMENTO
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Inicializando Portafolio Rocha...');
        
        // Inicializar todas las funcionalidades
        initNavigation();
        initScrollEffects();
        initProjectFilters();
        initSkillsAnimation();
        initModal();
        initScrollAnimations();
        initMobileMenu();
        
        console.log('✅ Portafolio Rocha inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar el portafolio:', error);
    }
});

// ===================================
// NAVEGACIÓN Y MENÚ
// ===================================

/**
 * Inicializa la navegación principal
 */
function initNavigation() {
    try {
        const navLinks = document.querySelectorAll('.navbar-link');
        const sections = document.querySelectorAll('section[id]');
        
        // Agregar event listeners a los enlaces de navegación
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavClick);
        });
        
        // Configurar scroll spy para resaltar sección activa
        window.addEventListener('scroll', throttle(updateActiveNavLink, 100));
        
        console.log('✅ Navegación inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar navegación:', error);
    }
}

/**
 * Maneja el clic en enlaces de navegación
 * @param {Event} e - Evento de clic
 */
function handleNavClick(e) {
    e.preventDefault();
    
    try {
        const targetId = e.target.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            // Cerrar menú móvil si está abierto
            if (isMenuOpen) {
                toggleMobileMenu();
            }
            
            // Scroll suave a la sección
            smoothScrollTo(targetSection);
            
            // Actualizar enlace activo
            updateActiveNavLink();
        }
    } catch (error) {
        console.error('❌ Error en navegación:', error);
    }
}

/**
 * Actualiza el enlace de navegación activo basado en la posición del scroll
 */
function updateActiveNavLink() {
    try {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.navbar-link');
        const scrollPos = window.scrollY + CONFIG.scrollOffset + 50;
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Actualizar clases activas
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('❌ Error al actualizar navegación activa:', error);
    }
}

/**
 * Scroll suave a un elemento
 * @param {Element} target - Elemento objetivo
 */
function smoothScrollTo(target) {
    try {
        const targetPosition = target.offsetTop - CONFIG.scrollOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = CONFIG.scrollDuration;
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        requestAnimationFrame(animation);
    } catch (error) {
        console.error('❌ Error en scroll suave:', error);
    }
}

/**
 * Función de easing para animaciones suaves
 */
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

// ===================================
// MENÚ MÓVIL
// ===================================

/**
 * Inicializa el menú móvil
 */
function initMobileMenu() {
    try {
        const hamburger = document.getElementById('hamburger');
        const navbarMenu = document.getElementById('navbar-menu');
        
        if (hamburger && navbarMenu) {
            hamburger.addEventListener('click', toggleMobileMenu);
            
            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (isMenuOpen && !hamburger.contains(e.target) && !navbarMenu.contains(e.target)) {
                    toggleMobileMenu();
                }
            });
            
            // Cerrar menú con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMenuOpen) {
                    toggleMobileMenu();
                }
            });
        }
        
        console.log('✅ Menú móvil inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar menú móvil:', error);
    }
}

/**
 * Alterna la visibilidad del menú móvil
 */
function toggleMobileMenu() {
    try {
        const hamburger = document.getElementById('hamburger');
        const navbarMenu = document.getElementById('navbar-menu');
        
        if (hamburger && navbarMenu) {
            isMenuOpen = !isMenuOpen;
            
            hamburger.classList.toggle('active', isMenuOpen);
            navbarMenu.classList.toggle('active', isMenuOpen);
            
            // Prevenir scroll del body cuando el menú está abierto
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        }
    } catch (error) {
        console.error('❌ Error al alternar menú móvil:', error);
    }
}

// ===================================
// EFECTOS DE SCROLL
// ===================================

/**
 * Inicializa los efectos de scroll
 */
function initScrollEffects() {
    try {
        createScrollIndicator();
        createScrollToTopButton();
        
        window.addEventListener('scroll', throttle(updateScrollEffects, 16));
        
        console.log('✅ Efectos de scroll inicializados');
    } catch (error) {
        console.error('❌ Error al inicializar efectos de scroll:', error);
    }
}

/**
 * Crea el indicador de progreso de scroll
 */
function createScrollIndicator() {
    try {
        scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        document.body.appendChild(scrollIndicator);
    } catch (error) {
        console.error('❌ Error al crear indicador de scroll:', error);
    }
}

/**
 * Crea el botón de scroll hacia arriba
 */
function createScrollToTopButton() {
    try {
        scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.className = 'scroll-to-top';
        scrollToTopBtn.innerHTML = '↑';
        scrollToTopBtn.setAttribute('aria-label', 'Volver arriba');
        
        scrollToTopBtn.addEventListener('click', () => {
            smoothScrollTo(document.body);
        });
        
        document.body.appendChild(scrollToTopBtn);
    } catch (error) {
        console.error('❌ Error al crear botón scroll to top:', error);
    }
}

/**
 * Actualiza los efectos de scroll
 */
function updateScrollEffects() {
    try {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        // Actualizar indicador de progreso
        if (scrollIndicator) {
            scrollIndicator.style.width = `${scrollPercent}%`;
        }
        
        // Mostrar/ocultar botón scroll to top
        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('visible', scrollTop > 300);
        }
        
        // Efecto parallax sutil en el hero
        const hero = document.querySelector('.hero');
        if (hero && scrollTop < window.innerHeight) {
            hero.style.transform = `translateY(${scrollTop * 0.5}px)`;
        }
    } catch (error) {
        console.error('❌ Error al actualizar efectos de scroll:', error);
    }
}

// ===================================
// FILTROS DE PROYECTOS
// ===================================

/**
 * Inicializa los filtros de proyectos
 */
function initProjectFilters() {
    try {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => handleFilterClick(e, projectCards));
        });
        
        console.log('✅ Filtros de proyectos inicializados');
    } catch (error) {
        console.error('❌ Error al inicializar filtros:', error);
    }
}

/**
 * Maneja el clic en botones de filtro
 * @param {Event} e - Evento de clic
 * @param {NodeList} projectCards - Tarjetas de proyecto
 */
function handleFilterClick(e, projectCards) {
    try {
        const filterValue = e.target.getAttribute('data-filter');
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        // Actualizar botón activo
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Filtrar proyectos
        filterProjects(filterValue, projectCards);
        
        currentFilter = filterValue;
    } catch (error) {
        console.error('❌ Error al manejar filtro:', error);
    }
}

/**
 * Filtra los proyectos según la categoría
 * @param {string} filter - Filtro seleccionado
 * @param {NodeList} projectCards - Tarjetas de proyecto
 */
function filterProjects(filter, projectCards) {
    try {
        projectCards.forEach((card, index) => {
            const category = card.getAttribute('data-category');
            const shouldShow = filter === 'all' || category === filter;
            
            // Animación de salida
            card.classList.add('hidden');
            
            setTimeout(() => {
                if (shouldShow) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.classList.remove('hidden');
                        card.classList.add('visible');
                    }, 50);
                } else {
                    card.style.display = 'none';
                    card.classList.remove('visible');
                }
            }, CONFIG.filterAnimationDuration);
        });
    } catch (error) {
        console.error('❌ Error al filtrar proyectos:', error);
    }
}

// ===================================
// ANIMACIÓN DE HABILIDADES
// ===================================

/**
 * Inicializa la animación de barras de habilidades
 */
function initSkillsAnimation() {
    try {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        // Configurar Intersection Observer para animar cuando sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBar(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        skillBars.forEach(bar => {
            observer.observe(bar);
        });
        
        console.log('✅ Animación de habilidades inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar animación de habilidades:', error);
    }
}

/**
 * Anima una barra de habilidad
 * @param {Element} skillBar - Barra de habilidad
 */
function animateSkillBar(skillBar) {
    try {
        const width = skillBar.getAttribute('data-width');
        skillBar.style.setProperty('--skill-width', width);
        skillBar.classList.add('animated');
    } catch (error) {
        console.error('❌ Error al animar barra de habilidad:', error);
    }
}

// ===================================
// MODAL DE PROYECTOS
// ===================================

/**
 * Inicializa el modal de proyectos
 */
function initModal() {
    try {
        const modal = document.getElementById('project-modal');
        const modalClose = document.getElementById('modal-close');
        const viewProjectBtns = document.querySelectorAll('.btn-view-project');
        
        if (modal && modalClose) {
            // Event listeners para botones de ver proyecto
            viewProjectBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const projectId = e.target.getAttribute('data-project');
                    openProjectModal(projectId);
                });
            });
            
            // Cerrar modal
            modalClose.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Cerrar con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'block') {
                    closeModal();
                }
            });
        }
        
        console.log('✅ Modal inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar modal:', error);
    }
}

/**
 * Abre el modal con información del proyecto
 * @param {string} projectId - ID del proyecto
 */
function openProjectModal(projectId) {
    try {
        const modal = document.getElementById('project-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            // Cargar contenido del proyecto
            const projectContent = getProjectContent(projectId);
            modalBody.innerHTML = projectContent;
            
            // Mostrar modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Animación de entrada
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    } catch (error) {
        console.error('❌ Error al abrir modal:', error);
    }
}

/**
 * Cierra el modal
 */
function closeModal() {
    try {
        const modal = document.getElementById('project-modal');
        
        if (modal) {
            modal.classList.add('closing');
            
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('active', 'closing');
                document.body.style.overflow = '';
            }, CONFIG.modalAnimationDuration);
        }
    } catch (error) {
        console.error('❌ Error al cerrar modal:', error);
    }
}

/**
 * Obtiene el contenido HTML para el modal del proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {string} - HTML del contenido
 */
function getProjectContent(projectId) {
    const projects = {
        'flask-app': {
            title: 'Sistema de Gestión Flask',
            description: 'Aplicación web completa desarrollada con Flask que incluye sistema de autenticación, operaciones CRUD, panel administrativo y gestión de usuarios.',
            technologies: ['Flask', 'SQLAlchemy', 'Bootstrap', 'SQLite', 'Jinja2'],
            features: [
                'Sistema de autenticación seguro',
                'Panel de administración completo',
                'Operaciones CRUD para múltiples entidades',
                'Diseño responsivo con Bootstrap',
                'Validación de formularios',
                'Gestión de sesiones'
            ],
            github: 'https://github.com/rocha/flask-app',
            demo: 'projects/flask-app/',
            images: ['flask-app-1.jpg', 'flask-app-2.jpg', 'flask-app-3.jpg']
        },
        'fastapi-demo': {
            title: 'API REST con FastAPI',
            description: 'API moderna y rápida desarrollada con FastAPI, incluyendo documentación automática, validación de datos con Pydantic y autenticación JWT.',
            technologies: ['FastAPI', 'Pydantic', 'JWT', 'SQLAlchemy', 'Uvicorn'],
            features: [
                'Documentación automática con Swagger',
                'Validación automática de datos',
                'Autenticación JWT',
                'Endpoints RESTful completos',
                'Manejo de errores robusto',
                'Alto rendimiento'
            ],
            github: 'https://github.com/rocha/fastapi-demo',
            demo: 'projects/fastapi-demo/',
            images: ['fastapi-demo-1.jpg', 'fastapi-demo-2.jpg']
        },
        'data-analysis': {
            title: 'Análisis de Datos Financieros',
            description: 'Proyecto completo de análisis de datos financieros con visualizaciones interactivas y predicciones usando machine learning.',
            technologies: ['Pandas', 'NumPy', 'Plotly', 'Jupyter', 'Scikit-learn'],
            features: [
                'Análisis exploratorio de datos',
                'Visualizaciones interactivas',
                'Predicciones con ML',
                'Reportes automatizados',
                'Dashboard interactivo',
                'Limpieza y procesamiento de datos'
            ],
            github: 'https://github.com/rocha/data-analysis',
            demo: 'projects/data-analysis/',
            images: ['data-analysis-1.jpg', 'data-analysis-2.jpg']
        },
        'automation-bot': {
            title: 'Bot de Automatización',
            description: 'Bot inteligente para automatización de tareas repetitivas, gestión de archivos y notificaciones automáticas.',
            technologies: ['Python', 'Selenium', 'Schedule', 'Requests', 'BeautifulSoup'],
            features: [
                'Automatización de tareas web',
                'Gestión automática de archivos',
                'Notificaciones por email',
                'Programación de tareas',
                'Interfaz de configuración',
                'Logs detallados'
            ],
            github: 'https://github.com/rocha/automation-bot',
            demo: 'projects/automation-bot/',
            images: ['automation-bot-1.jpg', 'automation-bot-2.jpg']
        },
        'ml-project': {
            title: 'Predictor de Precios ML',
            description: 'Modelo de machine learning para predicción de precios inmobiliarios con interfaz web interactiva.',
            technologies: ['Scikit-learn', 'Flask', 'Pandas', 'Matplotlib', 'Joblib'],
            features: [
                'Modelo de regresión entrenado',
                'Interfaz web para predicciones',
                'Visualización de resultados',
                'Análisis de características',
                'Validación del modelo',
                'API para predicciones'
            ],
            github: 'https://github.com/rocha/ml-project',
            demo: 'projects/ml-project/',
            images: ['ml-project-1.jpg', 'ml-project-2.jpg']
        },
        'web-scraper': {
            title: 'Web Scraper Avanzado',
            description: 'Herramienta de web scraping con interfaz gráfica para extracción y análisis de datos web en tiempo real.',
            technologies: ['BeautifulSoup', 'Requests', 'Tkinter', 'Pandas', 'Threading'],
            features: [
                'Interfaz gráfica intuitiva',
                'Scraping de múltiples sitios',
                'Exportación de datos',
                'Programación de extracciones',
                'Manejo de JavaScript',
                'Análisis de datos extraídos'
            ],
            github: 'https://github.com/rocha/web-scraper',
            demo: 'projects/web-scraper/',
            images: ['web-scraper-1.jpg', 'web-scraper-2.jpg']
        }
    };
    
    const project = projects[projectId];
    if (!project) return '<p>Proyecto no encontrado</p>';
    
    return `
        <div class="modal-project-content">
            <h2 class="modal-project-title">${project.title}</h2>
            <p class="modal-project-description">${project.description}</p>
            
            <div class="modal-project-tech">
                <h3>Tecnologías Utilizadas</h3>
                <div class="tech-tags">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            </div>
            
            <div class="modal-project-features">
                <h3>Características Principales</h3>
                <ul>
                    ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <div class="modal-project-links">
                <a href="${project.github}" target="_blank" class="btn btn-primary">Ver en GitHub</a>
                <a href="${project.demo}" target="_blank" class="btn btn-secondary">Ver Demo</a>
            </div>
        </div>
    `;
}

// ===================================
// ANIMACIONES AL SCROLL
// ===================================

/**
 * Inicializa las animaciones al hacer scroll
 */
function initScrollAnimations() {
    try {
        const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-scale');
        
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: CONFIG.observerThreshold,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(element => {
            intersectionObserver.observe(element);
        });
        
        console.log('✅ Animaciones de scroll inicializadas');
    } catch (error) {
        console.error('❌ Error al inicializar animaciones de scroll:', error);
    }
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Función throttle para optimizar eventos de scroll
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} - Función throttled
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Función debounce para optimizar eventos
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función debounced
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Detecta si el dispositivo es móvil
 * @returns {boolean} - True si es móvil
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Detecta si el usuario prefiere movimiento reducido
 * @returns {boolean} - True si prefiere movimiento reducido
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================

window.addEventListener('error', function(e) {
    console.error('❌ Error global capturado:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rechazada no manejada:', e.reason);
});

// ===================================
// EXPORTAR FUNCIONES PARA TESTING
// ===================================

// Solo para desarrollo/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        smoothScrollTo,
        throttle,
        debounce,
        isMobile,
        prefersReducedMotion
    };
}
