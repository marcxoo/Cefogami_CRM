require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  const newCursos = `👨‍🍳 *Cursos y Programas CEFOGAMI*

🔥 *Escuela de Parrilla* (3 meses) - Sábados
🍹 *Coctelería Profesional* (3 meses) - Miércoles
🍹🍴 *Coctelería y Piqueos* (3 meses) - Miércoles
🥖 *Panadería desde Cero* (3 meses) - Miércoles
🔪 *Gastronomía Profesional* (1 año) - Lunes y martes

✅ *Incluyen:* Ingredientes y herramientas de práctica
📅 *Inicios:* Mayo 2026

¿De cuál te gustaría saber más detalles, horarios o precios?`;

  const { data, error } = await supabase
    .from('message_templates')
    .update({ content: newCursos })
    .like('name', '%Cursos%')
    .select();
    
  if (error) console.error('Error:', error);
  else console.log('Templates actualizados:', data.length);
}
main();
