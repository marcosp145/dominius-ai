// =============================================
// DOMINIUS AI - CHAT DEFINITIVO
// =============================================

// Variables globales
let attachedFiles = [];
let currentChatId = null;
let currentMode = 'general';
let isAIResponding = false;
let stopGeneration = false;
let currentAIMessage = '';

// Variables para pausa/reanudar
let typewriterInterval = null;
let typewriterElement = null;
let typewriterFullText = '';
let typewriterIndex = 0;
let isPaused = false;

// 🔑 API KEY eliminada del frontend por seguridad.
// Las llamadas a Groq se hacen a través de /api/groq (Netlify Function)
// La key real está guardada en las variables de entorno de Netlify.

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dominius AI - Iniciando sistema...');
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        console.log('❌ No hay sesión activa, redirigiendo...');
        window.location.href = 'index.html';
        return;
    }
    initUserData();
    initEvents();
    loadChatsList();
    initParticles();
    setTimeout(() => {
        const input = document.getElementById('messageInput');
        if (input) { input.focus(); input.value = ''; updateCharCount(); autoResizeTextarea(); }
    }, 500);
    console.log('✅ Dominius AI - Sistema listo');
});

// =============================================
// CONFIGURACIÓN DE EVENTOS
// =============================================
function initEvents() {
    console.log('⚙️ Configurando eventos...');

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('dominius_session');
            window.location.href = 'index.html';
        }
    });

    // Pestañas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.getElementById(tabName + 'Panel')?.classList.add('active');
        });
    });

    // Nuevo chat
    document.getElementById('newChatBtn')?.addEventListener('click', createNewChat);

    // Modos
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.getAttribute('data-mode');
            document.getElementById('currentMode').textContent = 'Modo: ' + getModeName(currentMode);
            showNotification(`Modo ${getModeName(currentMode)} activado`, 'info');
            if (!currentChatId) createNewChat();
        });
    });

    // Limpiar / Eliminar chat
    document.getElementById('clearChatBtn')?.addEventListener('click', function() {
        if (currentChatId && confirm('¿Limpiar este chat?')) clearCurrentChat();
    });
    document.getElementById('deleteChatBtn')?.addEventListener('click', function() {
        if (currentChatId && confirm('¿Eliminar este chat permanentemente?')) deleteCurrentChat();
    });

    // Archivos adjuntos
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
                const content = await readFileContent(file);
                attachedFiles.push({ name: file.name, size: file.size, type: file.type, content });
            }
            updateAttachedFiles();
            e.target.value = '';
            if (files.length) showNotification(`✅ ${files.length} archivo(s) adjuntado(s)`, 'success');
            updateButtonState(); // Actualizar botón al adjuntar
        });
    }

    // ========== BOTÓN INTELIGENTE ==========
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    window.hasContent = function() {
        return messageInput.value.trim() !== '' || attachedFiles.length > 0;
    };

    window.updateButtonState = function() {
        if (!sendBtn) return;
        const content = hasContent();

        if (content) {
            // Siempre modo ENVIAR (aunque IA responda)
            sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
            sendBtn.title = 'Enviar mensaje';
            sendBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)';
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.cursor = 'pointer';
        } else {
            // Sin contenido
            if (isAIResponding) {
                // Modo pausa/reanudar
                if (isPaused) {
                    sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
                    sendBtn.title = 'Reanudar';
                    sendBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                } else {
                    sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
                    sendBtn.title = 'Pausar';
                    sendBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                }
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                sendBtn.style.cursor = 'pointer';
            } else {
                // Sin contenido y sin respuesta → botón deshabilitado
                sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
                sendBtn.title = 'Escribe un mensaje';
                sendBtn.style.background = 'rgba(139, 92, 246, 0.3)';
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.6';
                sendBtn.style.cursor = 'not-allowed';
            }
        }
    };

    // Evento click del botón
    sendBtn?.addEventListener('click', function() {
        if (hasContent()) {
            sendUserMessage();
        } else {
            if (isAIResponding) {
                // Pausar / Reanudar
                if (isPaused) {
                    isPaused = false;
                    if (typewriterElement && typewriterFullText) {
                        typeWriter(typewriterElement, typewriterFullText, typewriterIndex, 35);
                    }
                } else {
                    isPaused = true;
                    if (typewriterInterval) {
                        clearInterval(typewriterInterval);
                        typewriterInterval = null;
                    }
                }
                updateButtonState();
            }
        }
    });

    // Eventos del input
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            updateCharCount();
            autoResizeTextarea();
            updateButtonState();
        });
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (hasContent()) sendUserMessage();
            }
        });
    }

    console.log('✅ Eventos configurados');
}

