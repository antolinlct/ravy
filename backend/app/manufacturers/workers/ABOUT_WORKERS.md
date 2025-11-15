# ⚙️ ABOUT_WORKERS

Les **workers** sont des scripts Python autonomes.  
Ils s’exécutent dans des processus indépendants de FastAPI et travaillent à la demande.

---

## Rôle
- Exécuter des traitements métier longs ou séquentiels (OCR, regroupement, export…)
- Libérer FastAPI de toute charge lourde
- Garantir l’isolation et la stabilité du backend

---

## Fonctionnement

1. Le worker est **dormant** par défaut (`is_running=False`).
2. Lorsqu’il reçoit un ping `/run`, il :
   - vérifie son flag `is_running`,
   - s’il est libre → il se met à `True` et démarre son traitement,
   - s’il est occupé → il ignore le signal.
3. Il parcourt tous les jobs `pending` et les exécute à la queue leu leu.
4. Il se rendort une fois la file vide ou si aucune entrée a encore le statut `pending`

---

## Comportement attendu

- Un worker **ne traite jamais deux jobs en parallèle**.
- Si plusieurs workers sont réveillés, ils répartissent les tâches en fonction des verrous en base (`locked_by`, `establishment_id`, etc.).
- En cas d’erreur, la tâche reste en `pending` pour reprise au prochain cycle.

---

## Extension future

- Ajout d’un `BaseWorker` commun pour gérer les comportements globaux.
- Possibilité d’ajouter un système de log ou d’observabilité centralisé.
