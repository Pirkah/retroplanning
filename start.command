#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   Lancement du Rétroplanning Collaboratif Temps Réel    "
echo "=========================================================="

# Ouvre le navigateur sur http://localhost:5173 après un court délai
(sleep 2 && open "http://localhost:5173") &

# Démarre le serveur WebSocket et le client Vite accessible sur le réseau (--host)
npm run dev