// =============================================
// LEER ARCHIVOS
// =============================================
async function readFileContent(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(`[Error leyendo archivo: ${file.name}]`);
        if (file.type.startsWith('text/') || ['application/json', 'text/plain'].includes(file.type) || /\.(txt|js|html|css|md|json)$/i.test(file.name)) {
            reader.readAsText(file);
        } else {
            resolve(`[Archivo: ${file.name}, ${formatFileSize(file.size)}]`);
        }
    });
}

// =============================================
// EFECTO MÁQUINA DE ESCRIBIR
// =============================================
function typeWriter(element, text, startIndex = 0, speed = 35) {
    return new Promise((resolve) => {
        typewriterElement = element;
        typewriterFullText = text;
        typewriterIndex = startIndex;
        if (startIndex === 0) element.innerHTML = '';
        if (typewriterInterval) clearInterval(typewriterInterval);
        typewriterInterval = setInterval(() => {
            if (stopGeneration) {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
                resolve();
                return;
            }
            if (isPaused) return;
            if (typewriterIndex < typewriterFullText.length) {
                element.innerHTML = formatAIResponse(typewriterFullText.substring(0, typewriterIndex + 1));
                typewriterIndex++;
                const container = document.getElementById('messagesContainer');
                if (container) container.scrollTop = container.scrollHeight;
            } else {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
                resolve();
            }
        }, speed);
    });
}

// =============================================
// ENVIAR MENSAJE (ABORTA RESPUESTA ANTERIOR)
// =============================================
async function sendUserMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    // Abortar respuesta anterior
    if (isAIResponding) {
        stopGeneration = true;
        if (typewriterInterval) {
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
        isAIResponding = false;
        isPaused = false;
        updateButtonState();
    }

    const message = messageInput.value.trim();
    if (!message && attachedFiles.length === 0) return;

    if (!currentChatId) createNewChat();

    let fullMessage = message;
    if (attachedFiles.length > 0) {
        fullMessage += '\n\n--- Archivos adjuntos ---\n';
        attachedFiles.forEach(file => {
            fullMessage += `\n📎 ${file.name} (${formatFileSize(file.size)}):\n${file.content}\n`;
        });
    }

    addUserMessage(message, attachedFiles);
    messageInput.value = '';
    attachedFiles = [];
    updateAttachedFiles();
    updateCharCount();
    autoResizeTextarea();
    saveMessageToChat(currentChatId, 'user', fullMessage);
    updateButtonState();

    await getAIResponse(fullMessage);
}

// =============================================
// OBTENER RESPUESTA DE IA
// =============================================
async function getAIResponse(userMessage) {
    isAIResponding = true;
    stopGeneration = false;
    isPaused = false;
    typewriterIndex = 0;
    currentAIMessage = '';
    updateButtonState();

    const container = document.getElementById('messagesContainer');
    if (!container) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="message-avatar ai-avatar"><span>AI</span></div><div class="message-content-wrapper"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;

    try {
        const chatHistory = getChatHistory(currentChatId);
        const messages = [
            { role: 'system', content: getModeSystemPrompt(currentMode) },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
        ];


        // Llamamos a nuestra Netlify Function (key segura en el servidor)
        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                max_tokens: 8000
            })
        });

        if (!response.ok) throw new Error('Error en la API');

        const data = await response.json();
        currentAIMessage = data.choices?.[0]?.message?.content || '';

        typingDiv.remove();

        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai-message';
        aiMessageDiv.innerHTML = `<div class="message-avatar ai-avatar"><span>AI</span></div><div class="message-content-wrapper"><div class="message-content"></div><div class="message-time">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div></div>`;
        container.appendChild(aiMessageDiv);

        const contentDiv = aiMessageDiv.querySelector('.message-content');

        // El efecto typewriter sigue funcionando igual
        if (!stopGeneration && currentAIMessage) {
            await typeWriter(contentDiv, currentAIMessage, 0, 35);
        } else {
            contentDiv.innerHTML = formatAIResponse(currentAIMessage);
        }

        saveMessageToChat(currentChatId, 'assistant', currentAIMessage);
        addCopyButton(aiMessageDiv, currentAIMessage);

    } catch (error) {
        console.error('Error obteniendo respuesta:', error);
        typingDiv.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai-message';
        errorDiv.innerHTML = `<div class="message-avatar ai-avatar"><span>AI</span></div><div class="message-content-wrapper"><div class="message-content">❌ Error al obtener respuesta. Por favor intenta de nuevo.</div></div>`;
        container.appendChild(errorDiv);
    }

    isAIResponding = false;
    stopGeneration = false;
    isPaused = false;
    typewriterInterval = null;
    updateButtonState();
}

