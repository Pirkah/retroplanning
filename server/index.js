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

// Assure la présence de la section sécurité et du timestamp de modification
if (!store) {
  store = {
    projects: [],
    activeProjectId: null,
    lastModified: new Date().toISOString(),
    security: { editPassword: DEFAULT_PASSWORD, userPasswords: {} }
  };
} else {
  if (!store.lastModified) {
    store.lastModified = new Date().toISOString();
    saveStore(store);
  }
  if (!store.security) {
    store.security = { editPassword: DEFAULT_PASSWORD, userPasswords: {} };
    saveStore(store);
  } else if (!store.security.userPasswords) {
    store.security.userPasswords = {};
    saveStore(store);
  }

  // Initialisation du mot de passe par défaut pour le BDE (bde2026) s'il n'est pas encore défini
  if (!store.security.userPasswords['m-bde']) {
    store.security.userPasswords['m-bde'] = 'bde2026';
    saveStore(store);
  }

  // S'assurer que le compte BDE est présent dans la liste des membres des projets
  if (store.projects && Array.isArray(store.projects)) {
    let modified = false;
    store.projects.forEach((p) => {
      if (p.members && !p.members.some((m) => m.id === 'm-bde')) {
        p.members.push({
          id: 'm-bde',
          name: 'BDE IUT GEA',
          role: 'Bureau Des Étudiants (Consultation)',
          color: '#F59E0B',
          initials: 'BDE',
          generation: 'Partenaires & BDE',
          isBde: true,
          isReadOnly: true
        });
        modified = true;
      }
    });
    if (modified) saveStore(store);
  }
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
    res.json({
      ...safeStore,
      lastModified: store.lastModified || new Date().toISOString()
    });
  } else {
    res.json({ projects: [], activeProjectId: null, lastModified: new Date().toISOString() });
  }
});

// Synchronisation HTTP de sécurité (fallback si WebSocket temporairement déconnecté)
app.post('/api/projects/sync', (req, res) => {
  const { password, memberId, projects, activeProjectId, lastModified } = req.body || {};
  const masterPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
  const hasCustomMemberPassword = Boolean(memberId && store?.security?.userPasswords?.[memberId]);
  const memberPassword = hasCustomMemberPassword ? store.security.userPasswords[memberId] : masterPassword;

  if (password && password !== memberPassword && password !== masterPassword) {
    // Si le conteneur a redémarré sans mot de passe personnalisé mais que le mot de passe client est valide
    if (!hasCustomMemberPassword && memberId && typeof password === 'string' && password.trim().length >= 3) {
      if (!store.security) store.security = {};
      if (!store.security.userPasswords) store.security.userPasswords = {};
      store.security.userPasswords[memberId] = password.trim();
      saveStore(store);
    } else {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect pour la synchronisation' });
    }
  }

  if (Array.isArray(projects) && projects.length > 0) {
    const now = lastModified || new Date().toISOString();
    store = {
      ...store,
      projects,
      activeProjectId: activeProjectId || store.activeProjectId,
      lastModified: now
    };
    saveStore(store);

    const { security, ...safeStore } = store;
    broadcast({
      type: 'STATE_UPDATED',
      payload: {
        ...safeStore,
        lastModified: now
      },
      senderName: 'Sauvegarde Cloud HTTP'
    });

    return res.json({ success: true, lastModified: now });
  }

  return res.status(400).json({ success: false, message: 'Données de projets invalides' });
});

// Vérification du mot de passe de modification (général ou spécifique utilisateur)
app.post('/api/auth/verify', (req, res) => {
  const { password, memberId } = req.body || {};
  const masterPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
  const isBde = memberId === 'm-bde';
  const hasCustomMemberPassword = Boolean(memberId && store?.security?.userPasswords?.[memberId]);
  let memberPassword = hasCustomMemberPassword ? store.security.userPasswords[memberId] : masterPassword;
  if (isBde && !hasCustomMemberPassword) {
    memberPassword = 'bde2026';
  }

  // 1. Si le mot de passe correspond au mot de passe utilisateur, mot de passe BDE par défaut, ou mot de passe maître
  if (
    password === memberPassword ||
    password === masterPassword ||
    (isBde && (password === 'bde2026' || (store?.security?.userPasswords && password === store.security.userPasswords['m-bde'])))
  ) {
    return res.json({ success: true, isReadOnly: isBde, isBde });
  }

  // 2. Si le serveur a redémarré (suite à un push/redeploy où data/planning_store.json a été réinitialisé)
  // et que le membre utilise son mot de passe personnalisé précédemment configuré (>= 3 car) :
  // On restaure automatiquement le mot de passe personnalisé sur le serveur pour ne JAMAIS le perdre !
  if (!hasCustomMemberPassword && memberId && password && typeof password === 'string' && password.trim().length >= 3) {
    if (!store.security) store.security = {};
    if (!store.security.userPasswords) store.security.userPasswords = {};
    store.security.userPasswords[memberId] = password.trim();
    saveStore(store);
    console.log(`[Auth] Mot de passe réhydraté avec succès pour ${memberId} suite à une mise à jour.`);
    return res.json({ success: true, rehydrated: true, isReadOnly: isBde, isBde });
  }

  return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
});

