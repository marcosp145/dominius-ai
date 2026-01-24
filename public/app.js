// =============================================
// CONFIGURACIÓN EMAILJS - TUS DATOS
// =============================================
const EMAIL_CONFIG = {
    serviceID: 'service_w443o2q',        // Tu Service ID
    templateWelcome: 'template_spfox4j', // Template de bienvenida
    templateRecovery: 'template_t60zh5m', // Template de recuperación
    publicKey: 'zI6wDcEbWx6vmkK5G'       // Tu Public Key
};

// =============================================
// 1. INICIALIZAR EMAILJS
// =============================================
(function() {
    console.log('🔄 Inicializando EmailJS...');
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init(EMAIL_CONFIG.publicKey);
            console.log('✅ EmailJS inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando EmailJS:', error);
        }
    } else {
        console.error('❌ EmailJS no está cargado');
    }
})();

// =============================================
// 2. SISTEMA DE USUARIOS
// =============================================
const UserSystem = {
    // Obtener todos los usuarios
    getUsers: function() {
        try {
            const users = localStorage.getItem('dominius_users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error leyendo usuarios:', error);
            return [];
        }
    },

    // Guardar usuarios
    saveUsers: function(users) {
        try {
            localStorage.setItem('dominius_users', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error guardando usuarios:', error);
            return false;
        }
    },

    // Registrar nuevo usuario
    register: function(name, username, email, password) {
        const users = this.getUsers();
        
        // Validar que el username no exista
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'El nombre de usuario ya está en uso' };
        }
        
        // Validar que el email no exista
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'El email ya está registrado' };
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            name: name.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            avatarColor: this.generateAvatarColor()
        };

        // Guardar usuario
        users.push(newUser);
        this.saveUsers(users);

        return { 
            success: true, 
            message: 'Cuenta creada exitosamente', 
            user: newUser 
        };
    },

    // Generar color para avatar
    generateAvatarColor: function() {
        const colors = [
            '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
            '#EF4444', '#EC4899', '#14B8A6', '#F97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Iniciar sesión
    login: function(usernameOrEmail, password) {
        const users = this.getUsers();
        const user = users.find(u => 
            (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
             u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && 
            u.password === password
        );

        if (user) {
            // Actualizar último login
            user.lastLogin = new Date().toISOString();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = user;
                this.saveUsers(users);
            }
            
            // Guardar sesión
            localStorage.setItem('dominius_session', JSON.stringify(user));
            return { success: true, user: user };
        }

        return { success: false, message: 'Usuario o contraseña incorrectos' };
    },

    // Recuperar contraseña
    recoverPassword: function(email) {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            // Generar código de 6 dígitos
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Guardar código temporal (15 minutos)
            const recoveryData = {
                code: code,
                userId: user.id,
                expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutos
            };
            
            localStorage.setItem(`recovery_${user.id}`, JSON.stringify(recoveryData));
            
            return { 
                success: true, 
                user: user,
                code: code
            };
        }

        return { success: false, message: 'Email no encontrado en el sistema' };
    },

    // Verificar código de recuperación
    verifyRecoveryCode: function(userId, code) {
        const recoveryKey = `recovery_${userId}`;
        const recoveryData = JSON.parse(localStorage.getItem(recoveryKey) || '{}');
        
        if (!recoveryData.code || !recoveryData.expiresAt) {
            return { success: false, message: 'Código inválido o expirado' };
        }
        
        if (Date.now() > recoveryData.expiresAt) {
            localStorage.removeItem(recoveryKey);
            return { success: false, message: 'Código expirado' };
        }
        
        if (recoveryData.code !== code) {
            return { success: false, message: 'Código incorrecto' };
        }
        
        return { success: true };
    },

    // Cambiar contraseña
    changePassword: function(userId, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        // Actualizar contraseña
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        
        // Eliminar código de recuperación
        localStorage.removeItem(`recovery_${userId}`);
        
        return { success: true, message: 'Contraseña actualizada exitosamente' };
    },

    // Obtener sesión actual
    getSession: function() {
        try {
            const session = localStorage.getItem('dominius_session');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
    },

    // Cerrar sesión
    logout: function() {
        localStorage.removeItem('dominius_session');
        window.location.href = 'index.html';
    }
};

// =============================================
// 3. FUNCIONES DE EMAIL
// =============================================

// Enviar email de bienvenida
async function sendWelcomeEmail(user) {
    console.log('📧 Preparando email de bienvenida para:', user.email);
    
    const templateParams = {
        to_name: user.name,
        to_email: user.email,
        username: user.username,
        fecha_registro: new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        hora_registro: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        app_name: 'Dominius AI',
        app_url: window.location.origin
    };

    try {
        console.log('Enviando email con servicio:', EMAIL_CONFIG.serviceID);
        console.log('Template:', EMAIL_CONFIG.templateWelcome);
        
        const response = await emailjs.send(
            EMAIL_CONFIG.serviceID,
            EMAIL_CONFIG.templateWelcome,
            templateParams
        );
        
        console.log('✅ Email de bienvenida enviado:', response.status, response.text);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
        console.log('Status:', error.status);
        console.log('Texto:', error.text);
        
        return { 
            success: false, 
            error: error.text || 'Error al enviar el email'
        };
    }
}

// Enviar email de recuperación
async function sendRecoveryEmail(user, code) {
    console.log('📧 Preparando email de recuperación para:', user.email);
    console.log('Código:', code);
    
    const templateParams = {
        to_name: user.name,
        to_email: user.email,
        recovery_code: code,
        fecha_solicitud: new Date().toLocaleDateString('es-ES'),
        hora_solicitud: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        expires_in: '15 minutos',
        app_name: 'Dominius AI'
    };

    try {
        console.log('Enviando email con servicio:', EMAIL_CONFIG.serviceID);
        console.log('Template:', EMAIL_CONFIG.templateRecovery);
        
        const response = await emailjs.send(
            EMAIL_CONFIG.serviceID,
            EMAIL_CONFIG.templateRecovery,
            templateParams
        );
        
        console.log('✅ Email de recuperación enviado:', response.status, response.text);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        console.log('Status:', error.status);
        console.log('Texto:', error.text);
        
        return { 
            success: false, 
            error: error.text || 'Error al enviar el email',
            code: code // Devolvemos el código por si falla
        };
    }
}

// =============================================
// 4. FUNCIONES DE INTERFAZ
// =============================================

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.warn('Elemento de notificación no encontrado');
        return;
    }
    
    // Icono según tipo
    let icon = '';
    switch(type) {
        case 'success': icon = '✅'; break;
        case 'error': icon = '❌'; break;
        case 'warning': icon = '⚠️'; break;
        default: icon = 'ℹ️';
    }
    
    notification.innerHTML = `<span style="margin-right: 8px;">${icon}</span> ${message}`;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    // Ocultar después de 4 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Mostrar/ocultar loading
