import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'planning_store.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Assure que le dossier data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fonction pour récupérer l'IP locale (pour réseau local)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Chargement du store
function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Erreur lecture store JSON:', e);
    }
  }
  return null;
}

// Sauvegarde du store
function saveStore(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erreur écriture store JSON:', e);
  }
}

let store = loadStore();

// Routes API
app.get('/api/info', (req, res) => {
  res.json({
    localIp: getLocalIp(),
    apiPort: process.env.PORT || 3001,
    isProduction: process.env.NODE_ENV === 'production' || !!process.env.RENDER
  });
});

app.get('/api/projects', (req, res) => {
  res.json(store || { projects: [], activeProjectId: null });
});

// Diffusion WebSocket
function broadcast(message, senderSocket = null) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderSocket) {
      client.send(payload);
    }
  });
}

function broadcastPresence() {
  const count = wss.clients.size;
  const payload = JSON.stringify({ type: 'PRESENCE', count });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log(`[WS] Collaborateur connecté. Total en ligne: ${wss.clients.size}`);

  if (store) {
    ws.send(JSON.stringify({
      type: 'INIT_STATE',
      payload: store
    }));
  }

  broadcastPresence();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'SYNC_PROJECTS') {
        store = data.payload;
        saveStore(store);

        broadcast({
          type: 'STATE_UPDATED',
          payload: store,
          senderName: data.senderName || 'Un collaborateur'
        }, ws);
      }
    } catch (err) {
      console.error('[WS] Erreur traitement message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Collaborateur déconnecté. Total en ligne: ${wss.clients.size}`);
    broadcastPresence();
  });
});

// En production (notamment sur Render), servir les fichiers statiques construits du frontend React
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`
=====================================================
🚀 Serveur Collaboratif Rétroplanning Actif
📡 Port: ${PORT}
📡 WebSocket: /ws
🌐 Accès local: http://${localIp}:${PORT}
=====================================================
  `);
});
