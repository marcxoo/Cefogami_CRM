require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Parse old style env if needed, we'll try pulling from process.env but it might not have the correct file loaded.
const fs = require('fs');
let envData = fs.readFileSync('.env', 'utf8');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envData.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const newCursos = `👨‍🍳 *Cursos y Programas CEFOGAMI*

🔥 *Escuela de Parrilla* (Sábados, 3 meses)
🍹 *Coctelería Profesional* (Miércoles, 3 meses)
🍹🍴 *Coctelería y Piqueos* (Miércoles, 3 meses)
🥖 *Panadería desde Cero* (Miércoles, 3 meses)
🔪 *Gastronomía Profesional* (Lunes y martes, 1 año)

✅ *Incluyen:* Ingredientes y herramientas de práctica
📅 *Inicios:* Mayo 2026

¿De cuál te gustaría saber más detalles, horarios o precios?`;

  const { data, error } = await supabase
    .from('message_templates')
    .update({ content: newCursos })
    .like('name', '%Cursos%')
    .select();
    
  if (error) console.error('Error:', error);
  else console.log('Templates Cursos actualizados:', data.length);
  
  const newRequisitos = `📝 *Requisitos de Inscripción CEFOGAMI*

No necesitas experiencia previa para nuestros cursos. Para inscribirte, solo necesitas traer:

1. Cédula de identidad (original y copia)
2. 2 fotos tamaño carnet
3. Certificado médico
4. Comprobante de pago de matrícula

📍 Te esperamos en nuestra sede en Milagro (calle Andrés Bello e Ibarra esquina, 2.º piso).
¿Te gustaría saber los horarios de algún programa en específico?`;

  const { data: dataReq, error: errorReq } = await supabase
    .from('message_templates')
    .update({ content: newRequisitos })
    .like('name', '%Requisitos%')
    .select();
    
    if (errorReq) console.error('Error Req:', errorReq);
    else console.log('Templates Requisitos actualizados:', dataReq.length);
}
main();
