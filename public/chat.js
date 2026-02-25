// =============================================
// DOMINIUS AI - CHAT PRINCIPAL
// =============================================

// ========== CONFIGURACIÓN ==========
// La key está protegida en el servidor (api/groq.js con variable de entorno)
// Nunca se expone en el frontend
const API_URL = '/api/groq';

// ========== MODOS DE IA ==========
const MODES = {
    general: {
        name: 'General',
        icon: '💬',
        prompt: 'Eres Dominius AI, un asistente empresarial de élite. Respondes de forma clara, precisa y profesional en español. Das respuestas completas y útiles. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo General".'
    },
    creative: {
        name: 'Creativo',
        icon: '🎨',
        prompt: 'Eres Dominius AI. Eres imaginativo, innovador y generas ideas originales y disruptivas. Piensas fuera de lo convencional y propones enfoques creativos y únicos. Respondes en español con entusiasmo y creatividad. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo Creativo".'
    },
    business: {
        name: 'Gestión Empresarial',
        icon: '💼',
        prompt: 'Eres Dominius AI. Eres un experto en management, recursos humanos, finanzas corporativas, operaciones y gestión de empresas. Ofreces análisis detallados y recomendaciones estratégicas. Respondes en español de forma profesional y estructurada. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo Gestión Empresarial".'
    },
    strategy: {
        name: 'Estrategia',
        icon: '🎯',
        prompt: 'Eres Dominius AI. Eres un experto en planificación estratégica, crecimiento empresarial, análisis competitivo y toma de decisiones a largo plazo. Usas frameworks como DAFO, OKRs, Porter, etc. Respondes en español con visión estratégica y rigor analítico. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo Estrategia".'
    },
    data: {
        name: 'Análisis de Datos',
        icon: '📊',
        prompt: 'Eres Dominius AI. Eres un experto en estadística, business intelligence, métricas, KPIs y análisis cuantitativo. Ayudas a interpretar datos, identificar tendencias y extraer insights accionables. Respondes en español con precisión analítica. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo Análisis de Datos".'
    },
    code: {
        name: 'Programación',
        icon: '💻',
        prompt: 'Eres Dominius AI. Eres un experto desarrollador de software con conocimiento profundo en múltiples lenguajes y tecnologías. Escribes código limpio, eficiente y bien documentado. Explicas el código claramente y ayudas con debugging. Respondes en español. No menciones en qué modo estás ni hagas referencia al modo en tus respuestas. Si alguien te pregunta en qué modo estás, responde simplemente: "Estoy en modo Programación".'
    }
};

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
const userInitialsEl = document.getElementById('userInitials');

// ========== VARIABLES DE ESTADO ==========
let currentUser = null;
let currentChatId = null;
let chats = [];
let attachedFiles = [];
let isGenerating = false;
let currentMode = 'general';

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(session);
    userNameSpan.textContent = currentUser.name || currentUser.username;
    userInitialsEl.textContent = (currentUser.name || currentUser.username).substring(0, 2).toUpperCase();

    loadChats();

    if (chats.length > 0) {
        setActiveChat(chats[0].id);
    } else {
        createNewChat();
    }

    setupEventListeners();
});

// ========== SISTEMA DE CHATS ==========
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
        mode: 'general',
        messages: [],
        createdAt: new Date().toISOString()
    };
    chats.unshift(newChat);
    saveChats();
    renderChatsList();
    setActiveChat(newChat.id);
    showWelcomeMessage();
}

// ── Abrir un chat: restaura su modo guardado ──
function setActiveChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    // Restaurar el modo de ese chat
    currentMode = chat.mode || 'general';

    currentChatTitle.textContent = chat.title;
    updateModeDisplay();

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === chatId);
    });

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

