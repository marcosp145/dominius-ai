// =============================================
// CONFIGURACIÓN EMAILJS – DEFINITIVA
// =============================================
const EMAIL_CONFIG = {
    serviceID: 'service_d768gfo',
    templateWelcome: 'template_5j920rq',
    templateRecovery: 'template_mkoq89e',
    publicKey: 'ZnDRVMG-WjptFNglK',
    developerEmail: 'dominius.ai@gmail.com'
};

// =============================================
// INICIALIZAR EMAILJS
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
// SISTEMA DE USUARIOS (sin cambios)
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
        return { success: true, message: 'Cuenta creada exitosamente', user: newUser };
    },
    generateAvatarColor: function() {
        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
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
            const recoveryData = { code, userId: user.id, expiresAt: Date.now() + 15 * 60 * 1000 };
            localStorage.setItem(`recovery_${user.id}`, JSON.stringify(recoveryData));
            return { success: true, user, code };
        }
        return { success: false, message: 'Email no encontrado en el sistema' };
    },
    verifyRecoveryCode: function(userId, code) {
        const recoveryKey = `recovery_${userId}`;
        const recoveryData = JSON.parse(localStorage.getItem(recoveryKey) || '{}');
        if (!recoveryData.code || !recoveryData.expiresAt) return { success: false, message: 'Código inválido o expirado' };
        if (Date.now() > recoveryData.expiresAt) {
            localStorage.removeItem(recoveryKey);
            return { success: false, message: 'Código expirado' };
        }
        if (recoveryData.code !== code) return { success: false, message: 'Código incorrecto' };
        return { success: true };
    },
    changePassword: function(userId, newPassword) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return { success: false, message: 'Usuario no encontrado' };
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
// FUNCIONES DE EMAIL (sin cambios)
// =============================================
async function sendWelcomeEmail(user) {
    console.log('📧 Enviando email de bienvenida...');
    const userParams = {
        to_name: user.name,
        to_email: user.email,
        user_name: user.name,
        user_username: user.username,
        user_email: user.email,
        fecha_registro: new Date().toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        hora_registro: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit'
        }),
        app_name: 'Dominius AI'
    };
    const devParams = {
        to_name: 'Admin',
        to_email: EMAIL_CONFIG.developerEmail,
        user_name: user.name,
        user_username: user.username,
        user_email: user.email,
        fecha_registro: userParams.fecha_registro,
        hora_registro: userParams.hora_registro,
        app_name: 'Dominius AI'
    };
    try {
        await emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateWelcome, userParams);
        console.log('✅ Bienvenida enviada a:', user.email);
        await emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateWelcome, devParams);
        console.log('✅ Copia para admin enviada a:', EMAIL_CONFIG.developerEmail);
        return { success: true };
    } catch (error) {
        console.error('❌ Error en sendWelcomeEmail:', error);
        return { success: false, error };
    }
}

async function sendRecoveryEmail(user, code) {
    console.log('📧 Enviando email de recuperación...');
    const userParams = {
        to_name: user.name,
        to_email: user.email,
        user_name: user.name,
        user_email: user.email,
        recovery_code: code
    };
    const devParams = {
        to_name: 'Admin',
        to_email: EMAIL_CONFIG.developerEmail,
        user_name: user.name,
        user_email: user.email,
        recovery_code: code
    };
    try {
        await emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateRecovery, userParams);
        console.log('✅ Código enviado a:', user.email);
        await emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateRecovery, devParams);
        console.log('✅ Copia para admin enviada a:', EMAIL_CONFIG.developerEmail);
        return { success: true };
    } catch (error) {
        console.error('❌ Error en sendRecoveryEmail:', error);
        return { success: false, error };
    }
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
}

function showLoading(show = true, message = 'Procesando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    const loadingText = overlay.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    if (show) overlay.classList.add('active');
    else overlay.classList.remove('active');
}

function showScreen(screenId) {
    document.querySelectorAll('.login-screen').forEach(screen => screen.classList.remove('visible'));
    const screen = document.getElementById(screenId);
    if (screen) setTimeout(() => screen.classList.add('visible'), 100);
}

// =============================================
// INTRO SIMPLE
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    const intro = document.getElementById('intro');
    
    // Duración de la intro: 3 segundos
    setTimeout(() => {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
            // Comprobar si hay sesión activa
            const session = UserSystem.getSession();
            if (session) {
                window.location.href = 'chat.html';
            } else {
                showScreen('loginScreen');
            }
        }, 1000); // tiempo del fade-out
    }, 3000);
});

