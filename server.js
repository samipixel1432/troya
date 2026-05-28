const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4174);
const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || '';
const apiEndpoint = process.env.AI_API_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
const apiModel = process.env.AI_MODEL || 'openai/gpt-5-mini';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Body demasiado grande.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function lastUserMessage(messages) {
  const last = [...messages].reverse().find(message => message && message.role === 'user');
  return last && typeof last.content === 'string' ? last.content.trim() : '';
}

function localAssistantResponse(question) {
  const text = question.toLowerCase();

  if (!question) {
    return 'Estoy listo para ayudarte. Preguntame sobre TROYA, domicilios, ideas de negocio, tecnologia, estudio o cualquier tema que necesites organizar.';
  }

  if (text.includes('promocionar') || text.includes('marketing') || text.includes('publicidad')) {
    return 'Una idea rapida: crea un codigo de referido por barrio o universidad, ofrece un beneficio por compartirlo y publica historias con pedidos reales, tiempo de entrega y recompensa obtenida. Eso muestra utilidad, confianza y beneficio inmediato.';
  }

  if (text.includes('troya') || text.includes('domicilio') || text.includes('domicilios')) {
    return 'TROYA es una app de domicilios y beneficios pensada para conectar usuarios, negocios y repartidores en Cali con pedidos rapidos, seguros y recompensas para la comunidad.';
  }

  if (text.includes('idea') || text.includes('negocio') || text.includes('emprend')) {
    return 'Te propongo empezar con algo simple: define el problema, el cliente exacto, la promesa en una frase, el canal para conseguir los primeros usuarios y una metrica diaria. Si me dices el sector, te armo una estrategia mas concreta.';
  }

  if (text.includes('explica') || text.includes('que es') || text.includes('qué es')) {
    return 'Te lo explico de forma sencilla: divide el tema en definicion, ejemplo y uso practico. Si me escribes el concepto exacto, te doy una explicacion corta, una analogia y un ejemplo aplicado.';
  }

  if (text.includes('actual') || text.includes('noticia') || text.includes('hoy') || text.includes('precio')) {
    return 'Para datos de actualidad necesito que el servidor tenga una API real configurada, porque no debo inventar noticias o precios. Aun asi puedo ayudarte a redactar la busqueda correcta, comparar opciones o convertir la informacion que tengas en un resumen.';
  }

  return 'Puedo ayudarte a avanzar con eso. Mi recomendacion inicial es separar la pregunta en objetivo, contexto y resultado esperado. Dame un poco mas de detalle y te respondo con pasos concretos, ejemplos y una solucion aplicable.';
}

function localChatResponse(messages) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: localAssistantResponse(lastUserMessage(messages)),
        },
      },
    ],
    localFallback: true,
  };
}

async function handleChat(req, res) {
  try {
    const body = JSON.parse(await readBody(req));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-13) : [];

    if (!messages.length) {
      sendJson(res, 400, { error: 'Faltan mensajes.' });
      return;
    }

    if (!apiKey) {
      sendJson(res, 200, localChatResponse(messages));
      return;
    }

    const upstream = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'TROYA Chatbox',
      },
      body: JSON.stringify({
        model: apiModel,
        messages,
        temperature: 0.7,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      sendJson(res, upstream.status, {
        error: data.error && data.error.message ? data.error.message : 'La API no respondio correctamente.',
      });
      return;
    }

    sendJson(res, 200, data);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Error del servidor.' });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChat(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(port, () => {
  console.log(`TROYA listo en http://127.0.0.1:${port}/troya.html`);
});
