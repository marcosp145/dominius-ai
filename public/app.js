// =============================================
// CONFIGURACIÓN EMAILJS - TUS DATOS
// =============================================
const EMAIL_CONFIG = {
    serviceID: 'service_w443o2q',
    templateWelcome: 'template_spfox4j',
    templateRecovery: 'template_t60zh5m',
    publicKey: 'zI6wDcEbWx6vmkK5G'
};

// =============================================
// 1. INICIALIZAR EMAILJS
// =============================================
(function() {
    console.log('📧 Inicializando EmailJS...');
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
    getUsers: function() {
        try {
            const users = localStorage.getItem('dominius_users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error leyendo usuarios:', error);
            return [];
        }
    },

    saveUsers: function(users) {
        try {
            localStorage.setItem('dominius_users', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error guardando usuarios:', error);
            return false;
        }
    },

    register: function(name, username, email, password) {
        const users = this.getUsers();
        
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'El nombre de usuario ya está en uso' };
        }
        
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'El email ya está registrado' };
        }

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

        users.push(newUser);
        this.saveUsers(users);

        return { 
            success: true, 
            message: 'Cuenta creada exitosamente', 
            user: newUser 
        };
    },

    generateAvatarColor: function() {
        const colors = [
            '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
            '#EF4444', '#EC4899', '#14B8A6', '#F97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    login: function(usernameOrEmail, password) {
        const users = this.getUsers();
        const user = users.find(u => 
            (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
             u.email.toLowerCase() === usernameOrEmail.toLowerCase()) && 
            u.password === password
        );

        if (user) {
            user.lastLogin = new Date().toISOString();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = user;
                this.saveUsers(users);
            }
            
            localStorage.setItem('dominius_session', JSON.stringify(user));
            return { success: true, user: user };
        }

        return { success: false, message: 'Usuario o contraseña incorrectos' };
    },

    recoverPassword: function(email) {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            const recoveryData = {
                code: code,
                userId: user.id,
                expiresAt: Date.now() + 15 * 60 * 1000
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

    changePassword: function(userId, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        
        localStorage.removeItem(`recovery_${userId}`);
        
        return { success: true, message: 'Contraseña actualizada exitosamente' };
    },

    getSession: function() {
        try {
            const session = localStorage.getItem('dominius_session');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
    },

    logout: function() {
        localStorage.removeItem('dominius_session');
        window.location.href = 'index.html';
    }
};

// =============================================
// 3. FUNCIONES DE EMAIL
// =============================================

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
        const response = await emailjs.send(
            EMAIL_CONFIG.serviceID,
            EMAIL_CONFIG.templateWelcome,
            templateParams
        );
        
        console.log('✅ Email de bienvenida enviado:', response.status);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return { 
            success: false, 
            error: error.text || 'Error al enviar el email'
        };
    }
}

async function sendRecoveryEmail(user, code) {
    console.log('📧 Preparando email de recuperación para:', user.email);
    
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
        const response = await emailjs.send(
            EMAIL_CONFIG.serviceID,
            EMAIL_CONFIG.templateRecovery,
            templateParams
        );
        
        console.log('✅ Email de recuperación enviado:', response.status);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return { 
            success: false, 
            error: error.text || 'Error al enviar el email',
            code: code
        };
    }
}

// =============================================
// 4. FUNCIONES DE INTERFAZ
// =============================================

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
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

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function showLoading(show = true, message = 'Procesando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    
    if (show) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.login-screen').forEach(screen => {
        screen.classList.remove('visible');
    });

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
    
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
            
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
    
    // FORMULARIO DE LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUser').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!username || !password) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }
            
            showLoading(true, 'Iniciando sesión...');
            
            setTimeout(() => {
                const result = UserSystem.login(username, password);
                showLoading(false);
                
                if (result.success) {
                    showNotification(`¡Bienvenido, ${result.user.username}!`, 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'chat.html';
                    }, 1000);
                } else {
                    showNotification(result.message, 'error');
                }
            }, 1500);
        });
    }
    
    // FORMULARIO DE REGISTRO
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('regName').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            
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
            
            showLoading(true, 'Creando tu cuenta...');
            
            setTimeout(async () => {
                const result = UserSystem.register(name, username, email, password);
                
                if (result.success) {
                    showLoading(true, 'Enviando email de bienvenida...');
                    
                    try {
                        const emailResult = await sendWelcomeEmail(result.user);
                        showLoading(false);
                        
                        if (emailResult.success) {
                            showNotification('¡Cuenta creada! Revisa tu email', 'success');
                        } else {
                            showNotification('Cuenta creada correctamente', 'success');
                        }
                        
                        setTimeout(() => {
                            showScreen('loginScreen');
                            registerForm.reset();
                        }, 2000);
                        
                    } catch (error) {
                        showLoading(false);
                        showNotification('Cuenta creada correctamente', 'success');
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
    
    // FORMULARIO DE RECUPERACIÓN
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value.trim();
            
            if (!email || !email.includes('@')) {
                showNotification('Por favor ingresa un email válido', 'error');
                return;
            }
            
            showLoading(true, 'Buscando tu cuenta...');
            
            setTimeout(async () => {
                const result = UserSystem.recoverPassword(email);
                
                if (result.success) {
                    showLoading(true, 'Enviando código...');
                    
                    const emailResult = await sendRecoveryEmail(result.user, result.code);
                    
                    showLoading(false);
                    
                    if (emailResult.success) {
                        showNotification('✅ Código enviado a tu email', 'success');
                    } else {
                        showNotification(`Tu código es: ${result.code}`, 'info');
                    }
                    
                    showRecoveryCodeScreen(result.user.id);
                    forgotForm.reset();
                    
                } else {
                    showLoading(false);
                    showNotification('Si el email existe, recibirás un código', 'info');
                    setTimeout(() => {
                        showScreen('loginScreen');
                        forgotForm.reset();
                    }, 3000);
                }
            }, 1000);
        });
    }
    
    // NAVEGACIÓN
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
    
    console.log('✅ Eventos configurados correctamente');
});

// =============================================
// 6. PANTALLA DE CÓDIGO DE RECUPERACIÓN
// =============================================
function showRecoveryCodeScreen(userId) {
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
        
        document.body.insertAdjacentHTML('beforeend', screenHTML);
        
        const codeForm = document.getElementById('recoveryCodeForm');
        const backButton = document.getElementById('backToLoginFromCode');
        
        if (codeForm) {
            codeForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const code = document.getElementById('recoveryCodeInput').value.trim();
                const newPassword = document.getElementById('newPasswordInput').value;
                const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
                
                if (code.length !== 6 || !/^\d+$/.test(code)) {
                    showNotification('El código debe tener 6 dígitos', 'error');
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
                
                const verification = UserSystem.verifyRecoveryCode(userId, code);
                
                if (verification.success) {
                    const result = UserSystem.changePassword(userId, newPassword);
                    
                    if (result.success) {
                        showNotification('✅ Contraseña cambiada exitosamente', 'success');
                        
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
    
    showScreen('recoveryCodeScreen');
}// Agregar efectos de carga premium
document.addEventListener('DOMContentLoaded', function() {
    // Efecto de carga suave
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Efecto en botones al hacer click
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});
