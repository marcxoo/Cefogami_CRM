/**
 * ═══════════════════════════════════════════════════════
 * GastroConnect - WhatsApp Chatbot Server
 * Centro De Formación Gastronómico Milagro
 * ═══════════════════════════════════════════════════════
 * 
 * This server handles:
 * 1. WhatsApp Cloud API webhook verification
 * 2. Receiving incoming WhatsApp messages
 * 3. Matching messages against auto-response rules
 * 4. Sending automatic replies via WhatsApp Cloud API
 * 5. Logging all conversations to Supabase
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { chatWithAI, clearHistory, getSessionInfo } = require('./ai-chat.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// ── Config ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'gastroconnect_verify_2024';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vynvxukmejsdwzmpcowf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bnZ4dWttZWpzZHd6bXBjb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjQ0NDcsImV4cCI6MjA5MjA0MDQ0N30.SqPIR4uLV9QAbTaG3f9eBqjlVjacIfmzmuYell1mCSE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache for auto-responses and templates (refreshed every 60s)
let autoResponses = [];
let templates = {};
let templatesList = [];
let businessSettings = {};
let lastCacheRefresh = 0;
const CACHE_TTL = 60000; // 1 minute

// ── Load Data from Supabase ───────────────────────────
async function refreshCache() {
  const now = Date.now();
  if (now - lastCacheRefresh < CACHE_TTL) return;

  try {
    // Load auto-responses with their templates
    const { data: arData } = await supabase
      .from('auto_responses')
      .select('*, message_templates(id, name, content, variables)')
      .eq('is_active', true)
      .order('priority');
    autoResponses = arData || [];

    // Load all active templates
    const { data: tplData } = await supabase
      .from('message_templates')
      .select('*')
      .eq('is_active', true);
    templatesList = tplData || [];
    templates = {};
    templatesList.forEach(t => { templates[t.id] = t; });

    // Load business settings
    const { data: bizData } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();
    businessSettings = bizData || {};

    lastCacheRefresh = now;
    console.log(`📦 Cache refreshed: ${autoResponses.length} auto-responses, ${Object.keys(templates).length} templates`);
  } catch (err) {
    console.error('❌ Cache refresh error:', err.message);
  }
}

// ── Find matching auto-response ───────────────────────
function findAutoResponse(messageText) {
  const lower = messageText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const rule of autoResponses) {
    const match = (rule.keywords || []).some(keyword => {
      const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return lower.includes(normalizedKeyword);
    });
    if (match && rule.message_templates) {
      return rule;
    }
  }
  return null;
}

// ── Process template variables ────────────────────────
function processTemplate(content, contactName) {
  return content
    .replace(/\{nombre\}/g, contactName || 'amigo/a')
    .replace(/\{curso\}/g, '')
    .replace(/\{fecha\}/g, new Date().toLocaleDateString('es-EC'));
}

// ── Send WhatsApp Message via Cloud API ───────────────
async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('⚠️  WhatsApp API not configured. Message would be:', text.substring(0, 80));
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const result = await response.json();
    if (result.error) {
      console.error('❌ WhatsApp API error:', result.error.message);
      return false;
    }

    console.log(`✅ Message sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Send error:', err.message);
    return false;
  }
}

// ── Find or create contact in Supabase ────────────────
async function findOrCreateContact(phone, name) {
  // Clean phone number
  const cleanPhone = '+' + phone.replace(/[^0-9]/g, '');

  // Try to find existing contact
  const { data: existing } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', cleanPhone)
    .limit(1)
    .single();

  if (existing) {
    // Update last contact time
    await supabase.from('contacts').update({ 
      last_contact_at: new Date().toISOString() 
    }).eq('id', existing.id);
    return existing;
  }

  // Create new contact
  const { data: newContact } = await supabase
    .from('contacts')
    .insert({
      name: name || `WhatsApp ${cleanPhone}`,
      phone: cleanPhone,
      status: 'nuevo',
      notes: 'Contacto creado automáticamente por chatbot',
      tags: ['chatbot', 'whatsapp'],
      last_contact_at: new Date().toISOString(),
    })
    .select()
    .single();

  console.log(`👤 New contact created: ${cleanPhone}`);
  return newContact;
}

// ── Log conversation to Supabase ──────────────────────
async function logConversation(contactId, message, direction, templateId = null) {
  await supabase.from('conversations').insert({
    contact_id: contactId,
    message_sent: message,
    direction: direction,
    channel: 'whatsapp',
    template_id: templateId,
  });
}

// ── Update auto-response match count ──────────────────
async function incrementMatchCount(ruleId) {
  const { data } = await supabase
    .from('auto_responses')
    .select('match_count')
    .eq('id', ruleId)
    .single();
  
  await supabase
    .from('auto_responses')
    .update({ match_count: (data?.match_count || 0) + 1 })
    .eq('id', ruleId);
}

// ── Update template use count ─────────────────────────
async function incrementTemplateUseCount(templateId) {
  const { data } = await supabase
    .from('message_templates')
    .select('use_count')
    .eq('id', templateId)
    .single();

  await supabase
    .from('message_templates')
    .update({ use_count: (data?.use_count || 0) + 1 })
    .eq('id', templateId);
}

// ═══════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS
// ═══════════════════════════════════════════════════════

// ── Webhook Verification (GET) ────────────────────────
// Meta sends a GET request to verify your webhook URL
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// ── Webhook Messages (POST) ──────────────────────────
// Meta sends incoming messages here
app.post('/webhook', async (req, res) => {
  // Always respond 200 quickly to Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    // Check if this is a WhatsApp message event
    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || {};

          // Only handle text messages
          if (msg.type !== 'text') {
            console.log(`📎 Non-text message from ${msg.from}: ${msg.type}`);
            // Send a generic response for non-text
            await handleNonTextMessage(msg.from, contact.profile?.name);
            continue;
          }

          const messageText = msg.text.body;
          const senderPhone = msg.from;
          const senderName = contact.profile?.name || '';

          console.log(`\n📩 Message from ${senderName} (${senderPhone}): "${messageText}"`);

          // Process the message
          await handleIncomingMessage(senderPhone, senderName, messageText);
        }
      }
    }
  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
  }
});

// ── Handle incoming text message ──────────────────────
async function handleIncomingMessage(phone, name, messageText) {
  // Refresh cache if needed
  await refreshCache();

  // Find or create contact
  const contact = await findOrCreateContact(phone, name);

  // Log incoming message
  if (contact) {
    await logConversation(contact.id, messageText, 'incoming');
  }

  let responseText = '';
  let templateId = null;

  // Try AI first (if configured)
  const aiResult = await chatWithAI(phone, messageText, templatesList, businessSettings);

  if (aiResult.success) {
    responseText = aiResult.response;
    console.log(`🧠 AI response generated for ${phone}`);
  } else {
    // Fallback: Check keyword auto-responses
    const matchedRule = findAutoResponse(messageText);

    if (matchedRule && matchedRule.message_templates) {
      const template = matchedRule.message_templates;
      responseText = processTemplate(template.content, name);
      templateId = template.id;
      console.log(`🤖 Auto-response matched: "${template.name}"`);
      await incrementMatchCount(matchedRule.id);
      await incrementTemplateUseCount(template.id);
    } else {
      // Final fallback - default message
      responseText = businessSettings.welcome_message || 
        '¡Hola! 👋 Bienvenido/a al Centro de Formación Gastronómico Milagro. ' +
        'Un momento por favor, te atenderemos pronto.\n\n' +
        'Mientras tanto, puedes preguntar por:\n' +
        '📚 *Cursos* disponibles\n' +
        '💰 *Precios* y planes de pago\n' +
        '🕐 *Horarios* de clases\n' +
        '📍 *Ubicación*: https://maps.app.goo.gl/VwDULKePHtDUe54JA\n' +
        '📋 *Requisitos* de inscripción';
    }
  }

  // Send the response
  const sent = await sendWhatsAppMessage(phone, responseText);

  if (sent && contact) {
    await logConversation(contact.id, responseText, 'outgoing', templateId);
  }
}

// ── Handle non-text messages ──────────────────────────
async function handleNonTextMessage(phone, name) {
  await refreshCache();
  
  const contact = await findOrCreateContact(phone, name);
  
  const msg = '¡Hola! 👋 Recibimos tu mensaje. Por el momento solo podemos procesar mensajes de texto.\n\n' +
    '¿En qué podemos ayudarte? Puedes escribir:\n' +
    '📚 *Cursos*\n💰 *Precios*\n🕐 *Horarios*\n📍 *Ubicación*: https://maps.app.goo.gl/VwDULKePHtDUe54JA';

  const sent = await sendWhatsAppMessage(phone, msg);
  if (sent && contact) {
    await logConversation(contact.id, msg, 'outgoing');
  }
}

// ═══════════════════════════════════════════════════════
// API ENDPOINTS (for the frontend dashboard)
// ═══════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp_configured: !!(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
    ai_configured: !!process.env.GEMINI_API_KEY,
    supabase_connected: true,
    auto_responses_loaded: autoResponses.length,
    uptime: process.uptime(),
  });
});

// Get chatbot stats
app.get('/api/stats', async (req, res) => {
  await refreshCache();
  
  const { count: totalMessages } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true });

  const { count: todayMessages } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true });

  res.json({
    total_messages: totalMessages || 0,
    today_messages: todayMessages || 0,
    total_contacts: totalContacts || 0,
    auto_responses_active: autoResponses.length,
    whatsapp_configured: !!(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
  });
});

// Test auto-response (keyword only)
app.post('/api/test-message', async (req, res) => {
  await refreshCache();
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const matchedRule = findAutoResponse(message);

  if (matchedRule && matchedRule.message_templates) {
    const responseText = processTemplate(matchedRule.message_templates.content, 'Usuario Test');
    res.json({
      matched: true,
      rule: matchedRule.keywords,
      template: matchedRule.message_templates.name,
      response: responseText,
    });
  } else {
    res.json({
      matched: false,
      response: businessSettings.welcome_message || 'Mensaje de bienvenida por defecto',
    });
  }
});

// AI Chat endpoint (for the simulator)
app.post('/api/chat', async (req, res) => {
  await refreshCache();
  const { message, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const session = sessionId || 'simulator-' + Date.now();

  // Try AI first
  const aiResult = await chatWithAI(session, message, templatesList, businessSettings);

  if (aiResult.success) {
    return res.json({
      response: aiResult.response,
      source: 'ai',
      sessionId: session,
      sessionInfo: getSessionInfo(session),
    });
  }

  // Fallback to keyword matching
  const matchedRule = findAutoResponse(message);

  if (matchedRule && matchedRule.message_templates) {
    const responseText = processTemplate(matchedRule.message_templates.content, 'Cliente');
    return res.json({
      response: responseText,
      source: 'keyword',
      template: matchedRule.message_templates.name,
      sessionId: session,
    });
  }

  // Final fallback
  res.json({
    response: businessSettings.welcome_message ||
      '¡Hola! 👋 Bienvenido/a al Centro de Formación Gastronómico Milagro.\n\n' +
      'Puedes preguntarme por:\n📚 *Cursos*\n💰 *Precios*\n🕐 *Horarios*\n📍 *Ubicación*: https://maps.app.goo.gl/VwDULKePHtDUe54JA\n📋 *Inscripción*',
    source: 'default',
    sessionId: session,
  });
});

// Clear chat session
app.post('/api/chat/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) clearHistory(sessionId);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🍳 GastroConnect - WhatsApp Chatbot Server');
    console.log('  📍 Centro De Formación Gastronómico Milagro');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  🌐 Server:    http://localhost:${PORT}`);
    console.log(`  📡 Webhook:   http://localhost:${PORT}/webhook`);
    console.log(`  ❤️  Health:    http://localhost:${PORT}/api/health`);
    console.log(`  🔑 Verify:    ${VERIFY_TOKEN}`);
    console.log(`  💬 WhatsApp:  ${WHATSAPP_TOKEN ? '✅ Configured' : '⚠️  Not configured'}`);
    console.log(`  🧠 AI (Gemini): ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured'}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // Initial cache load
    await refreshCache();
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️  GEMINI_API_KEY not set. AI chat will use keyword fallback.');
      console.log('   Get a free key at: https://aistudio.google.com/apikey\n');
    }
  });
} else {
  // When imported as a module (e.g. Vercel serverless)
  refreshCache();
}

module.exports = app;
