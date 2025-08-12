/* ===================================
   PORTAFOLIO ROCHA - FORMULARIO DE CONTACTO
   Desarrollador: Rocha
   Descripción: Validación y envío del formulario de contacto con EmailJS
   =================================== */

// ===================================
// CONFIGURACIÓN DEL FORMULARIO
// ===================================

const FORM_CONFIG = {
    // Configuración de EmailJS (se debe configurar con claves reales)
    emailjs: {
        serviceId: 'service_rocha_portfolio',
        templateId: 'template_contact_form',
        publicKey: 'YOUR_EMAILJS_PUBLIC_KEY' // Se debe reemplazar con la clave real
    },
    
    // Configuración de validación
    validation: {
        name: {
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        subject: {
            minLength: 5,
            maxLength: 100
        },
        message: {
            minLength: 10,
            maxLength: 1000
        }
    },
    
    // Mensajes de error
    errorMessages: {
        name: {
            required: 'El nombre es obligatorio',
            minLength: 'El nombre debe tener al menos 2 caracteres',
            maxLength: 'El nombre no puede exceder 50 caracteres',
            pattern: 'El nombre solo puede contener letras y espacios'
        },
        email: {
            required: 'El email es obligatorio',
            pattern: 'Por favor ingresa un email válido'
        },
        subject: {
            required: 'El asunto es obligatorio',
            minLength: 'El asunto debe tener al menos 5 caracteres',
            maxLength: 'El asunto no puede exceder 100 caracteres'
        },
        message: {
            required: 'El mensaje es obligatorio',
            minLength: 'El mensaje debe tener al menos 10 caracteres',
            maxLength: 'El mensaje no puede exceder 1000 caracteres'
        }
    },
    
    // Configuración de UI
    ui: {
        submitDelay: 1000,
        successMessageDuration: 5000,
        errorMessageDuration: 7000
    }
};

// Variables globales
let formValidator = null;
let isSubmitting = false;
let emailjsInitialized = false;

// ===================================
// INICIALIZACIÓN DEL FORMULARIO
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('📧 Inicializando formulario de contacto...');
        
        initContactForm();
        initEmailJS();
        
        console.log('✅ Formulario de contacto inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar formulario:', error);
    }
});

/**
 * Inicializa el formulario de contacto
 */
function initContactForm() {
    try {
        const form = document.getElementById('contact-form');
        if (!form) {
            console.warn('⚠️ Formulario de contacto no encontrado');
            return;
        }
        
        // Inicializar validador
        formValidator = new FormValidator(form, FORM_CONFIG);
        
        // Event listeners
        form.addEventListener('submit', handleFormSubmit);
        
        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
        
        console.log('✅ Formulario configurado correctamente');
    } catch (error) {
        console.error('❌ Error al configurar formulario:', error);
    }
}

/**
 * Inicializa EmailJS
 */
function initEmailJS() {
    try {
        // Verificar si EmailJS está disponible
        if (typeof emailjs === 'undefined') {
            console.warn('⚠️ EmailJS no está cargado. Usando modo demo.');
            return;
        }
        
        // Inicializar EmailJS con la clave pública
        emailjs.init(FORM_CONFIG.emailjs.publicKey);
        emailjsInitialized = true;
        
        console.log('✅ EmailJS inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar EmailJS:', error);
    }
}

// ===================================
// CLASE VALIDADOR DE FORMULARIO
// ===================================

class FormValidator {
    constructor(form, config) {
        this.form = form;
        this.config = config;
        this.errors = {};
    }
    
    /**
     * Valida todo el formulario
     * @returns {boolean} - True si es válido
     */
    validateForm() {
        this.errors = {};
        let isValid = true;
        
        const fields = ['name', 'email', 'subject', 'message'];
        
        fields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Valida un campo específico
     * @param {Element} field - Campo a validar
     * @returns {boolean} - True si es válido
     */
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.config.validation[fieldName];
        const messages = this.config.errorMessages[fieldName];
        
        // Limpiar errores previos
        delete this.errors[fieldName];
        
        // Validar campo requerido
        if (!value) {
            this.errors[fieldName] = messages.required;
            return false;
        }
        
        // Validar longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            this.errors[fieldName] = messages.minLength;
            return false;
        }
        
