// Vercel serverless function — /api/chat
// Forwards messages to an LLM API (OpenRouter by default).
// Falls back to local KB responses when no API key is configured.

const KB = [
  {
    keys: ['qué es troya','que es troya','troya app','sobre troya','info de troya'],
    ans: 'TROYA es una app de domicilios en Cali, Colombia 🛵\n\nTagline: "DOMICILIOS QUE TE DAN MÁS". Conectamos personas, negocios y repartidores con tecnología eficiente y te recompensamos por ayudar a crecer la comunidad.\n\n✅ Entregas rápidas y seguras\n✅ Descuentos y beneficios exclusivos\n✅ Sistema de publicidad sin requisitos de seguidores'
  },
  {
    keys: ['cómo funciona','como funciona','cómo se usa','como se usa','pasos','hacer un pedido','pedir'],
    ans: 'Usar TROYA es muy fácil:\n1️⃣ Descarga gratis en Google Play o App Store\n2️⃣ Crea tu cuenta\n3️⃣ Elige lo que necesitas: comida, supermercado, farmacia…\n4️⃣ Un repartidor lo lleva rápido y seguro\n5️⃣ ¡Gana beneficios y descuentos!'
  },
  {
    keys: ['servicios','qué ofrecen','que ofrecen','categorías','categorias','qué puedo pedir','que puedo pedir'],
    ans: 'Servicios TROYA 📦\n🍔 Comida\n🛒 Supermercado\n💊 Farmacia\n📦 Paquetes y documentos\n✨ Lo que necesites\n\nTodo rápido, seguro y con beneficios.'
  },
  {
    keys: ['beneficios','descuentos','recompensas','ganancias','ganar','qué gano','ventajas'],
    ans: '¡Con TROYA ganas más! 🎁\n💸 Descuentos exclusivos para usuarios\n🎉 Promociones según tus pedidos\n📣 Gana compartiendo TROYA sin ser influencer\n\nNuestro modelo es único: cualquier persona puede ganar beneficios ayudando a crecer la comunidad.'
  },
  {
    keys: ['descargar','descarga','instalar','google play','app store','cómo descargo','como descargo'],
    ans: 'Descargar TROYA es gratis 📲\n▶️ Google Play: busca "TROYA App"\n🍎 App Store: busca "TROYA App"\n\nGratis, sin costo de registro.'
  },
  {
    keys: ['repartidor','domiciliario','trabajar','trabajo','empleo','ser repartidor','quiero repartir'],
    ans: 'Únete como repartidor TROYA 🏍️\n✅ Horarios flexibles\n✅ Pago por entrega\n✅ Soporte de la plataforma\n\n📞 +57 300 123 4567\n📧 hola@troyaapp.com'
  },
  {
    keys: ['negocio','restaurante','tienda','comercio','aliado','registrar negocio','mi negocio'],
    ans: 'Registra tu negocio en TROYA 🏪\n✅ Mayor visibilidad en Cali\n✅ Nuevos clientes digitales\n✅ Sin inversión publicitaria propia\n\n📞 +57 300 123 4567\n📧 hola@troyaapp.com'
  },
  {
    keys: ['publicidad','promocionar','referido','compartir','sin ser influencer','ganar sin seguidores'],
    ans: 'Sistema de publicidad TROYA 📣\n1️⃣ Descarga y usa la app\n2️⃣ Comparte con amigos o en redes\n3️⃣ Gana beneficios por cada nuevo usuario\n\nSin barreras. Sin requisito de seguidores. ¡Cualquiera puede participar!'
  },
  {
    keys: ['contacto','teléfono','telefono','email','correo','redes sociales','instagram','dónde los encuentro'],
    ans: '📬 Contacto TROYA\n📞 +57 300 123 4567\n📧 hola@troyaapp.com\n🌐 www.troyaapp.com\n📱 @troya.app\n📍 Cali, Colombia'
  },
  {
    keys: ['precio','costo','cuánto cuesta','cuanto cuesta','gratis','tarifa','cuánto vale'],
    ans: 'TROYA es gratis de descargar 🆓\nSolo pagas el domicilio. Sin mensualidades ni cuotas. ¡Y puedes ganar descuentos que lo hacen aún más económico!'
  },
  {
    keys: ['dónde operan','donde operan','ciudades','cobertura','cali','zonas'],
    ans: 'Operamos en Cali, Colombia 📍\nEstamos creciendo para cubrir más zonas y próximamente más ciudades. Visión: ser la app de domicilios más reconocida de Colombia.'
  },
  {
    keys: ['misión','mision','visión','vision','propósito','quiénes son','quienes son'],
    ans: 'TROYA 🎯\n\n🚀 MISIÓN: Domicilios rápidos, seguros y confiables, conectando usuarios, comercios y repartidores, con publicidad inclusiva donde cualquier persona gana beneficios.\n\n🏆 VISIÓN: App de domicilios más reconocida e innovadora de Colombia.\n\n💡 Pilares: Rapidez · Tecnología · Beneficios para todos'
  },
  {
    keys: ['hola','buenos días','buenas','hi','hey','saludos','buen día'],
    ans: '¡Hola! 👋 Soy el asistente de TROYA.\nPuedo ayudarte con info sobre la app, servicios, beneficios, ser repartidor o unir tu negocio. ¿Qué necesitas?'
  },
  {
    keys: ['gracias','muchas gracias','listo','perfecto','excelente','ok gracias'],
    ans: '¡Con gusto! 😊 Para eso estamos. Recuerda descargar TROYA en Google Play o App Store. ¡Hasta pronto! 🛵🧡'
  }
];

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function localAnswer(question) {
  const text = normalize(question || '');
  if (!text) return '¡Hola! ¿En qué puedo ayudarte sobre TROYA?';

  for (const entry of KB) {
    for (const key of entry.keys) {
      if (text.includes(normalize(key))) return entry.ans;
    }
  }

  if (/(troya|app|domicilio|entrega|pedido)/.test(text))
    return 'TROYA — domicilios rápidos con beneficios para todos en Cali 🛵\nPregúntame sobre servicios, beneficios, descarga, repartidores o contacto.';
  if (/(precio|costo|cuesta|gratis)/.test(text))
    return 'La app TROYA es gratis 🆓. Solo pagas el domicilio.';
  if (/(repartidor|trabajo|empleo|ganar plata)/.test(text))
    return 'Para unirte como repartidor: 📞 +57 300 123 4567 | 📧 hola@troyaapp.com';
  if (/(negocio|restaurante|tienda|comercio)/.test(text))
    return 'Registra tu negocio: 📧 hola@troyaapp.com | 📞 +57 300 123 4567';
  if (/(contac|telefon|email|correo|instagram|redes)/.test(text))
    return '📞 +57 300 123 4567 | 📧 hola@troyaapp.com | 📱 @troya.app | 🌐 www.troyaapp.com';

  return '¡Buena pregunta! Puedo responder sobre TROYA:\n• Servicios y cómo pedir\n• Cómo ganar beneficios\n• Ser repartidor o registrar tu negocio\n• Contacto\n\n¿Qué quieres saber?';
}

function localResponse(messages) {
  const last = [...(messages || [])].reverse().find(m => m?.role === 'user');
  const question = last?.content || '';
  return {
    choices: [{ message: { role: 'assistant', content: localAnswer(question) } }],
    localFallback: true
  };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido.' }); return; }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    res.status(400).json({ error: 'Faltan mensajes.' });
    return;
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const endpoint = process.env.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
  const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';

  // Sin API key → respuesta local
  if (!apiKey) {
    res.status(200).json(localResponse(messages));
    return;
  }

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://troyaapp.com',
        'X-Title': 'TROYA Chatbox'
      },
      body: JSON.stringify({ model, messages: messages.slice(-13), temperature: 0.7 })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      // Si falla la API, usa respuesta local en vez de error
      res.status(200).json(localResponse(messages));
      return;
    }

    res.status(200).json(data);
  } catch {
    res.status(200).json(localResponse(messages));
  }
}