// Changement de mot de passe (par membre ou mot de passe maître)
app.post('/api/auth/change-password', (req, res) => {
  const { oldPassword, newPassword, memberId } = req.body || {};
  const masterPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
  const hasCustomMemberPassword = Boolean(memberId && store?.security?.userPasswords?.[memberId]);
  const defaultMemberPass = (memberId === 'm-bde') ? 'bde2026' : masterPassword;
  const currentPassword = hasCustomMemberPassword ? store.security.userPasswords[memberId] : defaultMemberPass;

  // Vérifie si l'ancien mot de passe est valide (ou si serveur redémarré sans mot de passe custom, autoriser si oldPassword >= 3)
  const isOldValid = (
    oldPassword === currentPassword ||
    oldPassword === masterPassword ||
    oldPassword === defaultMemberPass ||
    (!hasCustomMemberPassword && oldPassword && oldPassword.length >= 3)
  );

  if (!isOldValid) {
    return res.status(401).json({ success: false, message: 'Ancien mot de passe invalide' });
  }
  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit comporter au moins 3 caractères' });
  }

  if (!store.security) store.security = {};
  if (!store.security.userPasswords) store.security.userPasswords = {};

  if (memberId) {
    store.security.userPasswords[memberId] = newPassword.trim();
  } else {
    store.security.editPassword = newPassword.trim();
  }
  saveStore(store);
  console.log(`[Auth] Mot de passe mis à jour pour ${memberId || 'master'}.`);
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
  const users = [];
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.user) {
      users.push(client.user);
    }
  });
  const payload = JSON.stringify({ type: 'PRESENCE', count, users });
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
      payload: {
        ...safeStore,
        lastModified: store.lastModified || new Date().toISOString()
      }
    }));
  }

  broadcastPresence();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'IDENTIFY') {
        ws.user = data.user || null;
        broadcastPresence();
        return;
      }

      if (data.type === 'SYNC_PROJECTS') {
        const masterPassword = store?.security?.editPassword || process.env.EDIT_PASSWORD || 'rnf2026';
        const memberId = data.memberId || (ws.user && ws.user.id);
        const hasCustomMemberPassword = Boolean(memberId && store?.security?.userPasswords?.[memberId]);
        const memberPassword = hasCustomMemberPassword ? store.security.userPasswords[memberId] : masterPassword;
        
        // Vérifie si le mot de passe fourni autorise la modification
        if (data.password !== memberPassword && data.password !== masterPassword) {
          if (!hasCustomMemberPassword && memberId && typeof data.password === 'string' && data.password.trim().length >= 3) {
            if (!store.security) store.security = {};
            if (!store.security.userPasswords) store.security.userPasswords = {};
            store.security.userPasswords[memberId] = data.password.trim();
            saveStore(store);
          } else {
            ws.send(JSON.stringify({
              type: 'AUTH_ERROR',
              message: 'Mot de passe requis ou invalide pour modifier le rétroplanning.'
            }));
            return;
          }
        }

        const now = data.payload.lastModified || new Date().toISOString();

        // Sauvegarde avec préservation de la sécurité et timestamp
        const updatedStore = {
          ...store,
          projects: data.payload.projects,
          activeProjectId: data.payload.activeProjectId,
          lastModified: now
        };
        store = updatedStore;
        saveStore(store);

        const { security, ...safeStore } = store;
        broadcast({
          type: 'STATE_UPDATED',
          payload: {
            ...safeStore,
            lastModified: now
          },
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
  app.use(express.static(DIST_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