        // Validar longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            this.errors[fieldName] = messages.maxLength;
            return false;
        }
        
        // Validar patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            this.errors[fieldName] = messages.pattern;
            return false;
        }
        
        return true;
    }
    
    /**
     * Obtiene los errores de validación
     * @returns {Object} - Objeto con errores
     */
    getErrors() {
        return this.errors;
    }
    
    /**
     * Verifica si hay errores
     * @returns {boolean} - True si hay errores
     */
    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }
}

// ===================================
// MANEJO DEL ENVÍO DEL FORMULARIO
// ===================================

/**
 * Maneja el envío del formulario
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
        console.log('📤 Procesando envío del formulario...');
        
        // Validar formulario
        if (!formValidator.validateForm()) {
            displayValidationErrors(formValidator.getErrors());
            return;
        }
        
        // Mostrar estado de carga
        setSubmittingState(true);
        
        // Obtener datos del formulario
        const formData = getFormData();
        
        // Enviar email
        const success = await sendEmail(formData);
        
        if (success) {
            handleSubmitSuccess();
        } else {
            handleSubmitError('Error al enviar el mensaje. Por favor intenta nuevamente.');
        }
        
    } catch (error) {
        console.error('❌ Error al enviar formulario:', error);
        handleSubmitError('Ocurrió un error inesperado. Por favor intenta más tarde.');
    } finally {
        setSubmittingState(false);
    }
}

/**
 * Obtiene los datos del formulario
 * @returns {Object} - Datos del formulario
 */
function getFormData() {
    const form = document.getElementById('contact-form');
    const formData = new FormData(form);
    
    return {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        subject: formData.get('subject').trim(),
        message: formData.get('message').trim(),
        timestamp: new Date().toLocaleString('es-ES'),
        userAgent: navigator.userAgent
    };
}

/**
 * Envía el email usando EmailJS
 * @param {Object} data - Datos del formulario
 * @returns {Promise<boolean>} - True si se envió correctamente
 */
async function sendEmail(data) {
    try {
        if (!emailjsInitialized) {
            // Modo demo - simular envío exitoso
            console.log('📧 Modo demo - Simulando envío de email:', data);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        }
        
        // Enviar con EmailJS
        const response = await emailjs.send(
            FORM_CONFIG.emailjs.serviceId,
            FORM_CONFIG.emailjs.templateId,
            {
                from_name: data.name,
                from_email: data.email,
                subject: data.subject,
                message: data.message,
                timestamp: data.timestamp,
                reply_to: data.email
            }
        );
        
        console.log('✅ Email enviado correctamente:', response);
        return true;
        
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        return false;
    }
}

// ===================================
// MANEJO DE ESTADOS DE UI
// ===================================

/**
 * Establece el estado de envío del formulario
 * @param {boolean} submitting - True si está enviando
 */
function setSubmittingState(submitting) {
    isSubmitting = submitting;
    
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (submitting) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

/**
 * Maneja el éxito del envío
 */
function handleSubmitSuccess() {
    console.log('✅ Formulario enviado exitosamente');
    
    // Limpiar formulario
    document.getElementById('contact-form').reset();
    
    // Mostrar mensaje de éxito
    showFormMessage('¡Mensaje enviado correctamente! Te responderé pronto.', 'success');
    
    // Limpiar errores
    clearAllFieldErrors();
    
    // Scroll al mensaje
    scrollToFormMessage();
}

/**
 * Maneja errores en el envío
 * @param {string} message - Mensaje de error
 */
function handleSubmitError(message) {
    console.error('❌ Error en envío del formulario:', message);
    
    // Mostrar mensaje de error
    showFormMessage(message, 'error');
    
    // Scroll al mensaje
    scrollToFormMessage();
}

// ===================================
// VALIDACIÓN EN TIEMPO REAL
// ===================================

/**
 * Valida un campo individual
 * @param {Element} field - Campo a validar
 */
function validateField(field) {
    const isValid = formValidator.validateField(field);
    
    if (!isValid) {
        const error = formValidator.getErrors()[field.name];
        showFieldError(field, error);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

/**
 * Muestra error en un campo
 * @param {Element} field - Campo con error
 * @param {string} message - Mensaje de error
 */
function showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
}

/**
 * Limpia el error de un campo
 * @param {Element} field - Campo a limpiar
 */
function clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
}

/**
 * Limpia todos los errores de campos
 */
function clearAllFieldErrors() {
    const fields = document.querySelectorAll('#contact-form input, #contact-form textarea');
    fields.forEach(field => clearFieldError(field));
}

/**
 * Muestra errores de validación
 * @param {Object} errors - Objeto con errores
 */
function displayValidationErrors(errors) {
    Object.keys(errors).forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            showFieldError(field, errors[fieldName]);
        }
    });
    
    // Hacer scroll al primer campo con error
    const firstErrorField = document.querySelector('.error');
    if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
    }
}