// =============================================
// FORMATEAR RESPUESTA
// =============================================
function formatAIResponse(text) {
    if (!text) return '';
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// =============================================
// AÑADIR MENSAJE DEL USUARIO
// =============================================
function addUserMessage(message, files = []) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.style.display = 'none';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';

    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    const initials = session.name ? session.name.substring(0, 2).toUpperCase() : 'U';

    let filesHTML = '';
    if (files.length) {
        filesHTML = '<div class="message-files">' + files.map(f => `<div class="file-tag">📎 ${f.name} (${formatFileSize(f.size)})</div>`).join('') + '</div>';
    }

    const timeString = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-content-wrapper">
            <div class="message-content">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            ${filesHTML}
            <div class="message-time">${timeString}</div>
        </div>
        <div class="message-avatar user-avatar"><span>${initials}</span></div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// =============================================
// BOTÓN COPIAR
// =============================================
function addCopyButton(messageDiv, content) {
    const wrapper = messageDiv.querySelector('.message-content-wrapper');
    if (!wrapper) return;
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.title = 'Copiar';
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.innerHTML = '✓';
            setTimeout(() => copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`, 2000);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copyBtn.innerHTML = '✓';
            setTimeout(() => copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`, 2000);
        });
    });
    wrapper.appendChild(copyBtn);
}

// =============================================
// ARCHIVOS ADJUNTOS
// =============================================
function updateAttachedFiles() {
    const container = document.getElementById('attachedFilesContainer');
    if (!container) return;
    if (attachedFiles.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    container.style.display = 'flex';
    container.innerHTML = attachedFiles.map((file, i) => `
        <div class="attached-file-item">
            <span class="file-icon">📎</span>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="remove-file-btn" onclick="removeFile(${i})">×</button>
        </div>
    `).join('');
}

window.removeFile = function(index) {
    attachedFiles.splice(index, 1);
    updateAttachedFiles();
    updateButtonState();
};

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================
// GESTIÓN DE CHATS
// =============================================
function createNewChat() {
    const chatId = 'chat_' + Date.now();
    currentChatId = chatId;
    const chat = {
        id: chatId,
        title: 'Nuevo Chat',
        mode: currentMode,
        messages: [],
        createdAt: new Date().toISOString()
    };
    const chats = getChats();
    chats.unshift(chat);
    saveChats(chats);
    loadChatsList();
    loadChat(chatId);
    document.getElementById('currentChatTitle').textContent = 'Nuevo Chat';
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const container = document.getElementById('messagesContainer');
    if (!container) return;
    container.innerHTML = '';

    if (chat.messages.length === 0) {
        container.innerHTML = `<div class="welcome-message">
            <div class="welcome-logo">
                <div class="da-logo">
                    <span class="d-letter">D</span>
                    <span class="a-letter">A</span>
                </div>
            </div>
            <h2>¡Hola! Soy Dominius AI</h2>
            <p>Tu asistente empresarial de élite. ¿En qué puedo ayudarte hoy?</p>
        </div>`;
    } else {
        chat.messages.forEach(msg => {
            if (msg.role === 'user') addUserMessage(msg.content, []);
            else if (msg.role === 'assistant') addAIMessage(msg.content, msg.timestamp);
        });
    }
    document.getElementById('currentChatTitle').textContent = chat.title;
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-chat-id') === chatId) item.classList.add('active');
    });
}

function addAIMessage(content, timestamp) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai-message';
    const time = timestamp ? new Date(timestamp) : new Date();
    msgDiv.innerHTML = `<div class="message-avatar ai-avatar"><span>AI</span></div><div class="message-content-wrapper"><div class="message-content">${formatAIResponse(content)}</div><div class="message-time">${time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div></div>`;
    container.appendChild(msgDiv);
    addCopyButton(msgDiv, content);
    container.scrollTop = container.scrollHeight;
}