function showLoading(show = true, message = 'Procesando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        console.warn('Elemento de loading no encontrado');
        return;
    }
    
    if (show) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Cambiar entre pantallas
function showScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.login-screen').forEach(screen => {
        screen.classList.remove('visible');
    });

    // Mostrar la pantalla solicitada
    setTimeout(() => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('visible');
        }
    }, 100);
}

// =============================================
// 5. CONFIGURACIÓN DE EVENTOS
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, configurando eventos...');
    
    // Animación de bienvenida inicial
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
            
            // Verificar si hay sesión activa
            const session = UserSystem.getSession();
            if (session) {
                console.log('Sesión encontrada, redirigiendo...');
                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1000);
            } else {
                console.log('No hay sesión, mostrando login...');
                setTimeout(() => {
                    showScreen('loginScreen');
                }, 500);
            }
        }
    }, 4800);
    
    // =============================================
    // FORMULARIO DE LOGIN
    // =============================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUser').value.trim();
            const password = document.getElementById('loginPassword').value;
            const remember = document.getElementById('rememberMe').checked;
            
            // Validaciones básicas
            if (!username || !password) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Mostrar loading
            showLoading(true, 'Iniciando sesión...');
            
            // Intentar login después de un breve delay
            setTimeout(() => {
                const result = UserSystem.login(username, password);
                showLoading(false);
                
                if (result.success) {
                    showNotification(`¡Bienvenido, ${result.user.username}!`, 'success');
                    
                    // Redirigir al chat
                    setTimeout(() => {
                        window.location.href = 'chat.html';
                    }, 1000);
                } else {
                    showNotification(result.message, 'error');
                }
            }, 1500);
        });
    }
    
    // =============================================
    // FORMULARIO DE REGISTRO
    // =============================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('regName').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            
            // Validaciones
            if (!name || !username || !email || !password || !confirmPassword) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                showNotification('Por favor ingresa un email válido', 'error');
                return;
            }
            
            // Registrar usuario
            showLoading(true, 'Creando tu cuenta...');
            
            setTimeout(async () => {
                const result = UserSystem.register(name, username, email, password);
                
                if (result.success) {
                    // Intentar enviar email de bienvenida
                    showLoading(true, 'Enviando email de bienvenida...');
                    
                    try {
                        const emailResult = await sendWelcomeEmail(result.user);
                        showLoading(false);
                        
                        if (emailResult.success) {
                            showNotification('¡Cuenta creada! Revisa tu email de bienvenida', 'success');
                        } else {
                            showNotification('Cuenta creada. ' + (emailResult.error || ''), 'info');
                        }
                        
                        // Volver al login después de 2 segundos
                        setTimeout(() => {
                            showScreen('loginScreen');
                            registerForm.reset();
                        }, 2000);
                        
                    } catch (error) {
                        showLoading(false);
                        showNotification('Cuenta creada. Error al enviar email', 'info');
                        setTimeout(() => {
                            showScreen('loginScreen');
                            registerForm.reset();
                        }, 2000);
                    }
                    
                } else {
                    showLoading(false);
                    showNotification(result.message, 'error');
                }
            }, 1000);
        });
    }
    
    // =============================================
    // FORMULARIO DE RECUPERACIÓN - CORREGIDO
    // =============================================
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value.trim();
            
            // Validar email
            if (!email || !email.includes('@') || !email.includes('.')) {
                showNotification('Por favor ingresa un email válido', 'error');
                return;
            }
            
            showLoading(true, 'Buscando tu cuenta...');
            
            setTimeout(async () => {
                const result = UserSystem.recoverPassword(email);
                
                if (result.success) {
                    // INTENTAR ENVIAR EMAIL REAL
                    showLoading(true, 'Enviando código a tu email...');
                    
                    const emailResult = await sendRecoveryEmail(result.user, result.code);
                    
                    showLoading(false);
                    
                    if (emailResult.success) {
                        // ÉXITO: Email enviado correctamente
                        showNotification('✅ Código enviado a tu email', 'success');
                        showNotification('Revisa tu bandeja de entrada (y spam)', 'info');
                    } else {
                        // FALLO: Mostrar el código y error
                        showNotification(`📧 ${emailResult.error || 'Error al enviar email'}`, 'warning');
                        showNotification(`Tu código es: ${result.code}`, 'info');
                    }
                    
                    // Mostrar pantalla para ingresar código
                    showRecoveryCodeScreen(result.user.id);
                    
                    // Limpiar formulario
                    forgotForm.reset();
                    
                } else {
                    showLoading(false);
                    // Por seguridad, no revelamos si el email existe
                    showNotification('Si el email existe en nuestro sistema, recibirás un código de recuperación', 'info');
                    setTimeout(() => {
                        showScreen('loginScreen');
                        forgotForm.reset();
                    }, 3000);
                }
            }, 1000);
        });
    }
    
    // =============================================
    // NAVEGACIÓN ENTRE PANTALLAS
    // =============================================
    document.getElementById('showRegister')?.addEventListener('click', () => {
        showScreen('registerScreen');
    });
    
    document.getElementById('showLogin')?.addEventListener('click', () => {
        showScreen('loginScreen');
    });
    
    document.getElementById('showForgotPassword')?.addEventListener('click', () => {
        showScreen('forgotPasswordScreen');
    });
    
    document.getElementById('backToLogin')?.addEventListener('click', () => {
        showScreen('loginScreen');
    });
    
    console.log('✅ Todos los eventos configurados correctamente');
});

