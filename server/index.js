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
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Assure que les dossiers data et backups existent
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Chargement des variables d'environnement locales (.env) si présent
function loadLocalEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          const key = k.trim();
          const val = v.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}
loadLocalEnv();

// GitHub Auto-Sync (Sauvegarde Cloud inviolable pour contrer le conteneur éphémère Render)
const GITHUB_REPO = process.env.GITHUB_REPO || 'Pirkah/retroplanning';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
let githubSyncTimeout = null;
let lastGitHubSyncInfo = {
  lastSync: null,
  status: 'idle',
  error: null
};

// Fonction pour synchroniser avec GitHub REST API
async function syncToGitHub(data, forceImmediate = false) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return;

  const doSync = async () => {
    try {
      lastGitHubSyncInfo.status = 'syncing';
      const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/data/planning_store.json`;
      const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Retroplanning-AutoBackup'
      };

      // 1. Récupérer le SHA actuel du fichier sur GitHub
      let currentSha = null;
      try {
        const getRes = await fetch(fileUrl, { headers });
        if (getRes.ok) {
          const fileData = await getRes.json();
          currentSha = fileData.sha;
        }
      } catch (err) {
        console.warn('[GitHub Sync] Impossible de récupérer le SHA actuel:', err.message);
      }

      // 2. Encoder le contenu en Base64 UTF-8
      const jsonStr = JSON.stringify(data, null, 2);
      const contentBase64 = Buffer.from(jsonStr, 'utf-8').toString('base64');

      const body = {
        message: `chore(backup): sauvegarde automatique des tâches (${new Date().toLocaleString('fr-FR')}) [skip ci]`,
        content: contentBase64,
        branch: 'main'
      };
      if (currentSha) {
        body.sha = currentSha;
      }

      const putRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        lastGitHubSyncInfo.lastSync = new Date().toISOString();
        lastGitHubSyncInfo.status = 'success';
        lastGitHubSyncInfo.error = null;
        console.log(`[GitHub Sync] ✅ Sauvegarde Cloud GitHub réussie à ${lastGitHubSyncInfo.lastSync}`);
      } else {
        const errText = await putRes.text();
        lastGitHubSyncInfo.status = 'error';
        lastGitHubSyncInfo.error = errText;
        console.error('[GitHub Sync] ❌ Erreur commit GitHub:', putRes.status, errText);
      }
    } catch (err) {
      lastGitHubSyncInfo.status = 'error';
      lastGitHubSyncInfo.error = err.message;
      console.error('[GitHub Sync] ❌ Erreur réseau commit GitHub:', err.message);
    }
  };

  if (forceImmediate) {
    if (githubSyncTimeout) clearTimeout(githubSyncTimeout);
    await doSync();
  } else {
    // Debounce de 15 secondes pour grouper les modifications rapides
    if (githubSyncTimeout) clearTimeout(githubSyncTimeout);
    githubSyncTimeout = setTimeout(doSync, 15000);
  }
}

// Nettoyage des anciennes sauvegardes locales pour conserver les 50 plus récentes
function cleanupOldBackups(maxKeep = 50) {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('planning_store_') && f.endsWith('.json'))
      .map(f => {
        const fp = path.join(BACKUPS_DIR, f);
        return { name: f, path: fp, time: fs.statSync(fp).mtime.getTime() };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > maxKeep) {
      files.slice(maxKeep).forEach(f => {
        try { fs.unlinkSync(f.path); } catch {}
      });
    }
  } catch (err) {
    console.warn('[Backups] Erreur nettoyage backups:', err);
  }
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

// Sauvegarde du store avec triple sécurité (Disque local, Snapshot horodaté, GitHub Cloud)
function saveStore(data, skipGitHub = false) {
  try {
    const content = JSON.stringify(data, null, 2);
    // 1. Sauvegarde principale sur disque
    fs.writeFileSync(DATA_FILE, content, 'utf-8');

    // 2. Sauvegarde horodatée dans backups/
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUPS_DIR, `planning_store_${timestamp}.json`);
    fs.writeFileSync(backupPath, content, 'utf-8');
    cleanupOldBackups(50);

    // 3. Sauvegarde Cloud GitHub automatique
    if (!skipGitHub) {
      syncToGitHub(data);
    }
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

// --- ROUTES DE SAUVEGARDE & SÉCURITÉ ---

// 1. Liste des sauvegardes disponibles
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('planning_store_') && f.endsWith('.json'))
      .map(f => {
        const fp = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fp);
        let taskCount = 0;
        let eventCount = 0;
        try {
          const content = JSON.parse(fs.readFileSync(fp, 'utf-8'));
          if (content.projects && Array.isArray(content.projects)) {
            taskCount = content.projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
            eventCount = content.projects.reduce((acc, p) => acc + (p.events?.length || 0), 0);
          }
        } catch {}

        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          taskCount,
          eventCount
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      backups: files,
      githubSync: lastGitHubSyncInfo,
      currentProjectsCount: store?.projects?.length || 0,
      currentLastModified: store?.lastModified || null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Téléchargement direct du fichier de sauvegarde JSON complet
app.get('/api/backup/download', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).send('Aucune donnée trouvée');
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="retroplanning_sauvegarde_${dateStr}.json"`);
    res.setHeader('Content-Type', 'application/json');
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    res.send(content);
  } catch (err) {
    res.status(500).send('Erreur téléchargement: ' + err.message);
  }
});

// 3. Forcer la synchronisation Cloud GitHub
app.post('/api/backup/sync-github', async (req, res) => {
  try {
    await syncToGitHub(store, true);
    res.json({ success: true, githubSync: lastGitHubSyncInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Restauration d'une sauvegarde (depuis un fichier disque ou un payload JSON)
app.post('/api/backups/restore', (req, res) => {
  const { filename, backupData } = req.body || {};
  let targetData = null;

  if (filename) {
    const targetPath = path.join(BACKUPS_DIR, path.basename(filename));
    if (fs.existsSync(targetPath)) {
      try {
        targetData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Fichier de sauvegarde invalide' });
      }
    } else {
      return res.status(404).json({ success: false, message: 'Sauvegarde introuvable' });
    }
  } else if (backupData && typeof backupData === 'object') {
    targetData = backupData;
  }

  if (!targetData || !Array.isArray(targetData.projects)) {
    return res.status(400).json({ success: false, message: 'Données de restauration invalides' });
  }

  // Sauvegarde de sécurité préalable de l'état actuel
  if (store) {
    const preRestorePath = path.join(BACKUPS_DIR, `planning_store_pre_restore_${Date.now()}.json`);
    fs.writeFileSync(preRestorePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  const now = new Date().toISOString();
  store = {
    ...targetData,
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
    senderName: 'Restauration de Sauvegarde'
  });

  return res.json({ success: true, message: 'Sauvegarde restaurée avec succès', lastModified: now });
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