function clearCurrentChat() {
    const chats = getChats();
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages = [];
        saveChats(chats);
        loadChat(currentChatId);
        showNotification('Chat limpiado', 'success');
    }
}

function deleteCurrentChat() {
    let chats = getChats();
    chats = chats.filter(c => c.id !== currentChatId);
    saveChats(chats);
    currentChatId = null;
    loadChatsList();
    const container = document.getElementById('messagesContainer');
    if (container) container.innerHTML = `<div class="welcome-message">
        <div class="welcome-logo">
            <div class="da-logo">
                <span class="d-letter">D</span>
                <span class="a-letter">A</span>
            </div>
        </div>
        <h2>¡Hola! Soy Dominius AI</h2>
        <p>Crea un nuevo chat para empezar</p>
    </div>`;
    document.getElementById('currentChatTitle').textContent = 'Dominius AI';
    showNotification('Chat eliminado', 'success');
}

function loadChatsList() {
    const chats = getChats();
    const container = document.getElementById('chatsList');
    if (!container) return;
    if (chats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay chats</p>';
        return;
    }
    container.innerHTML = chats.map(chat => {
        const preview = chat.messages.length ? chat.messages[chat.messages.length - 1].content.substring(0, 50) + '...' : 'Sin mensajes';
        return `<div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}"><div class="chat-item-title">${chat.title}</div><div class="chat-item-preview">${preview}</div></div>`;
    }).join('');
    container.querySelectorAll('.chat-item').forEach(el => {
        el.addEventListener('click', () => loadChat(el.dataset.chatId));
    });
}

// =============================================
// ALMACENAMIENTO
// =============================================
function getChats() {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    const key = `chats_${session.id}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveChats(chats) {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    localStorage.setItem(`chats_${session.id}`, JSON.stringify(chats));
}

function saveMessageToChat(chatId, role, content) {
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.messages.push({ role, content, timestamp: new Date().toISOString() });
        if (chat.messages.length === 2 && role === 'user') {
            chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            document.getElementById('currentChatTitle').textContent = chat.title;
        }
        saveChats(chats);
        loadChatsList();
    }
}

function getChatHistory(chatId) {
    const chat = getChats().find(c => c.id === chatId);
    return chat ? chat.messages : [];
}

// =============================================
// UTILIDADES
// =============================================
function initUserData() {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    if (session.name) {
        document.getElementById('userName').textContent = session.name;
        document.getElementById('userInitials').textContent = session.name.substring(0, 2).toUpperCase();
    }
}

function updateCharCount() {
    const input = document.getElementById('messageInput');
    const counter = document.getElementById('charCount');
    if (input && counter) counter.textContent = `${input.value.length} / Sin límite`;
}

function autoResizeTextarea() {
    const ta = document.getElementById('messageInput');
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
}

function getModeName(mode) {
    const names = { general: 'General', creative: 'Creativo', business: 'Gestión Empresarial', strategy: 'Estrategia', data: 'Análisis de Datos', code: 'Programación' };
    return names[mode] || 'General';
}

function getModeSystemPrompt(mode) {
    const prompts = {
        general: 'Eres Dominius AI, un asistente de IA avanzado, profesional y amigable. Proporciona respuestas claras, concisas y útiles. Si no sabes algo, admítelo honestamente. Formatea las respuestas para mejor legibilidad.',
        creative: 'Eres Dominius AI en modo creativo. Eres imaginativo, innovador y generas ideas originales. Piensa fuera de lo convencional y sugiere enfoques únicos. Inspira creatividad y propón soluciones inusuales.',
        business: 'Eres Dominius AI especializado en gestión empresarial. Proporciona análisis estratégico, consejos prácticos y soluciones empresariales. Considera ROI, escalabilidad y sostenibilidad en tus recomendaciones.',
        strategy: 'Eres Dominius AI experto en estrategia. Ayudas con planificación a largo plazo, análisis competitivo y desarrollo estratégico. Piensa de forma holística y considera múltiples escenarios.',
        data: 'Eres Dominius AI enfocado en análisis de datos. Interpreta datos, identificas tendencias y proporcionas insights accionables. Explica conceptos complejos de forma clara y visual.',
        code: 'Eres Dominius AI especializado en programación. Escribe código limpio, eficiente y bien documentado. Explica conceptos técnicos claramente y ayuda con debugging. Considera buenas prácticas y patrones de diseño.'
    };
    return prompts[mode] || prompts.general;
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

// =============================================
// ACCIONES RÁPIDAS
// =============================================
window.quickAction = function(text) {
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = text;
        autoResizeTextarea();
        updateCharCount();
        input.focus();
        updateButtonState();
        setTimeout(() => sendUserMessage(), 100);
    }
};

// =============================================
// PARTÍCULAS
// =============================================
function initParticles() {
    const container = document.createElement('div');
    container.id = 'particles';
    container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;';
    document.querySelector('.chat-area')?.appendChild(container);
    for (let i = 0; i < 30; i++) createParticle(container, i);
}

function createParticle(container, i) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;z-index:0;`;
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.width = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    p.style.opacity = 0.2 + Math.random() * 0.4;
    p.style.backgroundColor = ['rgba(139,92,246,0.6)','rgba(167,139,250,0.5)','rgba(196,181,253,0.4)','rgba(124,58,237,0.5)'][Math.floor(Math.random() * 4)];
    p.style.animation = `floatParticle ${15 + Math.random() * 15}s linear ${Math.random() * 20}s infinite`;
    container.appendChild(p);
}