// ── Genera título con palabras clave del mensaje ──
function generateTitleFromMessage(text) {
    // Palabras vacías en español (stop words)
    const stopWords = new Set([
        'el','la','los','las','un','una','unos','unas','de','del','al','a',
        'en','con','por','para','que','qué','como','cómo','si','es','son',
        'ser','está','estoy','he','ha','han','hay','me','mi','te','se','su',
        'nos','les','lo','le','y','o','pero','más','muy','ya','no','también',
        'esto','ese','eso','esta','esa','quiero','necesito','ayuda','hacer',
        'puedes','puede','favor','please','dame','dime','cuál','cuáles',
        'cuánto','quién','cuando','donde','how','what','the','is','are','and'
    ]);

    const words = text
        .toLowerCase()
        .replace(/[¿?¡!.,;:'"()\[\]{}/\\]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    // Capitalizar primera letra de cada palabra clave
    const keywords = words.slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    let title = keywords.join(' ');

    if (!title || title.length < 3) {
        // Fallback: primeras palabras del texto original
        title = text.split(' ').slice(0, 5).join(' ');
    }
    if (title.length > 42) title = title.substring(0, 42).trim() + '...';
    return title || 'Nuevo Chat';
}

// ========== RENDERIZAR LISTA DE CHATS ==========
function renderChatsList() {
    chatsList.innerHTML = '';
    chats.forEach(chat => {
        const modeInfo = MODES[chat.mode] || MODES.general;
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;

        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg ? lastMsg.content.substring(0, 35) + (lastMsg.content.length > 35 ? '…' : '') : 'Sin mensajes';

        chatItem.innerHTML = `
            <div class="chat-item-title">${chat.title}</div>
            <div class="chat-item-preview">${modeInfo.icon} ${preview}</div>
        `;
        chatItem.addEventListener('click', () => setActiveChat(chat.id));
        chatsList.appendChild(chatItem);
    });
}

// ========== RENDERIZAR MENSAJES ==========
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

// ── Formatea el texto de la IA (negrita, código, listas) ──
function formatAIText(text) {
    // Bloques de código
    text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${escapeHTML(code.trim())}</code></pre>`;
    });
    // Código inline
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Negrita
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Cursiva
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Saltos de línea
    text = text.replace(/\n/g, '<br>');
    return text;
}

function escapeHTML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function appendMessage(msg, save = true) {
    // Quitar bienvenida si existe
    const welcome = messagesContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const isUser = msg.role === 'user';
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`;
    avatar.textContent = isUser
        ? (currentUser?.name?.substring(0, 2) || 'U').toUpperCase()
        : 'AI';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    const content = document.createElement('div');
    content.className = 'message-content';
    // position relative para que el botón copiar se posicione dentro
    content.style.position = 'relative';

    if (isUser) {
        content.textContent = msg.content;
    } else {
        content.innerHTML = formatAIText(msg.content);

        // Botón copiar dentro del bubble del mensaje (esquina superior derecha)
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copiar respuesta';
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`;
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(msg.content).then(() => {
                copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>`;
                showNotification('Copiado al portapapeles', 'success');
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>`;
                }, 2000);
            });
        });
        content.appendChild(copyBtn);
    }

    // Mostrar archivos adjuntos del mensaje de usuario
    if (isUser && msg.files && msg.files.length > 0) {
        const filesDiv = document.createElement('div');
        filesDiv.className = 'message-files';
        msg.files.forEach(f => {
            const tag = document.createElement('span');
            tag.className = 'file-tag';
            tag.textContent = `📎 ${f.name || f}`;
            filesDiv.appendChild(tag);
        });
        content.appendChild(filesDiv);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    wrapper.appendChild(content);
    wrapper.appendChild(time);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(wrapper);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    if (save) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ role: msg.role, content: msg.content });
            saveChats();
        }
    }
}

// ========== ENVIAR MENSAJE ==========
async function sendMessage() {
    if (isGenerating) return;
    const text = messageInput.value.trim();
    if (!text && attachedFiles.length === 0) return;

    // Primer mensaje → generar título automático con palabras clave
    const chat = chats.find(c => c.id === currentChatId);
    if (chat && chat.messages.length === 0 && text) {
        const title = generateTitleFromMessage(text);
        updateChatTitle(currentChatId, title);
    }

    const filesSnapshot = [...attachedFiles];

    // Mostrar mensaje del usuario
    appendMessage({ role: 'user', content: text, files: filesSnapshot });

    // Limpiar estado
    messageInput.value = '';
    attachedFiles = [];
    attachedFilesContainer.style.display = 'none';
    attachedFilesContainer.innerHTML = '';
    adjustTextareaHeight();
    fileInput.value = '';

    isGenerating = true;
    sendBtn.disabled = true;
    showTypingIndicator();

    try {
        let aiResponse;

        // Construir historial de conversación
        const chatMessages = chat ? chat.messages : [];
        const systemPrompt = (MODES[currentMode] || MODES.general).prompt;

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...chatMessages.slice(-20).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            })),
            { role: 'user', content: text }
        ];

        // Llamada al proxy seguro (api/groq.js) — la key nunca sale al frontend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile',
                max_tokens: 4096,
                temperature: currentMode === 'creative' ? 0.9 : 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Error ${response.status}`);
        }

        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || 'No se recibió respuesta de la IA.';

        hideTypingIndicator();
        appendMessage({ role: 'assistant', content: aiResponse });

    } catch (error) {
        hideTypingIndicator();
        console.error('Error API:', error);
        showNotification('Error: ' + (error.message || 'No se pudo conectar'), 'error');
        appendMessage({
            role: 'assistant',
            content: `❌ Error al conectar con la IA: ${error.message || 'Sin conexión'}\n\nVerifica tu API key y conexión a internet.`
        });
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
    }
}