// ===================================
// MENSAJES DEL FORMULARIO
// ===================================

/**
 * Muestra un mensaje del formulario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success/error)
 */
function showFormMessage(message, type) {
    const messageElement = document.getElementById('form-message');
    
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.style.display = 'block';
        
        // Auto-ocultar después de un tiempo
        const duration = type === 'success' ? 
            FORM_CONFIG.ui.successMessageDuration : 
            FORM_CONFIG.ui.errorMessageDuration;
        
        setTimeout(() => {
            hideFormMessage();
        }, duration);
    }
}

/**
 * Oculta el mensaje del formulario
 */
function hideFormMessage() {
    const messageElement = document.getElementById('form-message');
    
    if (messageElement) {
        messageElement.style.display = 'none';
        messageElement.textContent = '';
        messageElement.className = 'form-message';
    }
}

/**
 * Hace scroll al mensaje del formulario
 */
function scrollToFormMessage() {
    const messageElement = document.getElementById('form-message');
    
    if (messageElement && messageElement.style.display !== 'none') {
        setTimeout(() => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// ===================================
// UTILIDADES
// ===================================

/**
 * Sanitiza el input del usuario
 * @param {string} input - Input a sanitizar
 * @returns {string} - Input sanitizado
 */
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres peligrosos
        .substring(0, 1000); // Limitar longitud
}

/**
 * Detecta si el usuario está usando un dispositivo móvil
 * @returns {boolean} - True si es móvil
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Valida que el email no sea de un dominio temporal
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
function isValidEmailDomain(email) {
    const tempDomains = [
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
        'tempmail.org'
    ];
    
    const domain = email.split('@')[1];
    return !tempDomains.includes(domain);
}

/**
 * Implementa rate limiting básico
 * @returns {boolean} - True si puede enviar
 */
function checkRateLimit() {
    const lastSubmit = localStorage.getItem('lastFormSubmit');
    const now = Date.now();
    const minInterval = 60000; // 1 minuto
    
    if (lastSubmit && (now - parseInt(lastSubmit)) < minInterval) {
        showFormMessage('Por favor espera un momento antes de enviar otro mensaje.', 'error');
        return false;
    }
    
    localStorage.setItem('lastFormSubmit', now.toString());
    return true;
}

// ===================================
// CONFIGURACIÓN ADICIONAL
// ===================================

/**
 * Configura EmailJS con las credenciales del usuario
 * @param {Object} credentials - Credenciales de EmailJS
 */
function configureEmailJS(credentials) {
    FORM_CONFIG.emailjs = {
        ...FORM_CONFIG.emailjs,
        ...credentials
    };
    
    if (typeof emailjs !== 'undefined') {
        emailjs.init(FORM_CONFIG.emailjs.publicKey);
        emailjsInitialized = true;
        console.log('✅ EmailJS reconfigurado');
    }
}

/**
 * Obtiene estadísticas del formulario
 * @returns {Object} - Estadísticas
 */
function getFormStats() {
    return {
        submissionsToday: localStorage.getItem('submissionsToday') || 0,
        lastSubmission: localStorage.getItem('lastFormSubmit'),
        totalSubmissions: localStorage.getItem('totalSubmissions') || 0
    };
}

// ===================================
// EVENTOS ADICIONALES
// ===================================

// Prevenir envío múltiple con Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const form = e.target.closest('#contact-form');
        if (form && !isSubmitting) {
            e.preventDefault();
            handleFormSubmit(e);
        }
    }
});

// Limpiar mensajes al hacer clic fuera
document.addEventListener('click', (e) => {
    const messageElement = document.getElementById('form-message');
    const form = document.getElementById('contact-form');
    
    if (messageElement && 
        messageElement.style.display !== 'none' && 
        !form.contains(e.target)) {
        hideFormMessage();
    }
});

// ===================================
// EXPORTAR PARA TESTING
// ===================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FormValidator,
        validateField,
        sanitizeInput,
        isValidEmailDomain,
        configureEmailJS,
        getFormStats
    };
}
