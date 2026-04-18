import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Database initialization ──────────────────────────────────────────
export async function initializeDatabase() {
  try {
    // Check if tables exist by trying to query them
    const { error: checkError } = await supabase.from('business_settings').select('id').limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Tables not found. Please run the SQL migration in Supabase Dashboard.');
      return false;
    }
    
    // Check if seed data exists
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    if (!categories || categories.length === 0) {
      await seedDatabase();
    }
    
    return true;
  } catch (err) {
    console.error('Database initialization error:', err);
    return false;
  }
}

async function seedDatabase() {
  // Seed categories
  const categoriesData = [
    { name: 'Prospecto', color: '#F59E0B', icon: '🎯', description: 'Persona interesada en los cursos' },
    { name: 'Estudiante Activo', color: '#25D366', icon: '👨‍🍳', description: 'Estudiante actualmente inscrito' },
    { name: 'Egresado', color: '#8B5CF6', icon: '🎓', description: 'Estudiante que ya completó el programa' },
    { name: 'Interesado', color: '#3B82F6', icon: '💡', description: 'Persona que pidió información' },
    { name: 'Empresa', color: '#EC4899', icon: '🏢', description: 'Empresa o institución' },
  ];
  await supabase.from('categories').insert(categoriesData);

  // Seed message templates
  const templatesData = [
    {
      name: 'Saludo de Bienvenida',
      category: 'bienvenida',
      content: '¡Hola {nombre}! 👋\n\nBienvenido/a al *Centro de Formación Gastronómico Milagro* 🍳\n\n¿En qué podemos ayudarte? Estamos aquí para resolver todas tus dudas sobre nuestros programas de formación.',
      variables: ['nombre'],
      icon: '👋',
      is_active: true
    },
    {
      name: 'Horarios de Clases',
      category: 'horarios',
      content: '🕐 *Horarios del Centro Gastronómico Milagro*\n\n📅 *Lunes a Viernes:*\n• Turno Mañana: 8:00 AM - 12:00 PM\n• Turno Tarde: 2:00 PM - 6:00 PM\n\n📅 *Sábados:*\n• 8:00 AM - 1:00 PM\n\n📅 *Domingos:* Cerrado\n\n📍 ¡Te esperamos! Si necesitas más información, escríbenos con confianza.',
      variables: [],
      icon: '🕐',
      is_active: true
    },
    {
      name: 'Precios y Programas',
      category: 'precios',
      content: '💰 *Programas y Precios*\n\nHola {nombre}, estos son nuestros programas disponibles:\n\n👨‍🍳 *Chef Profesional* - Programa completo\n🎂 *Pastelería y Repostería*\n🍞 *Panadería Artesanal*\n🍣 *Cocina Internacional*\n🥗 *Cocina Saludable*\n\nCada programa incluye:\n✅ Materiales de práctica\n✅ Uniforme\n✅ Certificado avalado\n✅ Prácticas en cocina profesional\n\n📞 Para conocer los precios y planes de pago, te invitamos a visitarnos o llamarnos.\n\n¿Cuál programa te interesa?',
      variables: ['nombre'],
      icon: '💰',
      is_active: true
    },
    {
      name: 'Cursos Disponibles',
      category: 'cursos',
      content: '👨‍🍳 *Cursos del Centro Gastronómico Milagro*\n\n🔥 *Programas Regulares:*\n1. Chef Profesional (6 meses)\n2. Pastelería y Repostería (4 meses)\n3. Panadería Artesanal (3 meses)\n4. Cocina Internacional (4 meses)\n\n⚡ *Cursos Cortos:*\n• Cocina Saludable (1 mes)\n• Bartender Profesional (1 mes)\n• Decoración de Tortas (2 semanas)\n\n📅 *Próximas inscripciones abiertas*\n\n¿Te gustaría separar tu cupo? ¡Los espacios son limitados!',
      variables: [],
      icon: '📚',
      is_active: true
    },
    {
      name: 'Ubicación',
      category: 'ubicacion',
      content: '📍 *¿Cómo llegar al Centro Gastronómico Milagro?*\n\n🏫 Estamos ubicados en *Milagro, Ecuador*\n\n🚗 *Referencias:*\n• Punto de referencia cercano al centro de la ciudad\n\n🗺️ Encuéntranos en Google Maps o Facebook:\n👉 facebook.com/gastronomicomilagro\n\n⏰ *Horario de atención:*\nLunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 8:00 AM - 1:00 PM\n\n¡Te esperamos! 🍳',
      variables: [],
      icon: '📍',
      is_active: true
    },
    {
      name: 'Requisitos de Inscripción',
      category: 'inscripcion',
      content: '📋 *Requisitos para Inscripción*\n\nHola {nombre}, para inscribirte necesitas:\n\n📄 *Documentos:*\n1. Cédula de identidad (original y copia)\n2. 2 fotos tamaño carnet\n3. Certificado médico\n4. Comprobante de pago de matrícula\n\n💳 *Formas de pago:*\n• Efectivo\n• Transferencia bancaria\n• Plan de pagos (consultar)\n\n📅 *Proceso:*\n1. Acercarte a nuestras instalaciones\n2. Llenar ficha de inscripción\n3. Entregar documentos\n4. Realizar el pago\n\n¿Necesitas más información? ¡Con gusto te ayudamos! 😊',
      variables: ['nombre'],
      icon: '📋',
      is_active: true
    },
    {
      name: 'Seguimiento',
      category: 'seguimiento',
      content: '¡Hola {nombre}! 😊\n\nTe escribimos del *Centro Gastronómico Milagro* 🍳\n\n¿Pudiste revisar la información sobre nuestros cursos? Queríamos saber si tienes alguna duda adicional o si te gustaría agendar una visita a nuestras instalaciones.\n\n🎯 Recuerda que los cupos son limitados y las inscripciones se están cerrando pronto.\n\n¡Estamos aquí para ayudarte! 💪',
      variables: ['nombre'],
      icon: '🔄',
      is_active: true
    },
    {
      name: 'Agradecimiento por Inscripción',
      category: 'agradecimiento',
      content: '🎉 *¡Felicitaciones {nombre}!*\n\nBienvenido/a oficialmente al *Centro de Formación Gastronómico Milagro* 🍳\n\n✅ Tu inscripción ha sido registrada exitosamente.\n\n📅 *Próximos pasos:*\n1. Inicio de clases: [FECHA]\n2. Revisar kit de materiales\n3. Preparar uniforme\n\n📱 Síguenos en nuestras redes para estar al día:\n👉 facebook.com/gastronomicomilagro\n\n¡Nos vemos en clase! 👨‍🍳',
      variables: ['nombre'],
      icon: '🎉',
      is_active: true
    }
  ];
  await supabase.from('message_templates').insert(templatesData);

  // Seed business settings
  const businessSettings = {
    business_name: 'Centro De Formación Gastronómico Milagro',
    whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || '',
    address: 'Milagro, Ecuador',
    phone: '',
    email: '',
    facebook_url: 'https://www.facebook.com/gastronomicomilagro',
    working_hours: {
      monday: { open: '08:00', close: '18:00', active: true },
      tuesday: { open: '08:00', close: '18:00', active: true },
      wednesday: { open: '08:00', close: '18:00', active: true },
      thursday: { open: '08:00', close: '18:00', active: true },
      friday: { open: '08:00', close: '18:00', active: true },
      saturday: { open: '08:00', close: '13:00', active: true },
      sunday: { open: '', close: '', active: false }
    },
    welcome_message: '¡Hola! 👋 Bienvenido/a al Centro de Formación Gastronómico Milagro. ¿En qué podemos ayudarte?'
  };
  await supabase.from('business_settings').insert(businessSettings);

  // Seed auto-responses
  const autoResponses = [
    { keywords: ['precio', 'costo', 'cuánto', 'cuanto', 'valor', 'inversión'], priority: 1, is_active: true },
    { keywords: ['horario', 'hora', 'cuando', 'abierto', 'atienden'], priority: 2, is_active: true },
    { keywords: ['curso', 'programa', 'carrera', 'estudiar', 'aprender'], priority: 3, is_active: true },
    { keywords: ['dirección', 'direccion', 'ubicación', 'ubicacion', 'donde', 'dónde', 'llegar'], priority: 4, is_active: true },
    { keywords: ['inscripción', 'inscripcion', 'inscribir', 'matricula', 'requisito'], priority: 5, is_active: true },
  ];

  // Get template IDs after insertion
  const { data: templates } = await supabase
    .from('message_templates')
    .select('id, category')
    .order('created_at');

  if (templates) {
    const categoryMap = {};
    templates.forEach(t => { categoryMap[t.category] = t.id; });

    const arWithTemplates = autoResponses.map((ar, i) => {
      const cats = ['precios', 'horarios', 'cursos', 'ubicacion', 'inscripcion'];
      return { ...ar, template_id: categoryMap[cats[i]] || null };
    });
    await supabase.from('auto_responses').insert(arWithTemplates);
  }

  // Add some demo contacts
  const { data: cats } = await supabase.from('categories').select('id, name');
  const catMap = {};
  if (cats) cats.forEach(c => { catMap[c.name] = c.id; });

  const contacts = [
    { name: 'María García', phone: '+593987654321', email: 'maria@email.com', category_id: catMap['Prospecto'], status: 'nuevo', notes: 'Interesada en pastelería', tags: ['pastelería', 'facebook'] },
    { name: 'Carlos Mendoza', phone: '+593912345678', email: 'carlos@email.com', category_id: catMap['Estudiante Activo'], status: 'inscrito', notes: 'Chef Profesional - 3er mes', tags: ['chef', 'turno-mañana'] },
    { name: 'Ana Rodríguez', phone: '+593998877665', category_id: catMap['Interesado'], status: 'en_seguimiento', notes: 'Preguntó por cocina internacional', tags: ['cocina-internacional'] },
    { name: 'Pedro López', phone: '+593911223344', category_id: catMap['Egresado'], status: 'egresado', notes: 'Graduado 2024 - Ahora trabaja en Hotel', tags: ['chef', 'egresado-2024'] },
    { name: 'Laura Suárez', phone: '+593955667788', category_id: catMap['Prospecto'], status: 'nuevo', notes: 'Quiere información de cursos cortos', tags: ['cursos-cortos', 'instagram'] },
  ];
  await supabase.from('contacts').insert(contacts);

  console.log('✅ Database seeded successfully');
}
