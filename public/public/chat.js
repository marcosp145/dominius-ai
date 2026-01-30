// =============================================
// DOMINIUS AI - CON IA REAL GRATIS (GROQ)
// =============================================

let attachedFiles = [];
let currentChatId = null;
let currentMode = 'general';

// 🔑 TU API KEY DE GROQ (GRATIS)
const GROQ_API_KEY = "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";

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dominius AI - Con Groq (IA REAL)...');
    
    // Verificar sesión
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar
    initUserData();
    initEvents();
    loadChatsList();
    
    // Auto-focus en input
    setTimeout(() => {
        const input = document.getElementById('messageInput');
        if (input) input.focus();
    }, 1000);
    
    console.log('✅ Dominius AI - Listo con Groq');
});

// =============================================
// FUNCIONES DE USUARIO
// =============================================
function initUserData() {
    try {
        const userData = JSON.parse(localStorage.getItem('dominius_session'));
        const userNameEl = document.getElementById('userName');
        const userInitialsEl = document.getElementById('userInitials');
        
        if (userData && userNameEl && userInitialsEl) {
            userNameEl.textContent = userData.username || 'Usuario';
            const initials = (userData.username || 'US').substring(0, 2).toUpperCase();
            userInitialsEl.textContent = initials;
            
            if (userData.avatarColor) {
                userInitialsEl.style.background = userData.avatarColor;
            }
        }
    } catch (e) {
        console.log('Error cargando usuario:', e);
    }
}

// =============================================
// EVENTOS
// =============================================
function initEvents() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            localStorage.removeItem('dominius_session');
            window.location.href = 'index.html';
        }
    });
    
    // Tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.getElementById(tabName + 'Panel').classList.add('active');
        });
    });
    
    // Nuevo chat
    document.getElementById('newChatBtn').addEventListener('click', createNewChat);
    
    // Modos
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            currentMode = this.getAttribute('data-mode');
            document.getElementById('currentMode').textContent = 'Modo: ' + getModeName(currentMode);
            
            if (!currentChatId) createNewChat();
        });
    });
    
    // Botones chat
    document.getElementById('clearChatBtn').addEventListener('click', function() {
        if (currentChatId && confirm('¿Limpiar este chat? Se borrarán todos los mensajes.')) {
            clearCurrentChat();
        }
    });
    
    document.getElementById('deleteChatBtn').addEventListener('click', function() {
        if (currentChatId && confirm('¿Eliminar este chat permanentemente?')) {
            deleteCurrentChat();
        }
    });
    
    // Archivos
    document.getElementById('attachBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            attachedFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            });
        });
        updateAttachedFiles();
        e.target.value = '';
    });
    
    // Input de mensaje
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    sendBtn.addEventListener('click', sendUserMessage);
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    
    messageInput.addEventListener('input', function() {
        updateCharCount();
        autoResizeTextarea();
    });
}

// =============================================
// FUNCIONES BÁSICAS
// =============================================
window.removeAttachedFile = function(index) {
    if (index >= 0 && index < attachedFiles.length) {
        attachedFiles.splice(index, 1);
        updateAttachedFiles();
    }
};

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
        const size = (file.size / 1024).toFixed(1) + ' KB';
        const icon = getFileIcon(file.type);
        
        const div = document.createElement('div');
        div.className = 'attached-file-item';
        div.innerHTML = `
            <span class="file-icon">${icon}</span>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${size}</span>
            </div>
            <button class="remove-file-btn" onclick="removeAttachedFile(${index})">✕</button>
        `;
        container.appendChild(div);
    });
}

function getFileIcon(type) {
    if (type && type.startsWith('image/')) return '🖼️';
    if (type && type.includes('pdf')) return '📄';
    if (type && (type.includes('word') || type.includes('document'))) return '📝';
    if (type && (type.includes('excel') || type.includes('sheet'))) return '📊';
    if (type && type.includes('text')) return '📃';
    return '📎';
}

function updateCharCount() {
    const input = document.getElementById('messageInput');
    const charCountEl = document.getElementById('charCount');
    if (!input || !charCountEl) return;
    
    const count = input.value.length;
    charCountEl.textContent = count + ' / 2000';
}

function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function getModeName(mode) {
    const modes = {
        'general': 'General',
        'creative': 'Creativo',
        'business': 'Gestión Empresarial',
        'strategy': 'Estrategia',
        'data': 'Análisis de Datos',
        'code': 'Programación'
    };
    return modes[mode] || 'General';
}

