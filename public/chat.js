// =============================================
// DOMINIUS AI - CHAT MEJORADO
// =============================================

// Variables globales
let attachedFiles = [];
let currentChatId = null;
let currentMode = 'general';
let isAIResponding = false;
let stopGeneration = false;
let currentAIMessage = '';

// 🔑 API KEY DE GROQ (GRATIS)
const GROQ_API_KEY = "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";

// =============================================
// INICIALIZACIÓN PRINCIPAL
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dominius AI - Iniciando sistema...');
    
    // Verificar sesión activa
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        console.log('❌ No hay sesión activa, redirigiendo...');
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar componentes
    initUserData();
    initEvents();
    loadChatsList();
    initParticles();
    
    // Auto-focus en el input
    setTimeout(() => {
        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
            input.value = '';
            updateCharCount();
            autoResizeTextarea();
        }
    }, 500);
    
    console.log('✅ Dominius AI - Sistema listo');
});

// =============================================
// CONFIGURACIÓN DE EVENTOS
// =============================================
function initEvents() {
    console.log('⚙️ Configurando eventos...');
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                localStorage.removeItem('dominius_session');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Sistema de pestañas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            const panel = document.getElementById(tabName + 'Panel');
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
    
    // Botón nuevo chat
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }
    
    // Modos de IA
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            currentMode = this.getAttribute('data-mode');
            const modeName = getModeName(currentMode);
            document.getElementById('currentMode').textContent = 'Modo: ' + modeName;
            
            showNotification(`Modo ${modeName} activado`, 'info');
            
            if (!currentChatId) {
                createNewChat();
            }
        });
    });
    
    // Botones de acción del chat
    const clearChatBtn = document.getElementById('clearChatBtn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', function() {
            if (currentChatId && confirm('¿Limpiar este chat?')) {
                clearCurrentChat();
            }
        });
    }
    
    const deleteChatBtn = document.getElementById('deleteChatBtn');
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener('click', function() {
            if (currentChatId && confirm('¿Eliminar este chat permanentemente?')) {
                deleteCurrentChat();
            }
        });
    }
    
    // Sistema de archivos adjuntos (SIN LÍMITES)
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files || []);
            
            for (const file of files) {
                // Leer contenido del archivo
                const content = await readFileContent(file);
                
                attachedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: content
                });
            }
            
            updateAttachedFiles();
            e.target.value = '';
            
            if (files.length > 0) {
                showNotification(`✅ ${files.length} archivo(s) adjuntado(s)`, 'success');
            }
        });
    }
    
    // Sistema de entrada de mensajes
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            if (isAIResponding) {
                // Detener generación
                stopGeneration = true;
                updateSendButton();
            } else {
                sendUserMessage();
            }
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isAIResponding) {
                    sendUserMessage();
                }
            }
        });
        
        messageInput.addEventListener('input', function() {
            updateCharCount();
            autoResizeTextarea();
        });
    }
    
    console.log('✅ Eventos configurados');
}

// =============================================
// LEER CONTENIDO DE ARCHIVOS
// =============================================
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            
            // Si es texto, devolver como texto
            if (file.type.startsWith('text/') || 
                file.type === 'application/json' ||
                file.name.endsWith('.txt') ||
                file.name.endsWith('.js') ||
                file.name.endsWith('.html') ||
                file.name.endsWith('.css') ||
                file.name.endsWith('.md')) {
                resolve(content);
            } else {
                // Para archivos binarios, devolver info básica
                resolve(`[Archivo binario: ${file.name}, ${formatFileSize(file.size)}]`);
            }
        };
        
        reader.onerror = function() {
            resolve(`[Error leyendo archivo: ${file.name}]`);
        };
        
        // Leer como texto
        if (file.type.startsWith('text/') || 
            file.type === 'application/json' ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.js') ||
            file.name.endsWith('.html') ||
            file.name.endsWith('.css') ||
            file.name.endsWith('.md')) {
            reader.readAsText(file);
        } else {
            resolve(`[Archivo: ${file.name}, ${formatFileSize(file.size)}]`);
        }
    });
}

