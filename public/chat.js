// =============================================
// DOMINIUS AI - CHAT PRINCIPAL
// =============================================

// ========== CONFIGURACIÓN ==========
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Ajusta si usas otro endpoint
const API_KEY = 'TU_API_KEY'; // IMPORTANTE: Reemplaza con tu API key real o cárgala desde un lugar seguro

// ========== ELEMENTOS DEL DOM ==========
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const attachedFilesContainer = document.getElementById('attachedFilesContainer');
const currentChatTitle = document.getElementById('currentChatTitle');
const currentModeSpan = document.getElementById('currentMode');
const chatsList = document.getElementById('chatsList');
const newChatBtn = document.getElementById('newChatBtn');
const logoutBtn = document.getElementById('logoutBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const modeCards = document.querySelectorAll('.mode-card');
const userNameSpan = document.getElementById('userName');
const userInitials = document.getElementById('userInitials');

// ========== VARIABLES DE ESTADO ==========
let currentUser = null;
let currentChatId = null;
let chats = [];
let attachedFiles = [];
let isGenerating = false;
let currentMode = 'general'; // modo por defecto

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(session);
    userNameSpan.textContent = currentUser.name || currentUser.username;
    userInitials.textContent = (currentUser.name || currentUser.username).substring(0, 2).toUpperCase();

    // Cargar chats del usuario
    loadChats();

    // Establecer chat activo (si existe)
    if (chats.length > 0) {
        setActiveChat(chats[0].id);
    } else {
        createNewChat();
    }

    // Event listeners
    setupEventListeners();
});

// ========== FUNCIONES DE CHATS ==========
function loadChats() {
    const stored = localStorage.getItem(`chats_${currentUser.id}`);
    chats = stored ? JSON.parse(stored) : [];
    renderChatsList();
}

function saveChats() {
    localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(chats));
}

function createNewChat() {
    const newChat = {
        id: Date.now().toString(),
        title: 'Nuevo Chat',
        mode: 'general', // modo por defecto
        messages: [],
        createdAt: new Date().toISOString()
    };
    chats.unshift(newChat);
    saveChats();
    renderChatsList();
    setActiveChat(newChat.id);
    showWelcomeMessage();
}

function setActiveChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    // Actualizar título
    currentChatTitle.textContent = chat.title;
    currentMode = chat.mode || 'general';
    updateModeDisplay();

    // Marcar en la lista
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === chatId);
    });

    // Mostrar mensajes
    renderMessages(chat.messages);
}

function updateChatTitle(chatId, newTitle) {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.title = newTitle;
        saveChats();
        renderChatsList();
        if (currentChatId === chatId) {
            currentChatTitle.textContent = newTitle;
        }
    }
}

// Función para generar título a partir del primer mensaje
function generateTitleFromMessage(text) {
    // Extraer palabras clave: cogemos las primeras 5-6 palabras relevantes
    const words = text.split(' ').filter(w => w.length > 3); // palabras de más de 3 letras
    let title = words.slice(0, 5).join(' ');
    if (title.length > 40) title = title.substring(0, 40) + '...';
    return title || 'Nuevo Chat';
}

// ========== RENDERIZADO DE CHATS ==========
function renderChatsList() {
    chatsList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;
        chatItem.innerHTML = `
            <div class="chat-item-title">${chat.title}</div>
            <div class="chat-item-preview">${chat.messages[chat.messages.length - 1]?.content?.substring(0, 30) || 'Nuevo chat'}</div>
        `;
        chatItem.addEventListener('click', () => setActiveChat(chat.id));
        chatsList.appendChild(chatItem);
    });
}

// ========== MENSAJES ==========
function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    if (messages.length === 0) {
        showWelcomeMessage();
    } else {
        messages.forEach(msg => appendMessage(msg, false));
    }
    scrollToBottom();
}

