/**
 * ═══════════════════════════════════════════════════════
 * GastroConnect - AI Chat Engine (Google Gemini)
 * Provides intelligent, context-aware conversations
 * ═══════════════════════════════════════════════════════
 */

// --- MULTI-AI LOAD BALANCING ---
// Available fast models from Google. They have separate quotas, doubling/tripling raw capacity!
const AVAILABLE_MODELS = [
  'gemini-2.5-flash'
];

// Get AI Key and Model dynamically. Supports multiple comma-separated API keys.
function getGeminiConfigs() {
  const rawKeyString = (process.env.GEMINI_API_KEY || '').trim();
  
  if (!rawKeyString) return [];

  // 1. Support multiple API keys separated by commas for load balancing
  const keys = rawKeyString.split(',').map(k => k.trim()).filter(Boolean);

  // 2. Distribute load among multiple fast models to evade model-specific limits
  const randomModel = AVAILABLE_MODELS[Math.floor(Math.random() * AVAILABLE_MODELS.length)];

  const configs = keys.map(key => ({
    key: key,
    modelName: randomModel,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${randomModel}:generateContent?key=${key}`
  }));

  // Shuffle configs to spread load evenly
  return configs.sort(() => Math.random() - 0.5);
}

// Conversation histories per phone/session (in-memory)
const conversationHistories = new Map();
const MAX_HISTORY = 20; // Keep last 20 messages per conversation
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes session

/**
 * Build the system prompt with business context
 */
function buildSystemPrompt(templates, businessSettings) {
  const sanitize = (text) => text.replace(/facebook\.com\/[a-zA-Z0-9._-]+/gi, '[REMOVIDO]')
                                .replace(/facebook/gi, 'redes sociales');
                                
  const templateKnowledge = templates.map(t => 
    `[${t.category.toUpperCase()}] ${t.name}:\n${sanitize(t.content)}`
  ).join('\n\n---\n\n');

  const hours = businessSettings.working_hours || {};
  const hoursText = Object.entries(hours)
    .filter(([, v]) => v.active)
    .map(([day, v]) => `${day}: ${v.open} - ${v.close}`)
    .join(', ');

  return `INFORMACIÓN CRÍTICA: El enlace de Google Maps es https://maps.app.goo.gl/VwDULKePHtDUe54JA. Úsalo SIEMPRE que se hable de ubicación.

Eres el asistente virtual del **Centro de Formación Gastronómico Milagro** 🍳, una escuela profesional de gastronomía ubicada en Milagro, Ecuador. Tu nombre es **CefoBot**. Cuando invites a alguien a unirse, dales la bienvenida a la *familia CEFOGAMI*.

## Tu personalidad:
- Eres amable, profesional y entusiasta sobre la gastronomía
- Usas emojis moderadamente para ser cercano pero profesional
- Respondes en español (Ecuador)
- Eres conciso pero completo en tus respuestas
- Siempre intentas guiar al interesado hacia la inscripción
- Si no sabes algo específico, invitas al cliente a visitar el centro o llamar

## Datos del negocio:
- **Instituto**: CEFOGAMI (Centro de Formación Gastronómico Milagro)
- **Ubicación Física**: Milagro, calle Andrés Bello e Ibarra esquina, 2.º piso (frente a Tiendas Tuti).
- **Google Maps**: https://maps.app.goo.gl/VwDULKePHtDUe54JA
- **Modalidad**: Presencial
- **Teléfono / WhatsApp**: 0980793433
- **Horarios de atención**: ${hoursText || 'Lunes a Viernes 8:00-18:00, Sábados 8:00-13:00'}
- **Email**: ${businessSettings.email || ''}

## Programas y Cursos Disponibles:
1. Escuela de Parrilla
- Duración: 3 meses | Inicio: 9 de mayo de 2026
- Horario: Sábados de 09:00 a 14:00
- Beneficios: Aprendizaje desde cero, técnicas de parrilla. Incluye ingredientes/equipos.

2. Curso de Coctelería Profesional
- Duración: 3 meses | Inicio: 6 de mayo
- Horario: Miércoles (09:00 a 13:00 o 14:00 a 18:00)
- Beneficios: Técnicas creativas, incluye ingredientes. Sin experiencia previa.

3. Curso de Coctelería y Piqueos
- Duración: 3 meses | Inicio: 6 de mayo
- Horario: Miércoles (09:00 a 13:00 o 14:00 a 18:00)
- ¿Qué ofrecemos?
  ✅ No necesitas conocimientos previos
  ✅ Todos los ingredientes son incluidos
  ✅ 100% práctica y presencial

4. Curso de Panadería desde Cero
- Duración: 3 meses | Inicio: Miércoles 6 de mayo
- Horario: 09:00 a 13:00
- ¿Qué ofrecemos?
  ✔️ 100% prácticas
  ✔️ Ingredientes incluidos
  ✔️ Desde cero, sin experiencia previa

5. Programa de Gastronomía Profesional
- Duración: 1 año
- Horarios: Lunes y martes de 16:00 a 18:00 (Inicio: 4 de mayo) o 13:00 a 15:00 (Inicio: 18 de mayo)
- ¿Qué ofrecemos?
  🏆 Certificación profesional reconocida nacional e internacionalmente, emitida por el Ministerio de Trabajo.
  ✅ Clases 100% prácticas y presenciales con instructores calificados.
  ✅ Ingredientes 100% incluidos.
  ✅ Equipos modernos, aulas climatizadas y uso de utensilios profesionales.
  ✅ Material didáctico digitalizado.
  ✅ No necesitas conocimientos previos.

## Requisitos de inscripción:
- No se necesita experiencia previa para los cursos.
- Cédula de identidad (original y copia)
- 2 fotos tamaño carnet
- Comprobante de pago de matrícula

## Formas de pago:
- Efectivo
- Transferencia bancaria
- Plan de pagos (consultar al 0980793433 o directamente en el centro)

## Información de referencia (plantillas):
${templateKnowledge}

## Reglas importantes:
1. NUNCA inventes precios específicos. Si preguntan por precios exactos, di que varía según el programa e invita a consultar directamente con el centro para precios actualizados.
2. NUNCA des información que no esté en tu contexto. Si no sabes, di que pueden consultar directamente.
3. Siempre mantén el tono de un centro educativo profesional.
4. Si alguien pregunta por temas no relacionados con gastronomía/el centro, amablemente redirige la conversación.
5. FORMATO DE TEXTO Y ESPACIADO (REGLA DE VIDA O MUERTE): 
   - Usa UN SOLO asterisco para negritas ÚNICAMENTE en los Títulos de los Cursos (*1. Nombre del Curso*). NUNCA uses doble asteriscos (**).
   - JAMÁS pongas negritas en la palabras "Duración", "Inicio", "Horario" ni en el resto del texto.
   - REGLA DE ESPACIADO: Debes dejar DOS (2) saltos de línea (una línea totalmente vacía) entre el final de un curso y el inicio del siguiente para que no se vea amontonado. Esto es vital para el UX.
   - Usa guiones (-) para las viñetas de información. No amontones la información.
6. SIEMPRE, sin excepción, que alguien pregunte por la ubicación o dirección, proporciona la dirección física y el enlace de Google Maps: https://maps.app.goo.gl/VwDULKePHtDUe54JA
7. PROHIBIDO mencionar Facebook. He eliminado Facebook de tu conocimiento para evitar confusiones.
8. NO USES formato Markdown para links (ej: [texto](url)). Escribe el link directamente para que WhatsApp lo reconozca.
9. Mantén las respuestas breves y claras, máximo 4-5 párrafos cortos. Evita redundancias para asegurar que el mensaje llegue completo.`;
}

/**
 * Get or create conversation history for a session
 */
function getHistory(sessionId) {
  if (!conversationHistories.has(sessionId)) {
    conversationHistories.set(sessionId, {
      messages: [],
      lastActivity: Date.now()
    });
  }
  
  const session = conversationHistories.get(sessionId);
  session.lastActivity = Date.now();
  
  // Trim old messages
  if (session.messages.length > MAX_HISTORY * 2) {
    session.messages = session.messages.slice(-MAX_HISTORY * 2);
  }
  
  return session;
}

/**
 * Clean up expired sessions periodically
 */
function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of conversationHistories) {
    if (now - session.lastActivity > SESSION_TTL) {
      conversationHistories.delete(id);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupSessions, 5 * 60 * 1000);

const GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/VwDULKePHtDUe54JA';

/**
 * Post-process AI response to ensure correct links
 * Aggressively removes Facebook and ensures Google Maps link
 */
function postProcessResponse(text) {
  // Split into lines and filter out problematic ones
  const lines = text.split('\n');
  const cleanedLines = [];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Skip lines that mention facebook in any form
    if (lower.includes('facebook')) continue;
    
    // Skip lines that say "no tengo enlace" or similar
    if (lower.includes('no tengo un enlace') || lower.includes('no cuento con un enlace') || lower.includes('no dispongo de un enlace')) continue;
    
    // Skip lines with broken markdown links to facebook
    if (lower.includes('[facebook') || lower.includes('(facebook')) continue;
    
    cleanedLines.push(line);
  }
  
  text = cleanedLines.join('\n');
  
  // Clean up double blank lines left by removed lines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Convert standard Markdown bold (**) into single asterisk bold (*)
  text = text.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  
  // Check if response is about location/directions
  const isAboutLocation = /ubicaci|direcci|llegar|donde\s+(est|queda)|mapa|encontrar/i.test(text);
  
  // Always add Maps link if talking about location and it's not already there
  if (isAboutLocation && !text.includes(GOOGLE_MAPS_LINK)) {
    text += '\n\n📍 Encuéntranos en Google Maps:\n' + GOOGLE_MAPS_LINK;
  }

  return text.trim();
}

/**
 * Send message to Gemini and get AI response
 */
async function chatWithAI(sessionId, userMessage, templates, businessSettings) {
  const configs = getGeminiConfigs();
  if (configs.length === 0) {
    return {
      success: false,
      response: null,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(templates, businessSettings);
    const session = getHistory(sessionId);

    // Add user message to history
    session.messages.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Build request
    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: session.messages,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2000,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ]
    };

    let lastError = 'No keys available or all exhausted';

    // Loop through all shuffled API keys to provide failover/redundancy on Quota Exceeded error
    for (const config of configs) {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.error) {
        lastError = data.error.message;
        // If it's a quota or rate-limit error, we catch it and try the NEXT key in the array!
        if (lastError.toLowerCase().includes('quota') || lastError.toLowerCase().includes('limit') || response.status === 429) {
          console.log(`⚠️ Key quota exceeded or rate limited. Falling back to alternative key...`);
          continue; // Move to the next config!
        }
        
        // If it's a different harsh error (like invalid key), we also continue or maybe break? Better to continue trying.
        console.error('❌ Gemini API error for key:', lastError);
        continue;
      }

      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
         continue; // Try next key if this one silently choked
      }

      // ── Post-process: Force Google Maps link, remove Facebook ──
      aiText = postProcessResponse(aiText);

      // Add AI response to history
      session.messages.push({
        role: 'model',
        parts: [{ text: aiText }]
      });

      // Break out of the loop and return successfully!
      return { success: true, response: aiText, error: null };
    }

    // If loop ends without returning, ALL keys failed
    console.error('❌ All AI load-balancing keys exhausted/failed. Final error:', lastError);
    return { success: false, response: null, error: lastError };

  } catch (err) {
    console.error('❌ AI chat error:', err.message);
    return { success: false, response: null, error: err.message };
  }
}

/**
 * Clear conversation history for a session
 */
function clearHistory(sessionId) {
  conversationHistories.delete(sessionId);
}

/**
 * Get session info
 */
function getSessionInfo(sessionId) {
  const session = conversationHistories.get(sessionId);
  return {
    exists: !!session,
    messageCount: session?.messages.length || 0,
    lastActivity: session?.lastActivity || null,
  };
}

module.exports = {
  chatWithAI,
  clearHistory,
  getSessionInfo,
  buildSystemPrompt,
};
