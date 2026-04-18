# 🤖 Configuración del Chatbot WhatsApp - GastroConnect

## Paso 1: Crear App en Meta for Developers

1. Ve a **https://developers.facebook.com**
2. Inicia sesión con la cuenta de Facebook que administra la página del Centro Gastronómico
3. Clic en **"Mis apps"** → **"Crear app"**
4. Selecciona **"Otro"** → **"Empresa"**
5. Nombre: `GastroConnect Chatbot`
6. Clic en **Crear app**

## Paso 2: Agregar WhatsApp a tu App

1. En tu app, ve a **"Agregar productos"**
2. Busca **"WhatsApp"** y clic en **"Configurar"**
3. Selecciona o crea una **Meta Business Account**
4. Te dará un **número de prueba** gratuito para testear

## Paso 3: Obtener las credenciales

En la sección **WhatsApp > Configuración de la API**:

1. **Temporary Access Token**: Cópialo (dura 24h, luego necesitas uno permanente)
2. **Phone number ID**: Es el ID del número de WhatsApp (no es el teléfono, es un ID numérico)
3. **WhatsApp Business Account ID**: Also visible en la misma página

## Paso 4: Configurar el .env

Agrega estas variables al archivo `.env`:

```
WHATSAPP_TOKEN=tu_access_token_aqui
WHATSAPP_PHONE_ID=tu_phone_number_id_aqui
VERIFY_TOKEN=gastroconnect_verify_2024
```

## Paso 5: Exponer el servidor con ngrok (para testing)

Tu servidor local necesita ser accesible desde internet para que Meta envíe mensajes:

```bash
# Instalar ngrok (si no lo tienes)
brew install ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Esto te dará una URL como: `https://abc123.ngrok.io`

## Paso 6: Configurar el Webhook en Meta

1. En tu app de Meta, ve a **WhatsApp > Configuración**
2. En la sección **Webhook**, clic en **"Editar"**
3. **URL del webhook**: `https://tu-url-ngrok.ngrok.io/webhook`
4. **Token de verificación**: `gastroconnect_verify_2024` (el mismo del .env)
5. Clic en **"Verificar y guardar"**
6. Suscríbete al campo **"messages"**

## Paso 7: Registrar tu número real (Producción)

Para usar tu número real de WhatsApp Business:

1. En **WhatsApp > Números de teléfono**, clic en **"Agregar número de teléfono"**
2. Ingresa tu número de WhatsApp Business
3. Verifica con código SMS o llamada
4. Una vez verificado, actualiza WHATSAPP_PHONE_ID en .env

> ⚠️ **IMPORTANTE**: Cuando registras tu número en la API, sigues pudiendo ver los mensajes en tu app de WhatsApp Business.

## Paso 8: Token Permanente

El token temporal dura 24 horas. Para producción:

1. Ve a **Configuración del negocio** → **Usuarios del sistema**
2. Crea un usuario del sistema
3. Genera un token permanente con permisos de `whatsapp_business_messaging`
4. Actualiza WHATSAPP_TOKEN en .env

## Comandos para ejecutar

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Chatbot Server
npm run chatbot
```

## Probar el chatbot

Una vez configurado:

1. Envía un mensaje de WhatsApp al número configurado
2. El chatbot responderá automáticamente basándose en las palabras clave
3. Los mensajes se registran en el Dashboard (sección Mensajes)
4. Los contactos nuevos se crean automáticamente

### Prueba local (sin WhatsApp):

```bash
# Probar auto-respuesta
curl -X POST http://localhost:3000/api/test-message \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuáles son los precios?"}'

# Ver estado del chatbot
curl http://localhost:3000/api/health
```
