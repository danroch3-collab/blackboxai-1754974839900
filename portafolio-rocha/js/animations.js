/* ===================================
   PORTAFOLIO ROCHA - ANIMACIONES JAVASCRIPT
   Desarrollador: Rocha
   Descripción: Controlador de animaciones dinámicas y efectos visuales
   =================================== */

// ===================================
// CONFIGURACIÓN DE ANIMACIONES
// ===================================

const ANIMATION_CONFIG = {
    // Configuración del typewriter
    typewriter: {
        speed: 100,
        deleteSpeed: 50,
        pauseTime: 2000,
        loop: true
    },
    
    // Configuración de partículas
    particles: {
        count: 50,
        speed: 0.5,
        size: { min: 1, max: 3 },
        opacity: { min: 0.1, max: 0.6 }
    },
    
    // Configuración de contadores
    counters: {
        duration: 2000,
        easing: 'easeOutQuart'
    },
    
    // Configuración de reveal
    reveal: {
        distance: '60px',
        duration: 800,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        interval: 100
    }
};

// Variables globales para animaciones
let typewriterInstance = null;
let particlesArray = [];
let countersAnimated = false;
let isAnimationsPaused = false;

// ===================================
// INICIALIZACIÓN DE ANIMACIONES
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🎨 Inicializando animaciones...');
        
        // Verificar si el usuario prefiere movimiento reducido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('⚠️ Movimiento reducido detectado - Limitando animaciones');
            isAnimationsPaused = true;
            return;
        }
        
        // Inicializar todas las animaciones
        initTypewriterEffect();
        initParticlesBackground();
        initCounterAnimations();
        initRevealAnimations();
        initHoverEffects();
        initLoadingAnimations();
        
        console.log('✅ Animaciones inicializadas correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar animaciones:', error);
    }
});

// ===================================
// EFECTO TYPEWRITER (MÁQUINA DE ESCRIBIR)
// ===================================

/**
 * Inicializa el efecto typewriter en el hero
 */
function initTypewriterEffect() {
    try {
        const typewriterElement = document.getElementById('typewriter');
        if (!typewriterElement) return;
        
        const texts = [
            'Desarrollador Python Full Stack',
            'Especialista en Flask & Django',
            'Experto en FastAPI',
            'Analista de Datos',
            'Creador de Soluciones Web'
        ];
        
        typewriterInstance = new TypewriterEffect(typewriterElement, texts, ANIMATION_CONFIG.typewriter);
        typewriterInstance.start();
        
        console.log('✅ Efecto typewriter inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar typewriter:', error);
    }
}

/**
 * Clase para manejar el efecto typewriter
 */
class TypewriterEffect {
    constructor(element, texts, config) {
        this.element = element;
        this.texts = texts;
        this.config = config;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isWaiting = false;
    }
    
    start() {
        this.type();
    }
    
    type() {
        if (isAnimationsPaused) return;
        
        const currentText = this.texts[this.currentTextIndex];
        
        if (this.isWaiting) {
            setTimeout(() => {
                this.isWaiting = false;
                this.isDeleting = true;
                this.type();
            }, this.config.pauseTime);
            return;
        }
        
        if (this.isDeleting) {
            // Borrando texto
            this.element.textContent = currentText.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;
            
            if (this.currentCharIndex === 0) {
                this.isDeleting = false;
                this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            }
            
            setTimeout(() => this.type(), this.config.deleteSpeed);
        } else {
            // Escribiendo texto
            this.element.textContent = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
            
            if (this.currentCharIndex === currentText.length) {
                this.isWaiting = true;
            }
            
            setTimeout(() => this.type(), this.config.speed);
        }
    }
    
    pause() {
        isAnimationsPaused = true;
    }
    
    resume() {
        isAnimationsPaused = false;
        this.type();
    }
}

// ===================================
// SISTEMA DE PARTÍCULAS
// ===================================

/**
 * Inicializa el fondo de partículas en el hero
 */
function initParticlesBackground() {
    try {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Crear contenedor de partículas
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'hero-particles';
        hero.appendChild(particlesContainer);
        
        // Crear partículas
        createParticles(particlesContainer);
        
        // Animar partículas
        animateParticles();
        
        console.log('✅ Sistema de partículas inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar partículas:', error);
    }
}