// =============================================
// 6. PANTALLA DE CÓDIGO DE RECUPERACIÓN
// =============================================
function showRecoveryCodeScreen(userId) {
    // Crear la pantalla si no existe
    if (!document.getElementById('recoveryCodeScreen')) {
        const screenHTML = `
            <div class="login-screen" id="recoveryCodeScreen">
                <div class="login-box">
                    <h2 class="login-title">Verificar Código</h2>
                    <p class="forgot-info">Ingresa el código que recibiste en tu email</p>
                    <form id="recoveryCodeForm">
                        <div class="input-group">
                            <label>Código de 6 dígitos</label>
                            <input type="text" id="recoveryCodeInput" 
                                   placeholder="123456" 
                                   maxlength="6" 
                                   pattern="[0-9]{6}"
                                   required>
                        </div>
                        <div class="input-group">
                            <label>Nueva Contraseña</label>
                            <input type="password" id="newPasswordInput" 
                                   placeholder="Mínimo 6 caracteres" 
                                   minlength="6"
                                   required>
                        </div>
                        <div class="input-group">
                            <label>Confirmar Nueva Contraseña</label>
                            <input type="password" id="confirmNewPasswordInput" 
                                   placeholder="Repite la contraseña" 
                                   minlength="6"
                                   required>
                        </div>
                        <button type="submit" class="login-button">Cambiar Contraseña</button>
                    </form>
                    <div class="form-footer">
                        <span class="link" id="backToLoginFromCode">Volver al inicio de sesión</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar la pantalla en el DOM
        document.body.insertAdjacentHTML('beforeend', screenHTML);
        
        // Configurar eventos de la nueva pantalla
        const codeForm = document.getElementById('recoveryCodeForm');
        const backButton = document.getElementById('backToLoginFromCode');
        
        if (codeForm) {
            codeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const code = document.getElementById('recoveryCodeInput').value.trim();
                const newPassword = document.getElementById('newPasswordInput').value;
                const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
                
                // Validaciones
                if (code.length !== 6 || !/^\d+$/.test(code)) {
                    showNotification('El código debe tener 6 dígitos numéricos', 'error');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    showNotification('Las contraseñas no coinciden', 'error');
                    return;
                }
                
                if (newPassword.length < 6) {
                    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                
                // Verificar código
                const verification = UserSystem.verifyRecoveryCode(userId, code);
                
                if (verification.success) {
                    // Cambiar contraseña
                    const result = UserSystem.changePassword(userId, newPassword);
                    
                    if (result.success) {
                        showNotification('✅ Contraseña cambiada exitosamente', 'success');
                        
                        // Volver al login después de 2 segundos
                        setTimeout(() => {
                            showScreen('loginScreen');
                            codeForm.reset();
                        }, 2000);
                    } else {
                        showNotification(result.message, 'error');
                    }
                } else {
                    showNotification(verification.message, 'error');
                }
            });
        }
        
        if (backButton) {
            backButton.addEventListener('click', () => {
                showScreen('loginScreen');
            });
        }
    }
    
    // Mostrar la pantalla de código
    showScreen('recoveryCodeScreen');
}

// =============================================
// 7. ESTILOS ADICIONALES (se inyectan automáticamente)
// =============================================
(function injectStyles() {
    const styles = `
        <style>
            /* Efectos de transición suaves */
            .login-screen {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .login-screen.visible {
                animation: fadeInScale 0.4s ease-out;
            }
            
            @keyframes fadeInScale {
                0% {
                    opacity: 0;
                    transform: scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            /* Mejoras para inputs */
            .input-group input:valid {
                border-color: #10B981;
            }
            
            .input-group input:invalid:not(:placeholder-shown) {
                border-color: #EF4444;
            }
            
            /* Efecto hover para botones */
            .login-button, .link {
                transition: all 0.2s ease;
            }
            
            .login-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(138, 43, 226, 0.4);
            }
            
            .link:hover {
                color: #c4b5fd !important;
            }
            
            /* Spinner mejorado */
            .spinner {
                border-width: 3px;
                border-style: solid;
                border-color: rgba(138, 92, 246, 0.2);
                border-top-color: #8B5CF6;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Responsive mejorado */
            @media (max-width: 768px) {
                .login-box {
                    width: 90%;
                    padding: 30px 20px;
                    margin: 10px;
                }
                
                .login-title {
                    font-size: 28px;
                }
                
                .input-group input {
                    padding: 12px 15px;
                    font-size: 16px;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
})();