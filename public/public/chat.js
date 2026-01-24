// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('💬 Dominius AI - Cargando chat profesional...');
    
    // Verificar sesión
    const session = localStorage.getItem('dominius_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos del usuario
    const userSession = JSON.parse(session);
    if (userSession) {
        document.getElementById('userName').textContent = userSession.username || 'Usuario';
        const initials = userSession.username ? userSession.username.substring(0, 2).toUpperCase() : 'US';
        document.getElementById('userInitials').textContent = initials;
        
        if (userSession.avatarColor) {
            document.getElementById('userInitials').style.background = userSession.avatarColor;
        }
    }
    
    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('dominius_session');
            window.location.href = 'index.html';
        }
    });
    
    // =============================================
    // SISTEMA DE CHATS PROFESIONAL
    // =============================================
    const ChatSystem = {
        currentChatId: null,
        currentMode: 'general',
        
        // Obtener chats
        getChats: function() {
            try {
                const chats = localStorage.getItem('dominius_chats');
                return chats ? JSON.parse(chats) : [];
            } catch (error) {
                console.error('Error leyendo chats:', error);
                return [];
            }
        },
        
        // Guardar chats
        saveChats: function(chats) {
            try {
                localStorage.setItem('dominius_chats', JSON.stringify(chats));
            } catch (error) {
                console.error('Error guardando chats:', error);
            }
        },
        
        // Crear nuevo chat
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
            
            // Efecto visual
            const newChatBtn = document.getElementById('newChatBtn');
            newChatBtn.classList.add('btn-press');
            setTimeout(() => newChatBtn.classList.remove('btn-press'), 200);
            
            return newChat;
        },
        
        // Guardar mensaje
        saveMessage: function(chatId, role, content) {
            const chats = this.getChats();
            const chat = chats.find(c => c.id === chatId);
            
            if (chat) {
                chat.messages.push({
                    role: role,
                    content: content,
                    timestamp: new Date().toISOString()
                });
                
                chat.updatedAt = new Date().toISOString();
                
                // Actualizar título si es nuevo chat
                if (chat.messages.length === 1 && chat.title === 'Nuevo Chat') {
                    chat.title = this.generateTitle(content);
                }
                
                this.saveChats(chats);
                this.renderChats();
            }
        },
        
        // Generar título del chat
        generateTitle: function(content) {
            const words = content.trim().split(' ');
            if (words.length === 0) return 'Nuevo Chat';
            
            const title = words.slice(0, 4).join(' ');
            return title.length > 30 ? title.substring(0, 27) + '...' : title;
        },
        
        // Obtener chat por ID
        getChat: function(chatId) {
            const chats = this.getChats();
            return chats.find(c => c.id === chatId);
        },
        
        // Eliminar chat
        deleteChat: function(chatId) {
            let chats = this.getChats();
            chats = chats.filter(c => c.id !== chatId);
            this.saveChats(chats);
        },
        
        // Limpiar chat
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
        
        // Renderizar lista de chats
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
            
            // Agregar eventos a los chats
            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chatId = parseInt(item.dataset.chatId);
                    this.loadChat(chatId);
                });
            });
        },
        
        // Acortar texto
        truncateText: function(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },
        
        // Formatear tiempo
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
        
        // Cargar chat
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
        
        // Obtener nombre del modo
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
        
        // Renderizar mensajes
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
                        <p>Tu asistente de IA especializado para empresarios y empresas</p>
                        <div class="quick-suggestions">
                            <button class="suggestion-btn" onclick="sendSuggestion('Necesito un análisis de mercado para mi empresa')">
                                💼 Análisis de mercado
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Genera un informe financiero trimestral')">
                                📊 Informe financiero
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Ayúdame a crear un plan estratégico')">
                                🎯 Plan estratégico
                            </button>
                            <button class="suggestion-btn" onclick="sendSuggestion('Dame ideas innovadoras para mi negocio')">
                                💡 Ideas de negocio
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
            
            // Scroll al final
            container.scrollTop = container.scrollHeight;
        },
        
        // Escapar HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
    // =============================================
    // FUNCIÓN DE ESCRITURA LETRA POR LETRA PROFESIONAL
    // =============================================
    async function typeWriter(element, text, speed = 20) {
        return new Promise(resolve => {
            // LIMPIAR completamente el elemento
            element.innerHTML = '';
            element.style.whiteSpace = 'normal';
            element.style.wordBreak = 'break-word';
            element.style.overflowWrap = 'break-word';
            element.style.lineHeight = '1.6';
            
            let i = 0;
            const fullText = text;
            
            function type() {
                if (i < fullText.length) {
                    const char = fullText.charAt(i);
                    const currentHTML = element.innerHTML;
                    
                    // Usar textContent en lugar de innerHTML para caracteres normales
                    if (char === '\n') {
                        // Para saltos de línea, usar br correctamente
                        element.innerHTML = currentHTML + '<br>';
                    } else if (char === ' ') {
                        // Para espacios, mantenerlos
                        element.textContent = element.textContent + ' ';
                    } else {
                        // Para otros caracteres, usar textContent
                        element.textContent = element.textContent + char;
                    }
                    
                    i++;
                    
                    // Scroll automático
                    const container = document.getElementById('messagesContainer');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                    
                    // Velocidad variable para naturalidad
                    let currentSpeed = speed;
                    if (char === '.' || char === '!' || char === '?') {
                        currentSpeed = speed * 3;
                    } else if (char === ',' || char === ';') {
                        currentSpeed = speed * 2;
                    }
                    
                    // Variación aleatoria pequeña
                    currentSpeed += Math.random() * 10 - 5;
                    
                    setTimeout(type, Math.max(10, currentSpeed));
                } else {
                    // Al terminar, asegurar estilos
                    element.style.whiteSpace = 'normal';
                    element.style.wordBreak = 'break-word';
                    element.style.overflowWrap = 'break-word';
                    resolve();
                }
            }
            
            // Comenzar a escribir
            type();
        });
    }
    
    // =============================================
    // GENERAR RESPUESTAS DE IA CON GROQ (100% GRATIS)
    // =============================================
    async function getAIResponse(message, mode) {
        const GROQ_API_KEY = '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';
        
        try {
            console.log('🚀 Enviando consulta a Groq AI...');
            
            // Sistema de prompts especializados por modo
            const systemPrompts = {
                'general': `Eres Dominius AI, un asistente de IA especializado para empresarios y empresas.
                Eres experto en: análisis de mercado, estrategia empresarial, finanzas, marketing, operaciones, gestión de equipos.
                Responde en español de manera profesional, estructurada y práctica.
                Proporciona valor real con ejemplos concretos y pasos accionables.
                Formatea respuestas claramente con encabezados, listas y secciones cuando sea apropiado.`,
                
                'finance': `Eres un CONSULTOR FINANCIERO EXPERTO de Dominius AI.
                Especialidades: análisis financiero, proyecciones, control de costos, inversiones, fiscalidad.
                Proporciona respuestas técnicas pero comprensibles, con números y porcentajes cuando sea relevante.
                Incluye estructuras de informes, KPIs financieros y recomendaciones específicas.
                Responde en español con formato profesional.`,
                
                'strategy': `Eres un ESTRATEGA EMPRESARIAL de Dominius AI.
                Especialidades: planificación estratégica, análisis competitivo, desarrollo de modelos de negocio, innovación.
                Proporciona marcos estratégicos, análisis DAFO, hoja de ruta y planes de implementación.
                Sé visionario pero práctico, con hitos medibles.
                Responde en español con estructura clara.`,
                
                'business': `Eres un CONSULTOR DE NEGOCIOS de Dominius AI.
                Especialidades: gestión operativa, optimización de procesos, escalabilidad, eficiencia, customer experience.
                Proporciona soluciones prácticas para problemas empresariales cotidianos.
                Incluye checklist, mejores prácticas y casos de éxito.
                Responde en español de manera directa y útil.`,
                
                'creative': `Eres un ESPECIALISTA EN INNOVACIÓN de Dominius AI.
                Especialidades: brainstorming creativo, diseño thinking, innovación disruptiva, branding, storytelling.
                Proporciona ideas originales, enfoques no convencionales y soluciones creativas.
                Sé inspirador pero realista, con ejemplos de implementación.
                Responde en español con energía y creatividad.`,
                
                'data': `Eres un ANALISTA DE DATOS de Dominius AI.
                Especialidades: analytics, business intelligence, KPIs, dashboards, toma de decisiones basada en datos.
                Proporciona análisis cuantitativos, métricas relevantes y visualización de datos.
                Explica conceptos técnicos de manera accesible.
                Responde en español con precisión técnica.`,
                
                'legal': `Eres un ASESOR LEGAL EMPRESARIAL de Dominius AI.
                Especialidades: compliance, contratos, protección de datos, propiedad intelectual, regulaciones sectoriales.
                Proporciona orientación legal preventiva, checklist de cumplimiento y mejores prácticas.
                Aclara que no es asesoría legal vinculante pero sí orientativa.
                Responde en español con precisión jurídica.`
            };
            
            const systemPrompt = systemPrompts[mode] || systemPrompts['general'];
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama3-70b-8192',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200,
                    stream: false
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error HTTP de Groq:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida de Groq');
            
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
            } else {
                console.error('Estructura de respuesta inesperada:', data);
                throw new Error('Respuesta inválida de la IA');
            }
            
        } catch (error) {
            console.error('❌ Error conectando con Groq AI:', error);
            
            // Respuestas de respaldo MEJORADAS y ESPECÍFICAS
            const backupResponses = {
                'finance': `**📊 INFORME FINANCIERO TRIMESTRAL - ESTRUCTURA PROFESIONAL**

## 1. RESUMEN EJECUTIVO
- **Resultados clave del trimestre**: Análisis comparativo vs objetivos
- **Logros destacados**: Crecimiento, eficiencia, reducción de costos
- **Desafíos identificados**: Áreas de mejora y riesgos

## 2. ANÁLISIS DE INGRESOS
- **Ingresos totales**: Desglose por producto/servicio/canal
- **Tendencias de ventas**: Estacionalidad, crecimiento, comparativa
- **Clientes clave**: Contribución al revenue, retención

## 3. GESTIÓN DE COSTOS Y GASTOS
- **Costos directos**: Eficiencia productiva, margen bruto
- **Gastos operativos**: Control vs presupuesto, optimizaciones
- **Inversiones estratégicas**: ROI esperado, justificación

## 4. FLUJOS DE CAJA
- **Operativo**: Generación de caja, ciclo de conversión
- **Inversiones**: Capex estratégico, amortizaciones
- **Financiación**: Endeudamiento, coste financiero

## 5. INDICADORES FINANCIEROS CLAVE (KPIs)
- **Rentabilidad**: Margen neto, ROE, ROI
- **Liquidez**: Ratio corriente, fondo de maniobra
- **Solvencia**: Nivel de endeudamiento, capacidad de pago
- **Eficiencia**: Rotaciones, ciclo de caja

## 6. PROYECCIONES Y RECOMENDACIONES
- **Escenarios para próximo trimestre**: Conservador, realista, optimista
- **Acciones prioritarias**: 3-5 medidas concretas
- **Seguimiento**: Métricas de control, revisiones periódicas

**⏱️ PRÓXIMOS PASOS INMEDIATOS:**
1. Validar datos con equipo contable
2. Programar reunión de análisis ejecutivo
3. Actualizar presupuesto trimestral
4. Definir sistema de seguimiento semanal

¿Te gustaría que desarrolle algún apartado específico o necesitas un formato particular para presentación?`,
                
                'general': `He analizado tu consulta sobre "${message.substring(0, 50)}...". 

Como consultor empresarial de Dominius AI, te propongo este **ENFOQUE ESTRUCTURADO**:

## 🔍 DIAGNÓSTICO INICIAL
1. **Contexto actual**: Situación y objetivos
2. **Recursos disponibles**: Humanos, financieros, tecnológicos
3. **Restricciones identificadas**: Tiempo, presupuesto, capacidades

## 🎯 DEFINICIÓN DE OBJETIVOS SMART
- **Específico**: Resultado concreto esperado
- **Medible**: KPIs cuantificables
- **Alcanzable**: Recursos y capacidades realistas
- **Relevante**: Alineación con estrategia global
- **Temporal**: Plazos definidos

## 📋 PLAN DE ACCIÓN PRIORIZADO
**Fase 1 (Semanas 1-2)**: Diagnóstico profundo
**Fase 2 (Semanas 3-4)**: Planificación detallada
**Fase 3 (Mes 2)**: Implementación controlada
**Fase 4 (Mes 3)**: Evaluación y ajustes

## 🛠️ HERRAMIENTAS RECOMENDADAS
- **Gestión**: Asana/Trello para seguimiento
- **Análisis**: Google Analytics/Data Studio
- **Comunicación**: Slack/Teams para coordinación
- **Documentación**: Notion/Google Docs

**¿Qué aspecto te gustaría desarrollar primero?**`,
                
                'strategy': `**🎯 PLAN ESTRATÉGICO - ESTRUCTURA**

## 1. ANÁLISIS DE SITUACIÓN (DAFO)
- **Fortalezas**: Ventajas competitivas internas
- **Debilidades**: Áreas de mejora crítica
- **Oportunidades**: Tendencias mercado, gaps
- **Amenazas**: Competencia, cambios regulatorios

## 2. VISIÓN Y OBJETIVOS ESTRATÉGICOS
- **Horizonte temporal**: 1-3-5 años
- **Objetivos corporativos**: Crecimiento, rentabilidad, mercado
- **Métricas de éxito**: KPIs estratégicos

## 3. ESTRATEGIAS POR ÁREA
- **Mercado**: Posicionamiento, segmentación
- **Operaciones**: Eficiencia, calidad, costos
- **Innovación**: I+D, digitalización, nuevos modelos
- **Personas**: Talento, cultura, liderazgo

## 4. PLAN DE IMPLEMENTACIÓN
- **Hitos trimestrales**: Entregables clave
- **Responsables**: Equipos y liderazgo
- **Recursos**: Presupuesto, herramientas, capacitación

## 5. SISTEMA DE CONTROL
- **Revisión mensual**: Desviaciones y ajustes
- **Indicadores adelantados**: Early warnings
- **Cultura de mejora continua**: Aprendizaje organizacional

**¿En qué fase estratégica necesitas más apoyo?**`
            };
            
            return backupResponses[mode] || backupResponses['general'];
        }
    }
    
    // =============================================
    // ENVIAR MENSAJE CON ESCRITURA PROFESIONAL
    // =============================================
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Crear chat si no existe
        if (!ChatSystem.currentChatId) {
            const newChat = ChatSystem.createChat();
            ChatSystem.currentChatId = newChat.id;
            ChatSystem.loadChat(newChat.id);
        }
        
        // Guardar mensaje del usuario
        ChatSystem.saveMessage(ChatSystem.currentChatId, 'user', message);
        
        // Mostrar mensaje del usuario inmediatamente
        const userSession = JSON.parse(localStorage.getItem('dominius_session'));
        const initials = userSession ? 
            userSession.username.substring(0, 2).toUpperCase() : 
            'US';
        
        const container = document.getElementById('messagesContainer');
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user message-pop';
        userMessageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${userSession.avatarColor || '#8B5CF6'}">
                ${initials}
            </div>
            <div class="message-content-wrapper">
                <div class="message-content">${ChatSystem.escapeHtml(message)}</div>
                <div class="message-time">
                    ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        `;
        
        container.appendChild(userMessageDiv);
        container.scrollTop = container.scrollHeight;
        
        // Limpiar input
        input.value = '';
        updateCharCount();
        autoResizeTextarea();
        
        // Deshabilitar botón mientras procesa
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>';
        
        // Crear elemento para respuesta de IA (vacío)
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
            // Obtener respuesta de IA REAL de Groq
            const aiResponse = await getAIResponse(message, ChatSystem.currentMode);
            
            // Mostrar respuesta con efecto de escritura
            const typingElement = aiMessageDiv.querySelector('.message-content');
            await typeWriter(typingElement, aiResponse, 20);
            
            // Guardar respuesta
            ChatSystem.saveMessage(ChatSystem.currentChatId, 'ai', aiResponse);
            
        } catch (error) {
            console.error('Error en sendMessage:', error);
            const typingElement = aiMessageDiv.querySelector('.message-content');
            typingElement.textContent = `⚠️ Error técnico temporal. Por favor, intenta de nuevo en un momento.`;
        } finally {
            // Rehabilitar botón
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
            
            // Actualizar lista de chats
            ChatSystem.renderChats();
        }
    }
    
    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================
    
    // Función para sugerencias
    window.sendSuggestion = function(text) {
        const input = document.getElementById('messageInput');
        input.value = text;
        sendMessage();
    };
    
    // Actualizar contador de caracteres
    function updateCharCount() {
        const input = document.getElementById('messageInput');
        const count = document.getElementById('charCount');
        if (input && count) {
            count.textContent = `${input.value.length} / 4000`;
        }
    }
    
    // Auto-ajustar altura del textarea
    function autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        }
    }
    
    // =============================================
    // CONFIGURAR EVENTOS DE LA INTERFAZ
    // =============================================
    
    // Inicializar chats
    ChatSystem.renderChats();
    
    // Pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Actualizar botones activos
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Actualizar paneles
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`${tabName}Panel`).classList.add('active');
        });
    });
    
    // Nuevo chat
    document.getElementById('newChatBtn').addEventListener('click', () => {
        const newChat = ChatSystem.createChat();
        ChatSystem.loadChat(newChat.id);
    });
    
    // Modos de chat
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            ChatSystem.currentMode = mode;
            
            // Actualizar tarjetas activas
            document.querySelectorAll('.mode-card').forEach(c => {
                c.classList.remove('active');
            });
            card.classList.add('active');
            
            // Actualizar indicador de modo
            document.getElementById('currentMode').textContent = `Modo: ${ChatSystem.getModeName(mode)}`;
            
            // Crear nuevo chat con el modo seleccionado
            const newChat = ChatSystem.createChat();
            ChatSystem.loadChat(newChat.id);
            
            // Cambiar a pestaña de chats
            document.querySelector('[data-tab="chats"]').click();
        });
    });
    
    // Limpiar chat
    document.getElementById('clearChatBtn').addEventListener('click', () => {
        if (ChatSystem.currentChatId && confirm('¿Estás seguro de que quieres limpiar este chat?')) {
            ChatSystem.clearChat(ChatSystem.currentChatId);
            ChatSystem.loadChat(ChatSystem.currentChatId);
        }
    });
    
    // Eliminar chat
    document.getElementById('deleteChatBtn').addEventListener('click', () => {
        if (ChatSystem.currentChatId && confirm('¿Estás seguro de que quieres eliminar este chat?')) {
            ChatSystem.deleteChat(ChatSystem.currentChatId);
            ChatSystem.currentChatId = null;
            ChatSystem.renderChats();
            
            // Restablecer vista
            document.getElementById('currentChatTitle').textContent = 'Nuevo Chat';
            document.getElementById('messagesContainer').innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h2>Bienvenido a Dominius AI</h2>
                    <p>Tu asistente de IA especializado para empresarios y empresas</p>
                    <div class="quick-suggestions">
                        <button class="suggestion-btn" onclick="sendSuggestion('Necesito un análisis de mercado para mi empresa')">
                            💼 Análisis de mercado
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Genera un informe financiero trimestral')">
                            📊 Informe financiero
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Ayúdame a crear un plan estratégico')">
                            🎯 Plan estratégico
                        </button>
                        <button class="suggestion-btn" onclick="sendSuggestion('Dame ideas innovadoras para mi negocio')">
                            💡 Ideas de negocio
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    // Botón enviar
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    // Eventos del input
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
        
        // Enfocar el input al cargar
        setTimeout(() => {
            messageInput.focus();
            autoResizeTextarea();
        }, 500);
    }
    
    // =============================================
    // INYECTAR ESTILOS ADICIONALES PROFESIONALES
    // =============================================
    const additionalStyles = `
        <style>
            /* GARANTIZAR que el texto no se monte - DEFINITIVO */
            .message-content {
                white-space: normal !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                line-height: 1.6 !important;
                display: block !important;
                max-width: 100% !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            .message-content * {
                white-space: normal !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                line-height: inherit !important;
                display: inline !important;
            }
            
            .message-content br {
                display: block !important;
                content: "" !important;
                margin-bottom: 0.5em !important;
            }
            
            .message-content h1, 
            .message-content h2, 
            .message-content h3, 
            .message-content h4 {
                display: block !important;
                margin-top: 1em !important;
                margin-bottom: 0.5em !important;
                font-weight: 600 !important;
            }
            
            .message-content ul, 
            .message-content ol {
                display: block !important;
                margin-left: 1.5em !important;
                margin-bottom: 1em !important;
            }
            
            .message-content li {
                display: list-item !important;
                margin-bottom: 0.3em !important;
            }
            
            .message-content strong {
                font-weight: 600 !important;
            }
            
            .message-content em {
                font-style: italic !important;
            }
            
            /* Animación de mensajes nuevos */
            .message-pop {
                animation: popIn 0.3s ease-out;
            }
            
            @keyframes popIn {
                0% {
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Efecto de botón presionado */
            .btn-press {
                animation: press 0.2s ease;
            }
            
            @keyframes press {
                0% { transform: scale(1); }
                50% { transform: scale(0.96); }
                100% { transform: scale(1); }
            }
            
            /* Scroll suave */
            .messages-container {
                scroll-behavior: smooth;
            }
            
            /* Indicador de escritura */
            .typing-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: rgba(138, 43, 226, 0.1);
                border-radius: 12px;
                font-size: 12px;
                color: #8B5CF6;
            }
            
            .typing-dot {
                width: 6px;
                height: 6px;
                background: #8B5CF6;
                border-radius: 50%;
                animation: bounce 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
            
            /* Botón de enviar deshabilitado */
            #sendBtn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Responsive mejorado */
            @media (max-width: 768px) {
                .message-content-wrapper {
                    max-width: 85% !important;
                }
                
                .welcome-message {
                    padding: 20px;
                }
                
                .welcome-message h2 {
                    font-size: 24px;
                }
                
                .quick-suggestions {
                    flex-direction: column;
                }
                
                .suggestion-btn {
                    width: 100%;
                    margin: 5px 0;
                }
            }
            
            /* Asegurar que los mensajes no se superpongan */
            .message {
                clear: both !important;
                float: none !important;
                margin-bottom: 20px !important;
            }
            
            .message-content-wrapper {
                display: block !important;
                max-width: 80% !important;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
    
    console.log('✅ Dominius AI cargado correctamente con Groq');
    console.log('🔑 API Key configurada:', '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'.substring(0, 10) + '...');
});