/**
 * Crea las partículas
 * @param {Element} container - Contenedor de partículas
 */
function createParticles(container) {
    const config = ANIMATION_CONFIG.particles;
    
    for (let i = 0; i < config.count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posición aleatoria
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Tamaño aleatorio
        const size = Math.random() * (config.size.max - config.size.min) + config.size.min;
        
        // Opacidad aleatoria
        const opacity = Math.random() * (config.opacity.max - config.opacity.min) + config.opacity.min;
        
        // Velocidad aleatoria
        const speed = Math.random() * config.speed + 0.1;
        
        particle.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            opacity: ${opacity};
            animation-duration: ${6 / speed}s;
            animation-delay: ${Math.random() * 6}s;
        `;
        
        container.appendChild(particle);
        
        particlesArray.push({
            element: particle,
            x: x,
            y: y,
            size: size,
            opacity: opacity,
            speed: speed,
            direction: Math.random() * Math.PI * 2
        });
    }
}

/**
 * Anima las partículas
 */
function animateParticles() {
    if (isAnimationsPaused) return;
    
    particlesArray.forEach(particle => {
        // Actualizar posición
        particle.x += Math.cos(particle.direction) * particle.speed;
        particle.y += Math.sin(particle.direction) * particle.speed;
        
        // Rebotar en los bordes
        if (particle.x < 0 || particle.x > 100) {
            particle.direction = Math.PI - particle.direction;
        }
        if (particle.y < 0 || particle.y > 100) {
            particle.direction = -particle.direction;
        }
        
        // Mantener dentro de los límites
        particle.x = Math.max(0, Math.min(100, particle.x));
        particle.y = Math.max(0, Math.min(100, particle.y));
        
        // Aplicar nueva posición
        particle.element.style.left = `${particle.x}%`;
        particle.element.style.top = `${particle.y}%`;
    });
    
    requestAnimationFrame(animateParticles);
}

// ===================================
// ANIMACIONES DE CONTADORES
// ===================================

/**
 * Inicializa las animaciones de contadores
 */
function initCounterAnimations() {
    try {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    animateCounter(entry.target);
                    countersAnimated = true;
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => {
            observer.observe(counter);
        });
        
        console.log('✅ Animaciones de contadores inicializadas');
    } catch (error) {
        console.error('❌ Error al inicializar contadores:', error);
    }
}

/**
 * Anima un contador
 * @param {Element} element - Elemento contador
 */
function animateCounter(element) {
    if (isAnimationsPaused) return;
    
    const target = parseInt(element.textContent.replace(/\D/g, ''));
    const suffix = element.textContent.replace(/\d/g, '');
    const duration = ANIMATION_CONFIG.counters.duration;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Aplicar easing
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.floor(target * easedProgress);
        
        element.textContent = currentValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * Función de easing para animaciones suaves
 * @param {number} t - Progreso (0-1)
 * @returns {number} - Valor con easing aplicado
 */
function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// ===================================
// ANIMACIONES DE REVEAL
// ===================================

/**
 * Inicializa las animaciones de reveal al scroll
 */
function initRevealAnimations() {
    try {
        const revealElements = document.querySelectorAll('.animate-on-scroll, .project-card, .skill-category, .stat-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('fade-in');
                    }, index * ANIMATION_CONFIG.reveal.interval);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        revealElements.forEach(element => {
            observer.observe(element);
        });
        
        console.log('✅ Animaciones de reveal inicializadas');
    } catch (error) {
        console.error('❌ Error al inicializar reveal:', error);
    }
}

// ===================================
// EFECTOS HOVER AVANZADOS
// ===================================

/**
 * Inicializa efectos hover avanzados
 */
function initHoverEffects() {
    try {
        initProjectCardHovers();
        initButtonHovers();
        initSkillHovers();
        
        console.log('✅ Efectos hover inicializados');
    } catch (error) {
        console.error('❌ Error al inicializar efectos hover:', error);
    }
}

/**
 * Inicializa efectos hover para tarjetas de proyecto
 */
function initProjectCardHovers() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            if (isAnimationsPaused) return;
            
            // Efecto de elevación con sombra dinámica
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            card.style.transform = `translateY(-15px) rotateX(5deg) rotateY(2deg)`;
            card.style.boxShadow = `
                0 25px 50px rgba(0, 0, 0, 0.15),
                0 15px 30px rgba(0, 0, 0, 0.1)
            `;
        });
        
        card.addEventListener('mouseleave', (e) => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
        
        card.addEventListener('mousemove', (e) => {
            if (isAnimationsPaused) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `
                translateY(-15px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg)
                scale(1.02)
            `;
        });
    });
}

/**
 * Inicializa efectos hover para botones
 */
function initButtonHovers() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            if (isAnimationsPaused) return;
            
            // Crear efecto de ondas
            createRippleEffect(e.target, e);
        });
    });
}

/**
 * Crea efecto de ondas en botones
 * @param {Element} button - Botón
 * @param {Event} e - Evento de mouse
 */
function createRippleEffect(button, e) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Inicializa efectos hover para habilidades
 */
function initSkillHovers() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (isAnimationsPaused) return;
            
            const progressBar = item.querySelector('.skill-progress');
            if (progressBar) {
                progressBar.style.animationPlayState = 'paused';
                progressBar.style.filter = 'brightness(1.1) saturate(1.2)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const progressBar = item.querySelector('.skill-progress');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
                progressBar.style.filter = '';
            }
        });
    });
}

// ===================================
// ANIMACIONES DE CARGA
// ===================================

/**
 * Inicializa animaciones de carga de página
 */
function initLoadingAnimations() {
    try {
        // Animación de entrada del header
        const header = document.querySelector('.header');
        if (header) {
            header.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                header.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                header.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // Animación de entrada del contenido hero
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(50px)';
            setTimeout(() => {
                heroContent.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 300);
        }
        
        // Animación escalonada de elementos
        const staggeredElements = document.querySelectorAll('.hero-buttons .btn');
        staggeredElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 800 + (index * 200));
        });
        
        console.log('✅ Animaciones de carga inicializadas');
    } catch (error) {
        console.error('❌ Error al inicializar animaciones de carga:', error);
    }
}

// ===================================
// UTILIDADES DE ANIMACIÓN
// ===================================

/**
 * Pausa todas las animaciones
 */
function pauseAllAnimations() {
    isAnimationsPaused = true;
    if (typewriterInstance) {
        typewriterInstance.pause();
    }
    console.log('⏸️ Animaciones pausadas');
}

/**
 * Reanuda todas las animaciones
 */
function resumeAllAnimations() {
    isAnimationsPaused = false;
    if (typewriterInstance) {
        typewriterInstance.resume();
    }
    console.log('▶️ Animaciones reanudadas');
}

/**
 * Detecta cambios en la preferencia de movimiento
 */
function setupMotionPreferenceListener() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            pauseAllAnimations();
        } else {
            resumeAllAnimations();
        }
    });
}

/**
 * Optimiza animaciones basado en el rendimiento
 */
function optimizeAnimationsForPerformance() {
    // Detectar dispositivos de bajo rendimiento
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                          navigator.deviceMemory <= 2 ||
                          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isLowEndDevice) {
        // Reducir número de partículas
        ANIMATION_CONFIG.particles.count = Math.min(20, ANIMATION_CONFIG.particles.count);
        
        // Reducir velocidad de typewriter
        ANIMATION_CONFIG.typewriter.speed = 150;
        
        console.log('📱 Optimizaciones aplicadas para dispositivo de bajo rendimiento');
    }
}

// ===================================
// EFECTOS CSS DINÁMICOS
// ===================================

/**
 * Agrega estilos CSS dinámicos para animaciones
 */
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .fade-in {
            animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .project-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .skill-progress {
            transition: all 0.3s ease;
        }
    `;
    
    document.head.appendChild(style);
}

// ===================================
// INICIALIZACIÓN FINAL
// ===================================

// Configurar listener para preferencias de movimiento
setupMotionPreferenceListener();

// Optimizar para rendimiento
optimizeAnimationsForPerformance();

// Agregar estilos dinámicos
addDynamicStyles();

// Manejar visibilidad de la página para pausar/reanudar animaciones
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseAllAnimations();
    } else {
        resumeAllAnimations();
    }
});

// ===================================
// EXPORTAR PARA TESTING
// ===================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TypewriterEffect,
        pauseAllAnimations,
        resumeAllAnimations,
        createRippleEffect,
        easeOutQuart
    };
}
