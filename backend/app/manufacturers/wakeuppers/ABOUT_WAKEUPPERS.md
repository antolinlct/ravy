# ⚡ ABOUT_WAKEUPPERS

Les **wakeuppers** sont les orchestrateurs légers qui réveillent les workers.

---

## Rôle
- Coordonner le lancement des traitements en arrière-plan
- Réveiller les workers concernés par type de tâche
- Être déclenchés manuellement ou automatiquement (n8n, API, cron)

---

## Fonctionnement

1. L’API (ou n8n) appelle un endpoint `/wake-up/<domaine>`.
2. Le wakeupper lit la configuration (`config.py`).
3. Il envoie un **ping HTTP** (`GET /run`) à chaque worker concerné.
4. Chaque worker décide s’il doit agir selon son état interne (`is_running`).

---

## Exemple
/wake-up/facture → wakeupper_facture.py
→ worker_facture_a/run
→ worker_facture_b/run


Les wakeuppers ne contiennent **aucune logique métier** :
ils ne font que **réveiller** les workers capables de traiter les tâches.

---

## Philosophie

Un wakeupper agit comme un **chef d’atelier** :
il ne fabrique rien, mais il déclenche la production.
