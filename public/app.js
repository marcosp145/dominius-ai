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
// INTRO PROFESIONAL CON PARTÍCULAS (CORREGIDA)
// =============================================
(function() {
    const canvas = document.getElementById('particleCanvas');
    const textCanvas = document.getElementById('textCanvas');
    if (!canvas || !textCanvas) return;

    const ctx = canvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');

    let particles = [];
    let phase = 0; // 0: crecimiento, 1: formación, 2: temblor, 3: explosión
    let phaseStartTime = 0;
    let animationFrame;
    let width, height;
    let textPoints = []; // puntos objetivo (coordenadas de pantalla)

    const MAX_PARTICLES = 1500;        // número máximo de partículas
    const FORM_DURATION = 3000;        // 3s para formar el texto
    const SHAKE_DURATION = 800;         // 0.8s de temblor
    const EXPLODE_DURATION = 1500;      // 1.5s de explosión

    // Genera los puntos del texto "DOMINIUS AI" en coordenadas de pantalla
    function generateTextPoints() {
        const w = 1200; // resolución alta para muchos puntos
        const h = 300;
        textCanvas.width = w;
        textCanvas.height = h;
        textCtx.clearRect(0, 0, w, h);
        textCtx.font = 'bold 160px "Inter", "Helvetica Neue", sans-serif';
        textCtx.fillStyle = '#ffffff';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText('DOMINIUS AI', w/2, h/2);

        const imageData = textCtx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const points = [];

        // Escalado para centrar en pantalla
        const scaleX = width * 0.8 / w; // 80% del ancho
        const scaleY = height * 0.3 / h; // 30% del alto (para que no ocupe todo)
        const offsetX = (width - w * scaleX) / 2;
        const offsetY = (height - h * scaleY) / 2;

        for (let y = 0; y < h; y += 2) { // step 2 para densidad media
            for (let x = 0; x < w; x += 2) {
                const index = (y * w + x) * 4;
                if (data[index] > 128) {
                    const screenX = offsetX + x * scaleX;
                    const screenY = offsetY + y * scaleY;
                    points.push({ x: screenX, y: screenY });
                }
            }
        }
        return points;
    }

    // Crea una partícula aleatoria
    function createParticle(index) {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            startX: 0, startY: 0, // para interpolación
            targetX: 0, targetY: 0,
            size: Math.random() * 4 + 2,
            color: `rgba(139, 92, 246, ${Math.random() * 0.7 + 0.3})`,
            vx: 0, vy: 0 // para explosión
        };
    }

    // Reinicia las partículas con un número inicial
    function resetParticles(count) {
        textPoints = generateTextPoints();
        if (textPoints.length === 0) {
            console.warn('No se generaron puntos de texto');
            return;
        }
        particles = [];
        for (let i = 0; i < count; i++) {
            const p = createParticle(i);
            // Asignar un punto objetivo (cíclicamente)
            const target = textPoints[i % textPoints.length];
            p.targetX = target.x;
            p.targetY = target.y;
            particles.push(p);
        }
    }

    // Añade una partícula nueva (para fase de crecimiento)
    function addParticle() {
        if (particles.length >= MAX_PARTICLES) return;
        const index = particles.length;
        const p = createParticle(index);
        const target = textPoints[index % textPoints.length];
        p.targetX = target.x;
        p.targetY = target.y;
        particles.push(p);
    }

    // Ajustar al cambiar tamaño de ventana
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        if (textPoints.length > 0) {
            // Regenerar puntos y reasignar objetivos
            textPoints = generateTextPoints();
            particles.forEach((p, i) => {
                const target = textPoints[i % textPoints.length];
                p.targetX = target.x;
                p.targetY = target.y;
            });
        } else {
            resetParticles(100);
        }
    }

    window.addEventListener('resize', resizeCanvas);

    function animate(timestamp) {
        if (!phaseStartTime) phaseStartTime = timestamp;
        const elapsed = timestamp - phaseStartTime;

        if (phase === 0) {
            // Fase de crecimiento: añadir partículas poco a poco
            if (particles.length < MAX_PARTICLES && Math.random() < 0.4) {
                addParticle();
            }
            // Movimiento aleatorio suave
            particles.forEach(p => {
                p.x += (Math.random() - 0.5) * 3;
                p.y += (Math.random() - 0.5) * 3;
                // Mantener dentro de los bordes
                if (p.x < 0) p.x = 0;
                if (p.x > width) p.x = width;
                if (p.y < 0) p.y = 0;
                if (p.y > height) p.y = height;
            });
            // Después de 2 segundos, pasar a formación
            if (elapsed > 2000) {
                phase = 1;
                phaseStartTime = timestamp;
                // Guardar posición inicial para la interpolación
                particles.forEach(p => {
                    p.startX = p.x;
                    p.startY = p.y;
                });
            }
        } else if (phase === 1) {
            // Formación: interpolación hacia los puntos objetivo
            const progress = Math.min(elapsed / FORM_DURATION, 1);
            // Easing cubic-out
            const eased = 1 - Math.pow(1 - progress, 3);
            particles.forEach(p => {
                p.x = p.startX + (p.targetX - p.startX) * eased;
                p.y = p.startY + (p.targetY - p.startY) * eased;
            });
            if (progress >= 1) {
                phase = 2;
                phaseStartTime = timestamp;
            }
        } else if (phase === 2) {
            // Temblor: vibración alrededor del objetivo
            particles.forEach(p => {
                p.x = p.targetX + (Math.random() - 0.5) * 15;
                p.y = p.targetY + (Math.random() - 0.5) * 10;
            });
            if (elapsed > SHAKE_DURATION) {
                phase = 3;
                phaseStartTime = timestamp;
                // Preparar explosión: guardar posición y asignar velocidad radial
                particles.forEach(p => {
                    p.startX = p.x;
                    p.startY = p.y;
                    const angle = Math.atan2(p.y - height/2, p.x - width/2);
                    const speed = 8 + Math.random() * 10;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                });
            }
        } else if (phase === 3) {
            // Explosión
            const progress = Math.min(elapsed / EXPLODE_DURATION, 1);
            particles.forEach(p => {
                p.x = p.startX + p.vx * progress * 25;
                p.y = p.startY + p.vy * progress * 25;
                p.size = Math.max(0, 4 * (1 - progress));
            });
            if (progress >= 1) {
                // Terminar la intro
                cancelAnimationFrame(animationFrame);
                setTimeout(() => {
                    const session = UserSystem.getSession();
                    if (session) {
                        window.location.href = 'chat.html';
                    } else {
                        showScreen('loginScreen');
                    }
                }, 300);
                return;
            }
        }

        // Dibujar
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            if (p.size <= 0) return;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        animationFrame = requestAnimationFrame(animate);
    }

    // Iniciar
    function startIntro() {
        resizeCanvas();
        resetParticles(100); // empezamos con 100
        phase = 0;
        phaseStartTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
    }

    window.addEventListener('load', startIntro);
})();

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
