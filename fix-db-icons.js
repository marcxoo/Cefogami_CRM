require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const iconMap = {
  '🎯': '<iconify-icon icon="ci:target" style="vertical-align: sub;"></iconify-icon>',
  '👨‍🍳': '<iconify-icon icon="ci:user" style="vertical-align: sub;"></iconify-icon>',
  '🎓': '<iconify-icon icon="ci:book-open" style="vertical-align: sub;"></iconify-icon>',
  '💡': '<iconify-icon icon="ci:bulb" style="vertical-align: sub;"></iconify-icon>',
  '🏢': '<iconify-icon icon="ci:building" style="vertical-align: sub;"></iconify-icon>',
  '👋': '<iconify-icon icon="ci:user-voice" style="vertical-align: sub;"></iconify-icon>',
  '🕐': '<iconify-icon icon="ci:clock" style="vertical-align: sub;"></iconify-icon>',
  '💰': '<iconify-icon icon="ci:credit-card" style="vertical-align: sub;"></iconify-icon>',
  '📚': '<iconify-icon icon="ci:book-open" style="vertical-align: sub;"></iconify-icon>',
  '📍': '<iconify-icon icon="ci:location" style="vertical-align: sub;"></iconify-icon>',
  '📋': '<iconify-icon icon="ci:list-check" style="vertical-align: sub;"></iconify-icon>',
  '🔄': '<iconify-icon icon="ci:redo" style="vertical-align: sub;"></iconify-icon>',
  '🎉': '<iconify-icon icon="ci:gift" style="vertical-align: sub;"></iconify-icon>',
  '👤': '<iconify-icon icon="ci:user" style="vertical-align: sub;"></iconify-icon>',
  '💬': '<iconify-icon icon="ci:chat" style="vertical-align: sub;"></iconify-icon>',
  '📝': '<iconify-icon icon="ci:edit" style="vertical-align: sub;"></iconify-icon>'
};

async function main() {
  const { data: cats } = await supabase.from('categories').select('id, icon');
  if (cats) {
    for (const c of cats) {
      if (iconMap[c.icon]) {
        await supabase.from('categories').update({ icon: iconMap[c.icon] }).eq('id', c.id);
      }
    }
    console.log('Categories updated!');
  }

  const { data: tpls } = await supabase.from('message_templates').select('id, icon');
  if (tpls) {
    for (const t of tpls) {
      if (iconMap[t.icon]) {
        await supabase.from('message_templates').update({ icon: iconMap[t.icon] }).eq('id', t.id);
      }
    }
    console.log('Templates updated!');
  }
  
  console.log('Done mapping emojis to coolicons in DB.');
}
main();
