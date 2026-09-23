# 📅 Rétroplanning Collaboratif & Diagramme de Gantt par Semaines

Application web complète de rétroplanning prévisionnel collaboratif en temps réel, optimisée pour le travail en équipe à distance et au bureau.

---

## 🌟 Points Forts

- **Diagramme de Gantt par Semaines (S1 à S52)** : Chaque tâche dispose de **sa propre ligne dédiée en hauteur** (cascade chronologique claire et nette).
- **Collaboration Temps Réel (Multi-utilisateurs)** : Tout le monde peut modifier le planning en direct via WebSocket ; les changements se répercutent instantanément sur les écrans de tous les collaborateurs connectés sans recharger.
- **Filtres par Collaborateur** : Isolez instantanément les tâches d'un équipier (Julien, Thomas, Camille, Alice, Marc...) d'un simple clic.
- **Prêt pour le Cloud Gratuit (Render)** : Le backend Node.js sert à la fois l'application React et le serveur WebSocket sur un seul port, 100% compatible avec l'hébergement gratuit de Render.

---

## 🌐 Déploiement Gratuit sur Render (Pour travailler depuis chez vous)

Vous pouvez héberger l'application gratuitement en 2 minutes sur [render.com](https://render.com) :

### Méthode Directe (Recommandée) :
1. Connectez-vous sur votre compte gratuit [render.com](https://render.com).
2. Cliquez sur le bouton **New +** en haut à droite, puis sélectionnez **Web Service**.
3. Choisissez votre dépôt GitHub (`bot-notion-rnf`).
4. Renseignez les paramètres suivants :
   - **Name** : `retroplanning-equipe` *(ou le nom de votre choix)*
   - **Root Directory** : `test/retroplanning`
   - **Runtime** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Plan** : `Free` (0€ / mois)
5. Cliquez sur **Deploy Web Service** !

> 🎉 Render va créer une URL publique sécurisée (ex: `https://retroplanning-equipe.onrender.com`).
> Envoyez simplement cette URL à tous vos collègues : ils pourront l'ouvrir de chez eux et modifier le rétroplanning en direct !

---

## 💻 Utilisation Locale

### Sur Mac :
Double-cliquez sur `start.command` dans le dossier. Il lance l'application et ouvre votre navigateur.

### En Ligne de Commande :
```bash
npm run dev
```
- Accès local : `http://localhost:5173`
- Accès réseau local : `http://<VOTRE_IP_LOCALE>:5173`