// =============================================
// BOTÓN ENVIAR/STOP SIMPLE
// =============================================
function updateSendButton() {
    const sendBtn = document.getElementById('sendBtn');
    if (!sendBtn) return;
    
    if (isAIResponding) {
        // Modo STOP
        sendBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
        `;
        sendBtn.title = 'Detener generación';
        sendBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        // Modo ENVIAR
        sendBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        `;
        sendBtn.title = 'Enviar mensaje';
        sendBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)';
    }
}

// =============================================
// ENVIAR MENSAJE DEL USUARIO
// =============================================
async function sendUserMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    
    if (!message && attachedFiles.length === 0) {
        return;
    }
    
    if (!currentChatId) {
        createNewChat();
    }
    
    // Construir mensaje completo con archivos
    let fullMessage = message;
    
    if (attachedFiles.length > 0) {
        fullMessage += '\n\n--- Archivos adjuntos ---\n';
        for (const file of attachedFiles) {
            fullMessage += `\n📎 ${file.name} (${formatFileSize(file.size)}):\n`;
            fullMessage += file.content + '\n';
        }
    }
    
    // Mostrar mensaje del usuario
    addUserMessage(message, attachedFiles);
    
    // Limpiar input y archivos
    messageInput.value = '';
    attachedFiles = [];
    updateAttachedFiles();
    updateCharCount();
    autoResizeTextarea();
    
    // Guardar en historial
    saveMessageToChat(currentChatId, 'user', fullMessage);
    
    // Obtener respuesta de la IA
    await getAIResponse(fullMessage);
}

// =============================================
// OBTENER RESPUESTA DE LA IA
// =============================================
async function getAIResponse(userMessage) {
    isAIResponding = true;
    stopGeneration = false;
    currentAIMessage = '';
    updateSendButton();
    
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Indicador de escritura
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar ai-avatar">
            <span>AI</span>
        </div>
        <div class="message-content-wrapper">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    
    try {
        const chatHistory = getChatHistory(currentChatId);
        
        const messages = [
            {
                role: 'system',
                content: getModeSystemPrompt(currentMode)
            },
            ...chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 8000,
                stream: true
            })
        });
        
        if (!response.ok) {
            throw new Error('Error en la API');
        }
        
        // Eliminar indicador
        typingDiv.remove();
        
        // Crear mensaje de IA
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai-message';
        aiMessageDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span>AI</span>
            </div>
            <div class="message-content-wrapper">
                <div class="message-content"></div>
                <div class="message-time">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        container.appendChild(aiMessageDiv);
        
        const contentDiv = aiMessageDiv.querySelector('.message-content');
        
        // Leer stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            if (stopGeneration) {
                currentAIMessage += '\n\n[Generación detenida por el usuario]';
                break;
            }
            
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        
                        if (content) {
                            currentAIMessage += content;
                            contentDiv.innerHTML = formatAIResponse(currentAIMessage);
                            container.scrollTop = container.scrollHeight;
                        }
                    } catch (e) {
                        // Ignorar errores de parsing
                    }
                }
            }
        }
        
        // Guardar respuesta
        saveMessageToChat(currentChatId, 'assistant', currentAIMessage);
        addCopyButton(aiMessageDiv, currentAIMessage);
        
    } catch (error) {
        console.error('Error obteniendo respuesta:', error);
        
        typingDiv.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai-message';
        errorDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span>AI</span>
            </div>
            <div class="message-content-wrapper">
                <div class="message-content">❌ Error al obtener respuesta. Por favor intenta de nuevo.</div>
            </div>
        `;
        container.appendChild(errorDiv);
    }
    
    isAIResponding = false;
    stopGeneration = false;
    updateSendButton();
}

// =============================================
// FORMATEAR RESPUESTA DE LA IA
// =============================================
function formatAIResponse(text) {
    if (!text) return '';
    
    // Convertir bloques de código
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Convertir código inline
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convertir negritas
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convertir cursivas
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // Convertir saltos de línea
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// =============================================
// AÑADIR MENSAJE DEL USUARIO
// =============================================
function addUserMessage(message, files = []) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Ocultar mensaje de bienvenida
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'none';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    const initials = session.name ? session.name.substring(0, 2).toUpperCase() : 'U';
    
    let filesHTML = '';
    if (files.length > 0) {
        filesHTML = '<div class="message-files">';
        for (const file of files) {
            filesHTML += `<div class="file-tag">📎 ${file.name} (${formatFileSize(file.size)})</div>`;
        }
        filesHTML += '</div>';
    }
    
    const timeString = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content-wrapper">
            <div class="message-content">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            ${filesHTML}
            <div class="message-time">${timeString}</div>
        </div>
        <div class="message-avatar user-avatar">
            <span>${initials}</span>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// =============================================
// BOTÓN DE COPIAR
// =============================================
function addCopyButton(messageDiv, content) {
    const contentWrapper = messageDiv.querySelector('.message-content-wrapper');
    if (!contentWrapper) return;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;
    copyBtn.title = 'Copiar';
    
    copyBtn.addEventListener('click', function() {
        // Crear elemento temporal para copiar
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            copyBtn.innerHTML = '✓';
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                `;
            }, 2000);
        } catch (err) {
            console.error('Error copiando:', err);
        }
        
        document.body.removeChild(textArea);
    });
    
    contentWrapper.appendChild(copyBtn);
}