// ========== MODOS ==========
// Actualiza el display del modo en el header y marca la tarjeta activa
function updateModeDisplay() {
    const modeInfo = MODES[currentMode] || MODES.general;
    // Mostrar icono + nombre del modo real
    currentModeSpan.textContent = `${modeInfo.icon} Modo: ${modeInfo.name}`;

    // Marcar tarjeta activa en el panel de modos
    modeCards.forEach(card => {
        card.classList.toggle('active', card.dataset.mode === currentMode);
    });
}

// Cambiar modo y guardarlo en el chat actual
function setMode(mode) {
    currentMode = mode;
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.mode = mode;
        saveChats();
    }
    updateModeDisplay();
    const modeInfo = MODES[mode] || MODES.general;
    showNotification(`${modeInfo.icon} Modo ${modeInfo.name} activado`, 'info');
}

// ========== TYPING INDICATOR ==========
function showTypingIndicator() {
    const existing = document.getElementById('typingIndicator');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'message ai-message';
    wrapper.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar ai-avatar';
    avatar.textContent = 'AI';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(indicator);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// ========== UTILIDADES ==========
function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
}

function showNotification(message, type = 'info') {
    let notif = document.getElementById('chatNotification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'chatNotification';
        notif.className = 'notification';
        document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.style.opacity = '1';
    notif.style.transform = 'translateX(0)';
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(400px)';
    }, 3500);
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
            attachedFiles.splice(parseInt(e.target.dataset.index), 1);
            renderAttachedFiles();
        });
        attachedFilesContainer.appendChild(fileItem);
    });
}

// ========== ACCIONES RÁPIDAS ==========
window.quickAction = function(text) {
    messageInput.value = text;
    sendMessage();
};

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        adjustTextareaHeight();
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = `${messageInput.value.length} / Sin límite`;
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('dominius_session');
        window.location.href = 'index.html';
    });

    newChatBtn.addEventListener('click', createNewChat);

    clearChatBtn.addEventListener('click', () => {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            if (!confirm('¿Limpiar los mensajes de este chat?')) return;
            chat.messages = [];
            chat.title = 'Nuevo Chat';
            saveChats();
            renderMessages([]);
            renderChatsList();
            currentChatTitle.textContent = 'Nuevo Chat';
        }
    });

    deleteChatBtn.addEventListener('click', () => {
        if (!currentChatId) return;
        if (!confirm('¿Eliminar este chat? Esta acción no se puede deshacer.')) return;
        chats = chats.filter(c => c.id !== currentChatId);
        saveChats();
        if (chats.length > 0) {
            setActiveChat(chats[0].id);
        } else {
            createNewChat();
        }
        renderChatsList();
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(tab + 'Panel');
            if (panel) panel.classList.add('active');
        });
    });

    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            setMode(card.dataset.mode);
        });
    });
}
