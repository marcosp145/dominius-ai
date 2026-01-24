// =============================================
// SISTEMA DE ARCHIVOS ADJUNTOS - SIN LÍMITE + VISIÓN
// =============================================
let attachedFiles = [];

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('💬 Dominius AI - Cargando chat con VISIÓN...');
    
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    const userSession = JSON.parse(session);
    if (userSession) {
        document.getElementById('userName').textContent = userSession.username || 'Usuario';
        const initials = userSession.username ? userSession.username.substring(0, 2).toUpperCase() : 'US';
        document.getElementById('userInitials').textContent = initials;
        
        if (userSession.avatarColor) {
            document.getElementById('userInitials').style.background = userSession.avatarColor;
        }
    }
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('dominius_session');
            window.location.href = 'index.html';
        }
    });
    
    // =============================================
    // CONFIGURAR SUBIDA DE ARCHIVOS CON PROCESAMIENTO
    // =============================================
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            for (const file of files) {
                // Procesar el archivo según su tipo
                const processedFile = await processFile(file);
                attachedFiles.push(processedFile);
            }
            renderAttachedFiles();
        }
        fileInput.value = '';
    });
    
    // =============================================
    // PROCESAR ARCHIVOS (Imágenes, PDFs, etc.)
    // =============================================
    async function processFile(file) {
        const processed = {
            name: file.name,
            size: file.size,
            type: file.type,
            originalFile: file
        };
        
        // Si es imagen, convertir a base64
        if (file.type.startsWith('image/')) {
            processed.base64 = await fileToBase64(file);
            processed.isImage = true;
        }
        
        // Si es PDF, extraer texto
        if (file.type === 'application/pdf') {
            processed.isPDF = true;
            // Aquí podrías usar una librería para extraer texto del PDF
        }
        
        // Si es texto plano, leer contenido
        if (file.type.startsWith('text/')) {
            processed.textContent = await file.text();
            processed.isText = true;
        }
        
        return processed;
    }
    
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function renderAttachedFiles() {
        const container = document.getElementById('attachedFilesContainer');
        
        if (attachedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        container.innerHTML = attachedFiles.map((file, index) => {
            const size = formatFileSize(file.size);
            const icon = getFileIcon(file.type);
            
            return `
                <div class="attached-file-item">
                    <span class="file-icon">${icon}</span>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${size}</span>
                    </div>
                    <button class="remove-file-btn" onclick="removeFile(${index})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    window.removeFile = function(index) {
        attachedFiles.splice(index, 1);
        renderAttachedFiles();
    };
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    function getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('text')) return '📃';
        return '📎';
    }
    
    // =============================================
    // SISTEMA DE CHATS
    // =============================================
    const ChatSystem = {
        currentChatId: null,
        currentMode: 'general',
        
        getChats: function() {
            try {
                const chats = localStorage.getItem('dominius_chats');
                return chats ? JSON.parse(chats) : [];
            } catch (error) {
                console.error('Error leyendo chats:', error);
                return [];
            }
        },
        
        saveChats: function(chats) {
            try {
                localStorage.setItem('dominius_chats', JSON.stringify(chats));
            } catch (error) {
                console.error('Error guardando chats:', error);
            }
        },
        
        createChat: function() {
            const chats = this.getChats();
            const newChat = {
                id: Date.now(),
                title: 'Nuevo Chat',
                messages: [],
                mode: this.currentMode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            chats.unshift(newChat);
            this.saveChats(chats);
            
            const newChatBtn = document.getElementById('newChatBtn');
            newChatBtn.classList.add('btn-press');
            setTimeout(() => newChatBtn.classList.remove('btn-press'), 200);
            
            return newChat;
        },
        
        saveMessage: function(chatId, role, content, files = []) {
            const chats = this.getChats();
            const chat = chats.find(c => c.id === chatId);
            
            if (chat) {
                chat.messages.push({
                    role: role,
                    content: content,
                    files: files,
                    timestamp: new Date().toISOString()
                });
                
                chat.updatedAt = new Date().toISOString();
                
                if (chat.messages.length === 1 && chat.title === 'Nuevo Chat') {
                    chat.title = this.generateTitle(content);
                }
                
                this.saveChats(chats);
                this.renderChats();
            }
        },
        
        generateTitle: function(content) {
            const words = content.trim().split(' ');
            if (words.length === 0) return 'Nuevo Chat';
            
            const title = words.slice(0, 4).join(' ');
            return title.length > 30 ? title.substring(0, 27) + '...' : title;
        },
        
        getChat: function(chatId) {
            const chats = this.getChats();
            return chats.find(c => c.id === chatId);
        },
        
        deleteChat: function(chatId) {
            let chats = this.getChats();
            chats = chats.filter(c => c.id !== chatId);
            this.saveChats(chats);
        },
        
        clearChat: function(chatId) {
            const chats = this.getChats();
            const chat = chats.find(c => c.id === chatId);
            
            if (chat) {
                chat.messages = [];
                chat.title = 'Nuevo Chat';
                chat.updatedAt = new Date().toISOString();
                this.saveChats(chats);
            }
        },
        
        renderChats: function() {
            const chats = this.getChats();
            const chatsList = document.getElementById('chatsList');
            
            if (chats.length === 0) {
                chatsList.innerHTML = `
                    <div class="empty-chats">
                        <div class="empty-icon">💬</div>
                        <p>No hay conversaciones</p>
                        <p class="empty-subtitle">Crea un nuevo chat para comenzar</p>
                    </div>
                `;
                return;
            }
            
            chatsList.innerHTML = chats.map(chat => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                const preview = lastMessage ? 
                    this.truncateText(lastMessage.content, 40) : 
                    'Sin mensajes';
                
                const time = this.formatTime(chat.updatedAt);
                const isActive = chat.id === this.currentChatId ? 'active' : '';
                
                return `
                    <div class="chat-item ${isActive}" data-chat-id="${chat.id}">
                        <div class="chat-item-header">
                            <span class="chat-item-title">${chat.title}</span>
                            <span class="chat-item-time">${time}</span>
                        </div>
                        <div class="chat-item-preview">${preview}</div>
                    </div>
                `;
            }).join('');
            
            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chatId = parseInt(item.dataset.chatId);
                    this.loadChat(chatId);
                });
            });
        },
        
        truncateText: function(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },
        
        formatTime: function(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'Ahora';
            if (minutes < 60) return `${minutes}m`;
            if (hours < 24) return `${hours}h`;
            if (days < 7) return `${days}d`;
            
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit' 
            });
        },
        
        loadChat: function(chatId) {
            this.currentChatId = chatId;
            const chat = this.getChat(chatId);
            
            if (chat) {
                this.currentMode = chat.mode || 'general';
                document.getElementById('currentChatTitle').textContent = chat.title;
                document.getElementById('currentMode').textContent = `Modo: ${this.getModeName(chat.mode)}`;
                this.renderMessages(chat.messages);
                this.renderChats();
            }
        },
        
        getModeName: function(mode) {
            const modes = {
                'general': 'General',
                'creative': 'Creativo',
                'business': 'Negocios',
                'strategy': 'Estrategia',
                'data': 'Datos',
                'legal': 'Legal',
                'finance': 'Finanzas'
            };
            return modes[mode] || 'General';
        },
        
        renderMessages: function(messages) {
            const container = document.getElementById('messagesContainer');
            
            if (messages.length === 0) {
                container.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <h2>Bienvenido a Dominius AI</h2>
                        <p>Tu asistente de IA con VISIÓN - Puedo ver imágenes, leer PDFs y analizar documentos</p>
                        <div class="quick-suggestions">
                            <button class="suggestion-btn" onclick="sendSuggestion('Necesito un análisis de mercado para mi empresa')">
                                💼 Análisis de mercado
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Analiza esta imagen empresarial')">
                                🖼️ Analizar imagen
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Ayúdame a crear un plan estratégico')">
                                🎯 Plan estratégico
                            </button>
                        </div>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = messages.map((msg, index) => {
                const time = new Date(msg.timestamp).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                let filesHTML = '';
                if (msg.files && msg.files.length > 0) {
                    filesHTML = `
                        <div class="message-files">
                            ${msg.files.map(f => `
                                <div class="message-file-badge">
                                    <span>${getFileIcon(f.type)}</span>
                                    <span>${f.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                
                if (msg.role === 'user') {
                    const userSession = JSON.parse(localStorage.getItem('dominius_session'));
                    const initials = userSession ? 
                        userSession.username.substring(0, 2).toUpperCase() : 
                        'US';
                    
                    return `
                        <div class="message user" style="animation-delay: ${index * 50}ms">
                            <div class="message-avatar" style="background: ${userSession.avatarColor || '#8B5CF6'}">
                                ${initials}
                            </div>
                            <div class="message-content-wrapper">
                                <div class="message-content">${this.escapeHtml(msg.content)}</div>
                                ${filesHTML}
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="message ai" style="animation-delay: ${index * 50}ms">
                            <div class="message-avatar">AI</div>
                            <div class="message-content-wrapper">
                                <div class="message-content">${this.escapeHtml(msg.content)}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        </div>
                    `;
                }
            }).join('');
            
            container.scrollTop = container.scrollHeight;
        },
        
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
    // =============================================
    // FUNCIÓN DE ESCRITURA LETRA POR LETRA
    // =============================================
    async function typeWriter(element, text, speed = 20) {
        return new Promise(resolve => {
            element.innerHTML = '';
            element.style.whiteSpace = 'normal';
            element.style.wordBreak = 'break-word';
            element.style.overflowWrap = 'break-word';
            element.style.lineHeight = '1.6';
            
            let i = 0;
            
            function type() {
                if (i < text.length) {
                    const char = text.charAt(i);
                    
                    if (char === '\n') {
                        element.innerHTML += '<br>';
                    } else {
                        element.textContent += char;
                    }
                    
                    i++;
                    
                    const container = document.getElementById('messagesContainer');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                    
                    let currentSpeed = speed;
                    if (char === '.' || char === '!' || char === '?') {
                        currentSpeed = speed * 3;
                    } else if (char === ',' || char === ';') {
                        currentSpeed = speed * 2;
                    }
                    
                    currentSpeed += Math.random() * 10 - 5;
                    
                    setTimeout(type, Math.max(10, currentSpeed));
                } else {
                    resolve();
                }
            }
            
            type();
        });
    }
    
    // =============================================
    // GENERAR RESPUESTAS CON VISIÓN (Groq Vision)
    // =============================================
    async function getAIResponse(message, mode, files = []) {
        const GROQ_API_KEY = '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';
        
        const systemPrompts = {
            'finance': `Eres un CONSULTOR FINANCIERO SENIOR. Analiza imágenes de gráficos, balances, estados financieros.`,
            'general': `Eres un CONSULTOR EMPRESARIAL. Puedes ver y analizar imágenes, documentos y gráficos.`,
            'strategy': `Eres un ESTRATEGA CORPORATIVO. Analiza diagramas, organigramas, mapas estratégicos.`,
            'business': `Eres un CONSULTOR DE OPERACIONES. Analiza procesos, flujos de trabajo, diagramas.`,
            'creative': `Eres un ESPECIALISTA EN INNOVACIÓN. Analiza diseños, prototipos, mockups.`,
            'data': `Eres un ANALISTA DE DATOS. Interpreta gráficos, tablas, dashboards.`,
            'legal': `Eres un ASESOR LEGAL EMPRESARIAL. Puedes leer contratos y documentos legales.`
        };
        
        const systemPrompt = systemPrompts[mode] || systemPrompts['general'];
        
        try {
            console.log(`🚀 Enviando a Groq AI con VISIÓN (Modo: ${mode})...`);
            
            // Construir el contenido del mensaje
            const userContent = [];
            
            // Añadir texto
            if (message && message.trim()) {
                userContent.push({
                    type: "text",
                    text: message
                });
            }
            
            // Añadir imágenes
            for (const file of files) {
                if (file.isImage && file.base64) {
                    userContent.push({
                        type: "image_url",
                        image_url: {
                            url: `data:${file.type};base64,${file.base64}`
                        }
                    });
                }
                
                // Si es texto, añadir el contenido
                if (file.isText && file.textContent) {
                    userContent.push({
                        type: "text",
                        text: `[Contenido del archivo ${file.name}]:\n${file.textContent}`
                    });
                }
            }
            
            // Si no hay imágenes, usar modelo normal
            const hasImages = files.some(f => f.isImage);
            const model = hasImages ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile';
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userContent.length > 0 ? userContent : message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500,
                    top_p: 0.9
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error:', errorText);
                throw new Error(`Error ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida con VISIÓN');
            
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Respuesta inválida');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            
            // Respuesta de respaldo
            let backupMessage = `He recibido tu mensaje`;
            
            const hasImages = files.some(f => f.isImage);
            const hasText = files.some(f => f.isText);
            const hasPDF = files.some(f => f.isPDF);
            
            if (hasImages) {
                backupMessage += ` con ${files.filter(f => f.isImage).length} imagen(es)`;
            }
            if (hasText) {
                backupMessage += ` y ${files.filter(f => f.isText).length} documento(s) de texto`;
            }
            if (hasPDF) {
                backupMessage += ` y ${files.filter(f => f.isPDF).length} PDF(s)`;
            }
            
            backupMessage += `.\n\nComo consultor de Dominius AI, puedo ayudarte con:\n\n✅ Análisis de imágenes empresariales\n✅ Lectura de documentos\n✅ Interpretación de gráficos\n✅ Planificación estratégica\n\n¿En qué área específica necesitas ayuda?`;
            
            return backupMessage;
        }
    }
    
    // =============================================
    // ENVIAR MENSAJE CON ARCHIVOS
    // =============================================
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message && attachedFiles.length === 0) return;
        
        if (!ChatSystem.currentChatId) {
            const newChat = ChatSystem.createChat();
            ChatSystem.currentChatId = newChat.id;
            ChatSystem.loadChat(newChat.id);
        }
        
        const filesToSend = [...attachedFiles];
        const fileInfo = filesToSend.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type
        }));
        
        ChatSystem.saveMessage(ChatSystem.currentChatId, 'user', message || '[Archivos adjuntos]', fileInfo);
        
        const userSession = JSON.parse(localStorage.getItem('dominius_session'));
        const initials = userSession ? 
            userSession.username.substring(0, 2).toUpperCase() : 
            'US';
        
        const container = document.getElementById('messagesContainer');
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user message-pop';
        
        let filesHTML = '';
        if (filesToSend.length > 0) {
            filesHTML = `
                <div class="message-files">
                    ${filesToSend.map(f => `
                        <div class="message-file-badge">
                            <span>${getFileIcon(f.type)}</span>
                            <span>${f.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        userMessageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${userSession.avatarColor || '#8B5CF6'}">
                ${initials}
            </div>
            <div class="message-content-wrapper">
                <div class="message-content">${ChatSystem.escapeHtml(message || '[Archivos adjuntos]')}</div>
                ${filesHTML}
                <div class="message-time">
                    ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        `;
        
        container.appendChild(userMessageDiv);
        container.scrollTop = container.scrollHeight;
        
        input.value = '';
        const tempFiles = [...attachedFiles];
        attachedFiles = [];
        renderAttachedFiles();
        updateCharCount();
        autoResizeTextarea();
        
        const sendBtn = document.getElementById('sendBtn');
        const originalHTML = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
        
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message ai';
        aiMessageDiv.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content-wrapper">
                <div class="message-content" id="typingMessage_${Date.now()}"></div>
                <div class="message-time">
                    ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        `;
        
        container.appendChild(aiMessageDiv);
        container.scrollTop = container.scrollHeight;
        
        try {
            const aiResponse = await getAIResponse(message, ChatSystem.currentMode, tempFiles);
            
            const typingElement = aiMessageDiv.querySelector('.message-content');
            await typeWriter(typingElement, aiResponse, 20);
            
            ChatSystem.saveMessage(ChatSystem.currentChatId, 'ai', aiResponse);
            
        } catch (error) {
            console.error('Error:', error);
            const typingElement = aiMessageDiv.querySelector('.message-content');
            typingElement.textContent = `⚠️ Error técnico temporal. Por favor, intenta de nuevo.`;
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalHTML;
            ChatSystem.renderChats();
        }
    }
    
    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================
    
    window.sendSuggestion = function(text) {
        const input = document.getElementById('messageInput');
        input.value = text;
        sendMessage();
    };
    
    function updateCharCount() {
        const input = document.getElementById('messageInput');
        const count = document.getElementById('charCount');
        if (input && count) {
            count.textContent = `${input.value.length} / 4000`;
        }
    }
    
    function autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        }
    }
    
    // =============================================
    // CONFIGURAR EVENTOS
    // =============================================
    
    ChatSystem.renderChats();
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabName}Panel`).classList.add('active');
        });
    });
    
    document.getElementById('newChatBtn').addEventListener('click', () => {
        const newChat = ChatSystem.createChat();
        ChatSystem.loadChat(newChat.id);
    });
    
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            ChatSystem.currentMode = mode;
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            document.getElementById('currentMode').textContent = `Modo: ${ChatSystem.getModeName(mode)}`;
            const newChat = ChatSystem.createChat();
            ChatSystem.loadChat(newChat.id);
            document.querySelector('[data-tab="chats"]').click();
        });
    });
    
    document.getElementById('clearChatBtn').addEventListener('click', () => {
        if (ChatSystem.currentChatId && confirm('¿Estás seguro de que quieres limpiar este chat?')) {
            ChatSystem.clearChat(ChatSystem.currentChatId);
            ChatSystem.loadChat(ChatSystem.currentChatId);
        }
    });
    
    document.getElementById('deleteChatBtn').addEventListener('click', () => {
        if (ChatSystem.currentChatId && confirm('¿Estás seguro de que quieres eliminar este chat?')) {
            ChatSystem.deleteChat(ChatSystem.currentChatId);
            ChatSystem.currentChatId = null;
            ChatSystem.renderChats();
            document.getElementById('currentChatTitle').textContent = 'Nuevo Chat';
            document.getElementById('messagesContainer').innerHTML = `
                <div class="welcome-message">
                    <h2>Bienvenido a Dominius AI</h2>
                    <p>Tu asistente con VISIÓN</p>
                </div>
            `;
        }
    });
    
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            updateCharCount();
            autoResizeTextarea();
        });
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        setTimeout(() => {
            messageInput.focus();
        }, 500);
    }
    
    console.log('✅ Dominius AI con VISIÓN cargado correctamente');
    console.log('👁️ Ahora puedo VER imágenes y analizar documentos');
});