// =============================================
// GESTIÓN DE ARCHIVOS ADJUNTOS
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
    container.innerHTML = '';
    
    attachedFiles.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'attached-file-item';
        fileDiv.innerHTML = `
            <span class="file-icon">📎</span>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="remove-file-btn" onclick="removeFile(${index})">×</button>
        `;
        container.appendChild(fileDiv);
    });
}

window.removeFile = function(index) {
    attachedFiles.splice(index, 1);
    updateAttachedFiles();
};

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h2>¡Hola! Soy Dominius AI</h2>
                <p>Tu asistente empresarial de élite. ¿En qué puedo ayudarte hoy?</p>
            </div>
        `;
    } else {
        for (const msg of chat.messages) {
            if (msg.role === 'user') {
                addUserMessage(msg.content, []);
            } else if (msg.role === 'assistant') {
                addAIMessage(msg.content, msg.timestamp);
            }
        }
    }
    
    document.getElementById('currentChatTitle').textContent = chat.title;
    
    // Marcar como activo en la lista
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-chat-id') === chatId) {
            item.classList.add('active');
        }
    });
}

function addAIMessage(content, timestamp) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    const time = timestamp ? new Date(timestamp) : new Date();
    const timeString = time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-avatar ai-avatar">
            <span>AI</span>
        </div>
        <div class="message-content-wrapper">
            <div class="message-content">${formatAIResponse(content)}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    addCopyButton(messageDiv, content);
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
    if (container) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h2>¡Hola! Soy Dominius AI</h2>
                <p>Crea un nuevo chat para empezar</p>
            </div>
        `;
    }
    
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
    
    container.innerHTML = '';
    
    for (const chat of chats) {
        const chatDiv = document.createElement('div');
        chatDiv.className = 'chat-item';
        if (chat.id === currentChatId) {
            chatDiv.classList.add('active');
        }
        chatDiv.setAttribute('data-chat-id', chat.id);
        
        const preview = chat.messages.length > 0 
            ? chat.messages[chat.messages.length - 1].content.substring(0, 50) + '...'
            : 'Sin mensajes';
        
        chatDiv.innerHTML = `
            <div class="chat-item-title">${chat.title}</div>
            <div class="chat-item-preview">${preview}</div>
        `;
        
        chatDiv.addEventListener('click', () => loadChat(chat.id));
        container.appendChild(chatDiv);
    }
}

// =============================================
// SISTEMA DE ALMACENAMIENTO
// =============================================
function getChats() {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    const key = `chats_${session.id}`;
    const chats = localStorage.getItem(key);
    return chats ? JSON.parse(chats) : [];
}

function saveChats(chats) {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    const key = `chats_${session.id}`;
    localStorage.setItem(key, JSON.stringify(chats));
}