// =============================================
// EVENTOS DE NAVEGACIÓN ENTRE PANTALLAS
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('showRegister')?.addEventListener('click', () => showScreen('registerScreen'));
    document.getElementById('showLogin')?.addEventListener('click', () => showScreen('loginScreen'));
    document.getElementById('showForgotPassword')?.addEventListener('click', () => showScreen('forgotPasswordScreen'));
    document.getElementById('backToLogin')?.addEventListener('click', () => showScreen('loginScreen'));

    // ========== LOGIN ==========
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUser').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) return showNotification('Completa todos los campos', 'error');
            showLoading(true, 'Iniciando sesión...');
            setTimeout(() => {
                const result = UserSystem.login(username, password);
                showLoading(false);
                if (result.success) {
                    showNotification('¡Bienvenido!', 'success');
                    setTimeout(() => window.location.href = 'chat.html', 1000);
                } else {
                    showNotification(result.message, 'error');
                }
            }, 1000);
        });
    }

    // ========== REGISTRO ==========
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (!name || !username || !email || !password || !confirmPassword) 
                return showNotification('Completa todos los campos', 'error');
            if (password !== confirmPassword) 
                return showNotification('Las contraseñas no coinciden', 'error');
            if (password.length < 6) 
                return showNotification('Mínimo 6 caracteres', 'error');
            if (!email.includes('@') || !email.includes('.')) 
                return showNotification('Email inválido', 'error');

            showLoading(true, 'Creando cuenta...');
            setTimeout(async () => {
                const result = UserSystem.register(name, username, email, password);
                if (result.success) {
                    showLoading(true, 'Enviando notificación...');
                    const emailRes = await sendWelcomeEmail(result.user);
                    showLoading(false);
                    if (emailRes.success) {
                        showNotification('Cuenta creada y notificación enviada', 'success');
                    } else {
                        showNotification('Cuenta creada, pero falló el email', 'warning');
                    }
                    setTimeout(() => {
                        showScreen('loginScreen');
                        registerForm.reset();
                    }, 2000);
                } else {
                    showLoading(false);
                    showNotification(result.message, 'error');
                }
            }, 1000);
        });
    }

    // ========== RECUPERACIÓN ==========
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            if (!email || !email.includes('@')) 
                return showNotification('Email válido requerido', 'error');

            showLoading(true, 'Buscando cuenta...');
            setTimeout(async () => {
                const result = UserSystem.recoverPassword(email);
                if (result.success) {
                    showLoading(true, 'Enviando código...');
                    const emailRes = await sendRecoveryEmail(result.user, result.code);
                    showLoading(false);
                    if (emailRes.success) {
                        showNotification('Código enviado al usuario y copia al admin', 'success');
                    } else {
                        showNotification('Código generado, pero falló el envío', 'warning');
                    }
                    showRecoveryCodeScreen(result.user.id);
                    forgotForm.reset();
                } else {
                    showLoading(false);
                    showNotification('Si el email existe, se enviará un código', 'info');
                    setTimeout(() => {
                        showScreen('loginScreen');
                        forgotForm.reset();
                    }, 3000);
                }
            }, 1000);
        });
    }
});

// =============================================
// PANTALLA DE CÓDIGO DE RECUPERACIÓN (sin cambios)
// =============================================
function showRecoveryCodeScreen(userId) {
    if (!document.getElementById('recoveryCodeScreen')) {
        const screenHTML = `
            <div class="login-screen" id="recoveryCodeScreen">
                <div class="login-box">
                    <h2 class="login-title">Verificar Código</h2>
                    <p class="forgot-info">Ingresa el código que recibiste</p>
                    <form id="recoveryCodeForm">
                        <div class="input-group">
                            <label>Código de 6 dígitos</label>
                            <input type="text" id="recoveryCodeInput" placeholder="123456" maxlength="6" pattern="[0-9]{6}" required>
                        </div>
                        <div class="input-group">
                            <label>Nueva Contraseña</label>
                            <input type="password" id="newPasswordInput" placeholder="Mínimo 6 caracteres" minlength="6" required>
                        </div>
                        <div class="input-group">
                            <label>Confirmar Nueva Contraseña</label>
                            <input type="password" id="confirmNewPasswordInput" placeholder="Repite la contraseña" minlength="6" required>
                        </div>
                        <button type="submit" class="login-button">Cambiar Contraseña</button>
                    </form>
                    <div class="form-footer">
                        <span class="link" id="backToLoginFromCode">Volver al inicio</span>
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
                if (code.length !== 6 || !/^\d+$/.test(code)) 
                    return showNotification('Código inválido', 'error');
                if (newPassword !== confirmPassword) 
                    return showNotification('Contraseñas no coinciden', 'error');
                if (newPassword.length < 6) 
                    return showNotification('Mínimo 6 caracteres', 'error');
                const verification = UserSystem.verifyRecoveryCode(userId, code);
                if (verification.success) {
                    const result = UserSystem.changePassword(userId, newPassword);
                    if (result.success) {
                        showNotification('✅ Contraseña cambiada', 'success');
                        setTimeout(() => { showScreen('loginScreen'); codeForm.reset(); }, 2000);
                    } else showNotification(result.message, 'error');
                } else showNotification(verification.message, 'error');
            });
        }
        if (backButton) backButton.addEventListener('click', () => showScreen('loginScreen'));
    }
    showScreen('recoveryCodeScreen');
}

console.log('✅ app.js final – Todo listo');
