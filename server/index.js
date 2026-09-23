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

const DEFAULT_PASSWORD = process.env.EDIT_PASSWORD || 'rnf2026';

let store = loadStore();

// Assure la présence de la section sécurité
if (!store) {
  store = {
    projects: [],
    activeProjectId: null,
    security: { editPassword: DEFAULT_PASSWORD }
  };
} else if (!store.security) {
  store.security = { editPassword: DEFAULT_PASSWORD };
  saveStore(store);
}

// Routes API
app.get('/api/info', (req, res) => {
  res.json({
    localIp: getLocalIp(),
    apiPort: process.env.PORT || 3001,
    isProduction: process.env.NODE_ENV === 'production' || !!process.env.RENDER
  });
});

app.get('/api/projects', (req, res) => {
  // Masque le mot de passe dans le retour public
  if (store) {
    const { security, ...safeStore } = store;
    res.json(safeStore);
  } else {
    res.json({ projects: [], activeProjectId: null });
  }
});

// Vérification du mot de passe de modification
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body || {};
  const currentPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
  if (password === currentPassword) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
});

// Changement de mot de passe (nécessite l'ancien mot de passe)
app.post('/api/auth/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const currentPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
  if (oldPassword !== currentPassword) {
    return res.status(401).json({ success: false, message: 'Ancien mot de passe invalide' });
  }
  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit faire au moins 3 caractères' });
  }
  if (!store.security) store.security = {};
  store.security.editPassword = newPassword.trim();
  saveStore(store);
  return res.json({ success: true });
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
    const { security, ...safeStore } = store;
    ws.send(JSON.stringify({
      type: 'INIT_STATE',
      payload: safeStore
    }));
  }

  broadcastPresence();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'SYNC_PROJECTS') {
        const currentPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
        
        // Vérifie si le mot de passe fourni autorise la modification
        if (data.password !== currentPassword) {
          ws.send(JSON.stringify({
            type: 'AUTH_ERROR',
            message: 'Mot de passe requis ou invalide pour modifier le rétroplanning.'
          }));
          return;
        }

        // Sauvegarde avec préservation de la sécurité
        const updatedStore = {
          ...store,
          projects: data.payload.projects,
          activeProjectId: data.payload.activeProjectId
        };
        store = updatedStore;
        saveStore(store);

        const { security, ...safeStore } = store;
        broadcast({
          type: 'STATE_UPDATED',
          payload: safeStore,
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
