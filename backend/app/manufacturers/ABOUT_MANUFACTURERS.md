# 🏭 ABOUT_MANUFACTURERS

Ce dossier regroupe toutes les **entités de production de données** de RAVY :  
les *workers* et les *wakeuppers*.  
Ils représentent la couche d’exécution asynchrone du backend.

---

## Structure

- **`workers/`** : scripts autonomes qui exécutent des traitements séquentiels (factures, regroupements, exports, etc.)  
- **`wakeuppers/`** : orchestrateurs légers qui réveillent les workers quand de nouveaux jobs sont disponibles  
- **`base_worker.py`** : classe commune à tous les workers (gestion du flag `is_running`, pattern `run()`)  
- **`base_wakeupper.py`** : logique commune pour réveiller proprement plusieurs workers  
- **`config.py`** : centralise la configuration et la liste des workers disponibles

---

## Fonctionnement global

1. Un événement (utilisateur ou n8n) crée un job en base (ex : `import_job`, `supplier_merge_suggestion`).
2. L’API (ou n8n) ping le **wakeupper** correspondant.
3. Le wakeupper envoie un signal `/run` à tous les **workers** actifs du domaine.
4. Chaque worker :
   - vérifie s’il est déjà occupé (`is_running`)
   - prend un job libre (`status='pending'`)
   - le traite **séquentiellement**
   - continue jusqu’à vider la file ou si aucune entrée a encore le statut `pending`
   - se met en veille

Ce système est **asynchrone, scalable et déterministe** :
- jamais deux workers sur la même tâche,
- ajout de nouveaux workers sans refonte,
- tolérance naturelle aux pannes.

---

## Philosophie

Les *manufacturers* sont pensés comme les **usines de traitement du système** :  
ils transforment la donnée brute (factures, recettes, fournisseurs)  
en informations exploitables pour les restaurateurs.

Chaque manufacturer agit comme une **unité indépendante de production**.