// Inicializar estado del botón al cargar
setTimeout(() => { if (window.updateButtonState) window.updateButtonState(); }, 100);

console.log('✅ chat.js cargado - Botón inteligente activado');



// =============================================

// =============================================
// SISTEMA DE AUDIO - BOTÓN AL LADO DEL ENVIAR
// =============================================
let isRecording = false;
let recognition = null;
let speechSynth = window.speechSynthesis;

function initAudioButton() {
    const inputContainer = document.querySelector('.input-container');
    if (!inputContainer || document.getElementById('micBtn')) return;

    const micBtn = document.createElement('button');
    micBtn.id = 'micBtn';
    micBtn.title = 'Hablar';
    micBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
    `;
    micBtn.className = 'attach-btn';
    micBtn.style.cssText = 'transition: all 0.25s ease; flex-shrink: 0;';
    micBtn.addEventListener('click', toggleVoice);

    // Insertar justo antes del botón de enviar
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) inputContainer.insertBefore(micBtn, sendBtn);
}

function toggleVoice() {
    if (isRecording) {
        stopVoice();
    } else {
        startVoice();
    }
}

function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showNotification('Tu navegador no soporta reconocimiento de voz', 'error');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    isRecording = true;
    updateMicStyle(true);
    showNotification('🎤 Escuchando...', 'info');

    recognition.onresult = function(e) {
        const text = e.results[0][0].transcript;
        stopVoice();
        // Meter el texto en el input y enviarlo
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = text;
            autoResizeTextarea();
            updateCharCount();
            updateButtonState();
            setTimeout(() => sendUserMessage(), 150);
        }
    };

    recognition.onerror = function(e) {
        stopVoice();
        if (e.error === 'not-allowed') {
            showNotification('Debes permitir el micrófono en el navegador', 'error');
        } else if (e.error !== 'no-speech') {
            showNotification('No te escuché bien, inténtalo de nuevo', 'error');
        }
    };

    recognition.onend = function() {
        if (isRecording) stopVoice();
    };

    recognition.start();
}

function stopVoice() {
    isRecording = false;
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
        recognition = null;
    }
    updateMicStyle(false);
}

function updateMicStyle(active) {
    const btn = document.getElementById('micBtn');
    if (!btn) return;
    if (active) {
        btn.style.color = '#ef4444';
        btn.style.borderColor = 'rgba(239,68,68,0.5)';
        btn.style.background = 'rgba(239,68,68,0.15)';
        btn.style.boxShadow = '0 0 12px rgba(239,68,68,0.4)';
        btn.title = 'Parar';
    } else {
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.background = '';
        btn.style.boxShadow = '';
        btn.title = 'Hablar';
    }
}

// La IA responde en voz alta si el mensaje fue por voz
const _origGetAIResponse = getAIResponse;
let lastWasVoice = false;

// Hook para saber si el último mensaje fue por voz
const _origSendVoice = sendUserMessage;

// Hablar la respuesta de la IA
function speakAIResponse(text) {
    if (!speechSynth) return;
    speechSynth.cancel();

    const clean = text
        .replace(/```[\s\S]*?```/g, 'código.')
        .replace(/`[^`]+`/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\n/g, ' ')
        .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = speechSynth.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
    speechSynth.speak(utterance);
}

// Inicializar el botón al cargar
setTimeout(() => initAudioButton(), 300);

console.log('🎤 Botón de micrófono listo');