// =============================================
// SISTEMA DE CHATS
// =============================================
function getChatsFromStorage() {
    try {
        const data = localStorage.getItem('dominius_chats');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveChatsToStorage(chats) {
    try {
        localStorage.setItem('dominius_chats', JSON.stringify(chats));
    } catch (e) {
        console.log('Error guardando chats:', e);
    }
}

function createNewChat() {
    const chats = getChatsFromStorage();
    const newChat = {
        id: Date.now(),
        title: 'Nuevo Chat',
        messages: [],
        mode: currentMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    chats.unshift(newChat);
    saveChatsToStorage(chats);
    
    currentChatId = newChat.id;
    loadChat(newChat.id);
    
    // Efecto visual
    const btn = document.getElementById('newChatBtn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 200);
}

function loadChat(chatId) {
    const chats = getChatsFromStorage();
    const chat = chats.find(c => c.id === chatId);
    
    if (chat) {
        currentChatId = chatId;
        currentMode = chat.mode || 'general';
        
        document.getElementById('currentChatTitle').textContent = chat.title;
        document.getElementById('currentMode').textContent = 'Modo: ' + getModeName(currentMode);
        
        showMessages(chat.messages);
        loadChatsList();
    }
}

function saveMessageToChat(role, content, files = []) {
    if (!currentChatId) return false;
    
    const chats = getChatsFromStorage();
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    if (chatIndex === -1) return false;
    
    const chat = chats[chatIndex];
    
    chat.messages.push({
        role: role,
        content: content,
        files: files,
        timestamp: new Date().toISOString()
    });
    
    if (chat.messages.length === 1 && chat.title === 'Nuevo Chat') {
        const words = content.substring(0, 30).trim();
        chat.title = words.length > 25 ? words.substring(0, 22) + '...' : words || 'Nuevo Chat';
    }
    
    chat.updatedAt = new Date().toISOString();
    chat.mode = currentMode;
    
    saveChatsToStorage(chats);
    loadChatsList();
    
    return true;
}

function loadChatsList() {
    const chats = getChatsFromStorage();
    const container = document.getElementById('chatsList');
    
    if (!container) return;
    
    if (chats.length === 0) {
        container.innerHTML = `
            <div class="empty-chats">
                <div class="empty-icon">💬</div>
                <p>No hay chats</p>
                <p class="empty-subtitle">Crea uno nuevo</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    chats.forEach(chat => {
        const lastMsg = chat.messages[chat.messages.length - 1];
        const preview = lastMsg ? shortenText(lastMsg.content, 30) : 'Sin mensajes';
        const time = formatTime(chat.updatedAt);
        const activeClass = chat.id === currentChatId ? 'active' : '';
        
        html += `
            <div class="chat-item ${activeClass}" onclick="selectChat(${chat.id})">
                <div class="chat-item-header">
                    <span class="chat-item-title">${chat.title}</span>
                    <span class="chat-item-time">${time}</span>
                </div>
                <div class="chat-item-preview">${preview}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

window.selectChat = function(chatId) {
    loadChat(chatId);
    document.querySelector('[data-tab="chats"]').click();
};

function showMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h2>¡Hola! Soy Dominius AI</h2>
                <p>Tu asistente con IA REAL y gratis. Pregúntame lo que necesites.</p>
                <div class="quick-suggestions">
                    <button class="suggestion-btn" onclick="quickAction('Necesito un análisis de mercado para un restaurante')">
                        📊 Análisis de mercado
                    </button>
                    <button class="suggestion-btn" onclick="quickAction('Genera código HTML para una landing page')">
                        💻 Generar código
                    </button>
                    <button class="suggestion-btn" onclick="quickAction('¿Para qué sirves exactamente?')">
                        🤔 ¿Para qué sirves?
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (msg.role === 'user') {
            const userData = JSON.parse(localStorage.getItem('dominius_session') || '{}');
            const initials = (userData.username || 'US').substring(0, 2).toUpperCase();
            const color = userData.avatarColor || '#8B5CF6';
            
            html += `
                <div class="message user">
                    <div class="message-avatar" style="background: ${color}">${initials}</div>
                    <div class="message-content-wrapper">
                        <div class="message-content">${escapeHtml(msg.content)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        } else {
            const formattedContent = formatAIResponse(msg.content);
            html += `
                <div class="message ai">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content-wrapper">
                        <div class="message-content">${formattedContent}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    
    // Añadir botones de copiar a mensajes AI
    container.querySelectorAll('.message.ai .message-content').forEach(contentDiv => {
        addCopyButton(contentDiv);
    });
    
    // Scroll al final
    container.scrollTop = container.scrollHeight;
}

function shortenText(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Ahora';
    if (mins < 60) return mins + 'm';
    if (hours < 24) return hours + 'h';
    if (days < 7) return days + 'd';
    
    return date.getDate() + '/' + (date.getMonth() + 1);
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function clearCurrentChat() {
    if (!currentChatId) return;
    
    const chats = getChatsFromStorage();
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    if (chatIndex !== -1) {
        chats[chatIndex].messages = [];
        chats[chatIndex].title = 'Nuevo Chat';
        chats[chatIndex].updatedAt = new Date().toISOString();
        
        saveChatsToStorage(chats);
        loadChat(currentChatId);
    }
}

function deleteCurrentChat() {
    if (!currentChatId) return;
    
    let chats = getChatsFromStorage();
    chats = chats.filter(c => c.id !== currentChatId);
    saveChatsToStorage(chats);
    
    currentChatId = null;
    loadChatsList();
    
    document.getElementById('currentChatTitle').textContent = 'Nuevo Chat';
    document.getElementById('messagesContainer').innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">🤖</div>
            <h2>¡Hola! Soy Dominius AI</h2>
            <p>Tu asistente con IA real y gratis. Pregúntame lo que necesites.</p>
        </div>
    `;
}

// =============================================
// BOTÓN COPIAR
// =============================================
function addCopyButton(messageDiv) {
    // Verificar si ya tiene botón
    if (messageDiv.querySelector('.copy-btn')) return;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Copiar mensaje';
    copyBtn.onclick = function(e) {
        e.stopPropagation();
        const text = messageDiv.textContent || messageDiv.innerText;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = '✅';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = '📋';
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    };
    
    messageDiv.appendChild(copyBtn);
}

window.copyCode = function(button) {
    const codeBlock = button.parentElement;
    const code = codeBlock.querySelector('code')?.textContent || '';
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ Copiado';
        button.style.background = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    });
};

// =============================================
// IA REAL - GROQ API (FUNCIONA DE VERDAD)
// =============================================
async function getAIResponse(userMessage) {
    console.log('🤖 Consultando Groq API...');
    
    // Sistema prompt según modo
    const systemPrompts = {
        'general': `Eres Dominius AI, un asistente empresarial experto en español. Responde de forma clara, directa y útil. Usa emojis relevantes, estructura con viñetas (-) y títulos (##). Sé específico y práctico, no genérico.`,
        'creative': `Eres Dominius AI en modo creativo. Eres innovador, original y visionario. Genera ideas frescas, propuestas únicas y soluciones creativas. Usa lenguaje inspirador pero concreto.`,
        'business': `Eres Dominius AI en modo empresarial. Especialista en gestión, análisis, estrategias empresariales. Proporciona datos concretos, pasos accionables, análisis SWOT, métricas.`,
        'strategy': `Eres Dominius AI en modo estrategia. Experto en planificación estratégica, crecimiento empresarial, posicionamiento. Ofrece planes paso a paso, análisis competitivo, roadmap.`,
        'data': `Eres Dominius AI en modo análisis de datos. Especialista en KPIs, métricas, dashboards, insights. Proporciona visualizaciones mentales, fórmulas, interpretación de datos.`,
        'code': `Eres Dominius AI en modo programación. Experto en desarrollo web, software, automatización. Proporciona código funcional, explicaciones técnicas, mejores prácticas.`
    };
    
    const systemPrompt = systemPrompts[currentMode] || systemPrompts.general;
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modelo rápido y potente
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error Groq: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            console.log('✅ Respuesta recibida de Groq');
            return data.choices[0].message.content;
        }
        
        throw new Error('No se recibió respuesta válida');
        
    } catch (error) {
        console.error('Error con Groq:', error);
        
        // Fallback inteligente personalizado
        return getSmartResponse(userMessage);
    }
}

// =============================================
// SISTEMA INTELIGENTE DE RESPUESTAS (FALLBACK)
// =============================================
function getSmartResponse(userMessage) {
    const lower = userMessage.toLowerCase().trim();
    
    // Respuestas empresariales inteligentes
    if (lower.includes('análisis') || lower.includes('analisis') || lower.includes('mercado')) {
        return `📊 **ANÁLISIS DE MERCADO - GUÍA RÁPIDA**

**PASOS INMEDIATOS PARA TU ANÁLISIS:**

1. **DEFINE TU PRODUCTO/SERVICIO:**
   - ¿Qué ofreces exactamente?
   - Precio aproximado: ______
   - Diferencial único: ______

2. **COMPETENCIA DIRECTA (busca en Google Maps):**
   - Nombres de 3 competidores cercanos
   - Sus precios principales
   - Sus puntos débiles visibles

3. **CLIENTE IDEAL:**
   - Edad: ______
   - Ingresos aproximados: ______
   - Problema que resuelves: ______

4. **DATOS RÁPIDOS PARA HOY:**
   - Busca en Google Trends tu sector
   - Revisa grupos de Facebook locales
   - Mira comentarios en Google Reviews

**¿Quieres que profundice en alguno de estos puntos específicos?**`;
    }
    
    if (lower.includes('código') || lower.includes('codigo') || lower.includes('html') || lower.includes('css') || lower.includes('javascript') || lower.includes('programación') || lower.includes('programacion')) {
        return `💻 **CÓDIGO FUNCIONAL - LISTO PARA USAR**

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page Profesional</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
        .hero { 
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 100px 20px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        p { font-size: 1.2rem; margin-bottom: 30px; max-width: 700px; margin-left: auto; margin-right: auto; }
        .btn {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            transition: transform 0.3s;
        }
        .btn:hover { transform: translateY(-3px); }
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .hero { padding: 60px 20px; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <h1>Transforma tu Presencia Digital</h1>
            <p>Soluciones tecnológicas que generan resultados reales y crecimiento sostenible para tu empresa.</p>
            <a href="#contacto" class="btn">Comenzar Ahora →</a>
        </div>
    </section>
</body>
</html>
\`\`\`

**¿Necesitas algo más específico? Dime exactamente qué funcionalidad necesitas.**`;
    }
    
    if (lower.includes('plan de negocio') || lower.includes('startup') || lower.includes('emprendimiento')) {
        return `📋 **PLAN DE NEGOCIO - ESTRUCTURA BÁSICA**

**RESUMEN EJECUTIVO (1 párrafo):**
- Problema que resuelves: ______
- Solución que ofreces: ______
- Mercado objetivo: ______
- Ventaja competitiva: ______
- Equipo clave: ______
- Necesidad de financiación: ______

**ANÁLISIS DE MERCADO (datos a buscar hoy):**
1. **Tamaño de mercado:** Búsqueda en Google "mercado [tu sector] España 2024"
2. **Competencia directa:** 3-5 nombres con sus precios
3. **Tendencias:** Google Trends últimos 12 meses
4. **Clientes potenciales:** Grupos de Facebook/foros específicos

**PROYECCIONES FINANCIERAS (primer año):**
- Mes 1-3: Desarrollo/Preparación → Inversión: ______
- Mes 4-6: Lanzamiento → Ingresos estimados: ______
- Mes 7-12: Crecimiento → Meta de ingresos: ______

**¿Quieres que desarrolle alguna sección específica con más detalle?**`;
    }
    
    // Respuesta por defecto mejorada
    return `🎯 **¡Perfecto! Para darte la mejor ayuda, dime:**

**SOBRE TU PROYECTO/NECESIDAD:**
1. ¿Es para un negocio existente o nuevo proyecto?
2. ¿Qué objetivo concreto quieres lograr?
3. ¿Qué recursos tienes disponibles (tiempo, presupuesto, equipo)?

**EJEMPLOS DE CONSULTAS ESPECÍFICAS QUE RESUELVO:**
- "Necesito crear una landing page para vender un curso online de €197"
- "Analiza el mercado de cafeterías en Barcelona centro para inversión de €50,000"
- "Genera código para un e-commerce básico de productos artesanales"
- "Plan de marketing digital para lanzar una app en 3 meses con €5,000"

**¿Cuál es TU situación específica?**`;
}

// =============================================
// FORMATEO DE RESPUESTAS
// =============================================
function formatAIResponse(text) {
    let formatted = escapeHtml(text);
    
    // Mejora de títulos con emojis
    formatted = formatted.replace(/##\s*(.+?)(\n|$)/g, '<h3 style="color: #a78bfa; margin: 20px 0 10px 0; font-size: 18px; font-weight: 700;">$1</h3>');
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #c4b5fd;">$1</strong>');
    
    // Listas con viñetas
    const lines = formatted.split('\n');
    let result = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            if (!inList) {
                result.push('<ul style="margin: 12px 0 12px 20px; padding: 0;">');
                inList = true;
            }
            const item = line.substring(2);
            result.push(`<li style="margin-bottom: 8px; padding-left: 5px; color: #e5e7eb;">${item}</li>`);
        } else if (line.match(/^\d+\.\s/)) {
            if (!inList) {
                result.push('<ol style="margin: 12px 0 12px 20px; padding: 0;">');
                inList = true;
            }
            const item = line.replace(/^\d+\.\s/, '');
            result.push(`<li style="margin-bottom: 8px; padding-left: 5px; color: #e5e7eb;">${item}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(line);
        }
    }
    
    if (inList) result.push('</ul>');
    
    formatted = result.join('\n');
    
    // Bloques de código
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)\n```/g, 
        '<div class="code-block" style="background: rgba(138, 43, 226, 0.1); padding: 16px; border-radius: 10px; border-left: 4px solid #8b5cf6; margin: 15px 0; position: relative; overflow-x: auto;"><button onclick="copyCode(this)" style="position: absolute; top: 12px; right: 12px; background: rgba(138, 43, 226, 0.3); border: none; border-radius: 6px; color: white; padding: 8px 14px; cursor: pointer; font-size: 13px; z-index: 2;">Copiar código</button><pre style="margin: 0; overflow-x: auto; padding-right: 100px; padding-top: 10px;"><code style="font-family: \'Courier New\', monospace; font-size: 14px; line-height: 1.5; white-space: pre-wrap; color: #e5e7eb;">$2</code></pre></div>');
    
    // Código inline
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(138, 43, 226, 0.15); padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #c4b5fd;">$1</code>');
    
    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// =============================================
// ENVIAR MENSAJE
// =============================================
async function sendUserMessage() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const container = document.getElementById('messagesContainer');
    
    if (!input || !sendBtn || !container) return;
    
    const message = input.value.trim();
    
    if (!message && attachedFiles.length === 0) {
        return;
    }
    
    // Deshabilitar input temporalmente
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '...';
    
    try {
        // Crear chat si no existe
        if (!currentChatId) {
            createNewChat();
        }
        
        // Guardar mensaje del usuario
        const fileInfo = attachedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
        }));
        
        saveMessageToChat('user', message || '[Archivos adjuntos]', fileInfo);
        
        // Mostrar mensaje del usuario
        const userData = JSON.parse(localStorage.getItem('dominius_session') || '{}');
        const initials = (userData.username || 'US').substring(0, 2).toUpperCase();
        const color = userData.avatarColor || '#8B5CF6';
        
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user message-pop';
        userMessageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${color}">${initials}</div>
            <div class="message-content-wrapper">
                <div class="message-content">${escapeHtml(message || '[Archivos adjuntos]')}</div>
                <div class="message-time">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
        `;
        container.appendChild(userMessageDiv);
        
        // Limpiar input
        input.value = '';
        attachedFiles = [];
        updateAttachedFiles();
        updateCharCount();
        autoResizeTextarea();
        
        // Scroll al nuevo mensaje
        container.scrollTop = container.scrollHeight;
        
        // Crear placeholder para respuesta AI
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai';
        aiMessageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content-wrapper">
                <div class="message-content" id="typingAI"></div>
                <div class="message-time">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
        `;
        container.appendChild(aiMessageDiv);
        
        const typingElement = aiMessageDiv.querySelector('#typingAI');
        
        // Obtener respuesta de Groq (IA real)
        const aiResponse = await getAIResponse(message);
        
        // Mostrar respuesta con efecto de escritura
        await typeAIResponse(typingElement, aiResponse);
        
        // Añadir botón de copiar
        addCopyButton(typingElement);
        
        // Guardar respuesta AI
        saveMessageToChat('ai', aiResponse);
        
    } catch (error) {
        console.error('Error:', error);
        
        // Mostrar mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content-wrapper">
                <div class="message-content">⚠️ Error temporal. Por favor, intenta de nuevo.</div>
                <div class="message-time">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
        `;
        container.appendChild(errorDiv);
        
        saveMessageToChat('ai', '⚠️ Error temporal al procesar.');
        
    } finally {
        // Restaurar input
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        `;
        
        // Scroll al final
        container.scrollTop = container.scrollHeight;
        
        // Volver a enfocar el input
        input.focus();
    }
}

async function typeAIResponse(element, text) {
    return new Promise(resolve => {
        if (!element || !text) {
            resolve();
            return;
        }
        
        let i = 0;
        element.innerHTML = '';
        
        function type() {
            if (i < text.length) {
                const partialText = text.substring(0, i + 1);
                element.innerHTML = formatAIResponse(partialText);
                i++;
                
                // Scroll suave
                const container = document.getElementById('messagesContainer');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
                
                setTimeout(type, 10);
            } else {
                resolve();
            }
        }
        
        type();
    });
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
        sendUserMessage();
    }
};

// =============================================
// ANIMACIONES
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Efecto de aparición para mensajes nuevos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('message')) {
                        node.style.animation = 'messageSlideIn 0.4s ease-out';
                    }
                });
            }
        });
    });
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true });
    }
});