function showWelcomeMessage() {
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-logo">
                <div class="da-logo">
                    <span class="d-letter">D</span>
                    <span class="a-letter">A</span>
                </div>
            </div>
            <h2>¡Hola! Soy Dominius AI</h2>
            <p>Tu asistente empresarial de élite. Transformo ideas en resultados estratégicos. ¿En qué puedo potenciar tu negocio hoy?</p>
            <div class="quick-suggestions">
                <button class="suggestion-btn" onclick="quickAction('Necesito un análisis de mercado para un nuevo restaurante')">
                    📊 Análisis de mercado
                </button>
                <button class="suggestion-btn" onclick="quickAction('Genera código HTML para una página web moderna')">
                    💻 Generar código
                </button>
                <button class="suggestion-btn" onclick="quickAction('Ayúdame a crear una estrategia de marketing')">
                    🎯 Estrategia marketing
                </button>
                <button class="suggestion-btn" onclick="quickAction('Ayúdame a redactar un email profesional')">
                    📧 Redactar email
                </button>
            </div>
        </div>
    `;
}

function appendMessage(msg, save = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`;
    avatar.textContent = msg.role === 'user' ? (currentUser?.name?.substring(0,2) || 'U') : 'AI';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = msg.content.replace(/\n/g, '<br>');

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString();

    wrapper.appendChild(content);
    wrapper.appendChild(time);

    if (msg.role === 'ai') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(msg.content);
            showNotification('Copiado al portapapeles', 'success');
        });
        wrapper.appendChild(copyBtn);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(wrapper);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    if (save) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push(msg);
            saveChats();
        }
    }
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && attachedFiles.length === 0) return;

    // Si es el primer mensaje de este chat, generar título
    const chat = chats.find(c => c.id === currentChatId);
    if (chat && chat.messages.length === 0) {
        const title = generateTitleFromMessage(text);
        updateChatTitle(currentChatId, title);
    }

    // Mensaje del usuario
    const userMsg = { role: 'user', content: text, files: attachedFiles };
    appendMessage(userMsg);

    // Limpiar input y archivos
    messageInput.value = '';
    attachedFiles = [];
    attachedFilesContainer.style.display = 'none';
    attachedFilesContainer.innerHTML = '';
    adjustTextareaHeight();

    // Mostrar indicador de escritura
    showTypingIndicator();

    // Llamar a la API
    try {
        const response = await callAPI(text, currentMode);
        hideTypingIndicator();
        const aiMsg = { role: 'assistant', content: response };
        appendMessage(aiMsg);
    } catch (error) {
        hideTypingIndicator();
        showNotification('Error al conectar con la IA', 'error');
        console.error(error);
    }
}

async function callAPI(prompt, mode) {
    // Aquí debes implementar la llamada real a tu API (Groq, OpenAI, etc.)
    // Esto es un ejemplo simulado
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`Respuesta en modo ${mode} a: "${prompt}"`);
        }, 1000);
    });
}

// ========== MODOS ==========
function updateModeDisplay() {
    const modeNames = {
        general: 'General',
        creative: 'Creativo',
        business: 'Gestión Empresarial',
        strategy: 'Estrategia',
        data: 'Análisis de Datos',
        code: 'Programación'
    };
    currentModeSpan.textContent = `Modo: ${modeNames[currentMode] || 'General'}`;

    // Marcar el modo activo en el panel
    modeCards.forEach(card => {
        card.classList.toggle('active', card.dataset.mode === currentMode);
    });
}

function setMode(mode) {
    currentMode = mode;
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.mode = mode;
        saveChats();
    }
    updateModeDisplay();
}

// ========== TYPING INDICATOR ==========
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesContainer.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// ========== UTILIDADES ==========
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
}

// ========== ARCHIVOS ADJUNTOS ==========
attachBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    attachedFiles = attachedFiles.concat(files);
    renderAttachedFiles();
});

function renderAttachedFiles() {
    if (attachedFiles.length === 0) {
        attachedFilesContainer.style.display = 'none';
        return;
    }
    attachedFilesContainer.style.display = 'flex';
    attachedFilesContainer.innerHTML = '';
    attachedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'attached-file-item';
        fileItem.innerHTML = `
            <span class="file-icon">📎</span>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button class="remove-file-btn" data-index="${index}">×</button>
        `;
        fileItem.querySelector('.remove-file-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.index);
            attachedFiles.splice(idx, 1);
            renderAttachedFiles();
        });
        attachedFilesContainer.appendChild(fileItem);
    });
}

// ========== ACCIONES RÁPIDAS (desde welcome) ==========
window.quickAction = function(text) {
    messageInput.value = text;
    sendMessage();
};

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Enviar mensaje
    sendBtn.addEventListener('click', sendMessage);

    // Enter para enviar, Shift+Enter nueva línea
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Ajustar altura del textarea
    messageInput.addEventListener('input', adjustTextareaHeight);

    // Logout
    logoutBtn.addEventListener('click', () => {
        UserSystem.logout();
    });

    // Nuevo chat
    newChatBtn.addEventListener('click', createNewChat);

    // Limpiar chat actual
    clearChatBtn.addEventListener('click', () => {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages = [];
            saveChats();
            renderMessages([]);
        }
    });

    // Eliminar chat actual
    deleteChatBtn.addEventListener('click', () => {
        if (!currentChatId) return;
        chats = chats.filter(c => c.id !== currentChatId);
        saveChats();
        if (chats.length > 0) {
            setActiveChat(chats[0].id);
        } else {
            createNewChat();
        }
        renderChatsList();
    });

    // Tabs (sidebar)
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(tab + 'Panel').classList.add('active');
        });
    });

    // Modos
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            setMode(mode);
        });
    });
}