function saveMessageToChat(chatId, role, content) {
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    
    if (chat) {
        chat.messages.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Actualizar título del chat con el primer mensaje
        if (chat.messages.length === 2 && role === 'user') {
            chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            document.getElementById('currentChatTitle').textContent = chat.title;
        }
        
        saveChats(chats);
        loadChatsList();
    }
}

function getChatHistory(chatId) {
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    return chat ? chat.messages : [];
}

// =============================================
// UTILIDADES
// =============================================
function initUserData() {
    const session = JSON.parse(localStorage.getItem('dominius_session') || '{}');
    
    if (session.name) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = session.name;
        }
        
        const userInitials = document.getElementById('userInitials');
        if (userInitials) {
            userInitials.textContent = session.name.substring(0, 2).toUpperCase();
        }
    }
}

function updateCharCount() {
    const input = document.getElementById('messageInput');
    const counter = document.getElementById('charCount');
    if (input && counter) {
        counter.textContent = `${input.value.length} / Sin límite`;
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function getModeName(mode) {
    const names = {
        'general': 'General',
        'creative': 'Creativo',
        'business': 'Gestión Empresarial',
        'strategy': 'Estrategia',
        'data': 'Análisis de Datos',
        'code': 'Programación'
    };
    return names[mode] || 'General';
}

function getModeSystemPrompt(mode) {
    const prompts = {
        'general': `Eres Dominius AI, un asistente de IA avanzado, profesional y amigable. 
        Proporciona respuestas claras, concisas y útiles. 
        Si no sabes algo, admítelo honestamente. 
        Formatea las respuestas para mejor legibilidad.`,
        
        'creative': `Eres Dominius AI en modo creativo. 
        Eres imaginativo, innovador y generas ideas originales. 
        Piensa fuera de lo convencional y sugiere enfoques únicos. 
        Inspira creatividad y propón soluciones inusuales.`,
        
        'business': `Eres Dominius AI especializado en gestión empresarial. 
        Proporciona análisis estratégico, consejos prácticos y soluciones empresariales. 
        Considera ROI, escalabilidad y sostenibilidad en tus recomendaciones.`,
        
        'strategy': `Eres Dominius AI experto en estrategia. 
        Ayudas con planificación a largo plazo, análisis competitivo y desarrollo estratégico. 
        Piensa de forma holística y considera múltiples escenarios.`,
        
        'data': `Eres Dominius AI enfocado en análisis de datos. 
        Interpreta datos, identificas tendencias y proporcionas insights accionables. 
        Explica conceptos complejos de forma clara y visual.`,
        
        'code': `Eres Dominius AI especializado en programación. 
        Escribe código limpio, eficiente y bien documentado. 
        Explica conceptos técnicos claramente y ayuda con debugging. 
        Considera buenas prácticas y patrones de diseño.`
    };
    
    return prompts[mode] || prompts['general'];
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// =============================================
// ACCIONES RÁPIDAS
// =============================================
window.quickAction = function(text) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = text;
        autoResizeTextarea();
        updateCharCount();
        messageInput.focus();
        setTimeout(() => sendUserMessage(), 100);
    }
};

// =============================================
// PARTÍCULAS EN FONDO
// =============================================
function initParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.id = 'particles';
    particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.appendChild(particlesContainer);
        
        for (let i = 0; i < 30; i++) {
            createParticle(particlesContainer, i);
        }
    }
}

function createParticle(container, index) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
    `;
    
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    const size = 1 + Math.random() * 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    const opacity = 0.2 + Math.random() * 0.4;
    particle.style.opacity = opacity;
    
    const colors = [
        'rgba(139, 92, 246, 0.6)',
        'rgba(167, 139, 250, 0.5)',
        'rgba(196, 181, 253, 0.4)',
        'rgba(124, 58, 237, 0.5)'
    ];
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    const duration = 15 + Math.random() * 15;
    const delay = Math.random() * 20;
    
    particle.style.animation = `floatParticle ${duration}s linear ${delay}s infinite`;
    container.appendChild(particle);
}

console.log('✅ chat.js cargado - Sistema mejorado activo');
