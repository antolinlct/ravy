# 📦 Guide des "manufacturers" (wakeuppers + workers)

Ce document résume le fonctionnement concret du dossier `backend/app/manufacturers/`.
Il détaille le rôle des wakeuppers, la manière dont les workers traitent les jobs
(import de factures aujourd'hui), la répartition des ports internes et la marche à
suivre pour ajouter un nouveau worker.

## 1) Vue d'ensemble

- **Wakeupper** : petit orchestrateur qui envoie un `GET /run` aux workers ciblés.
- **Worker** : service FastAPI minimal qui exécute des jobs séquentiels et se rendort
  lorsqu'il n'y a plus de travail.
- **Configuration** : centralisée dans `config.py` (ports, URLs, liste des workers,
  clé interne et IP autorisées).

Pour l'import de factures :
- Le wakeupper `InvoiceWakeupper` réveille tous les workers d'import listés dans
  `WORKERS["import"]`.
- Chaque worker s'appuie sur `ImportInvoicesWorker` (défini dans `base_worker.py`).
- Les deux instances livrées sont `worker_import_001` (port 9001) et
  `worker_import_002` (port 9002).

## 2) Sécurité et réseau

- Les workers écoutent **uniquement en local** (`127.0.0.1`) sur des ports internes.
- La plage réservée est `9000-9199` (`PORT_RANGE` dans `config.py`).
- Chaque appel `/run` doit fournir l'en-tête `X-RAVY-KEY` égal à `MANUFACTURERS_KEY`;
  sinon la requête est rejetée avec un `403` (voir `build_import_worker_app`).
- Une liste blanche d'IP (`ALLOWED_IPS`) bloque les appels distants : par défaut
  `127.0.0.1` et `localhost`.

## 3) Cycle de vie d'un réveil

1. L'API (ou un scenario n8n) appelle le wakeupper concerné.
2. Le wakeupper envoie `/run` à chaque URL déclarée dans `WORKERS["import"]`.
3. Côté worker :
   - Vérification `is_running` : si le worker est déjà occupé, le réveil est ignoré.
   - Boucle de traitement :
     1. On récupère les établissements déjà en cours (`status='running'`) via
        `list_running_establishment_ids`.
     2. `claim_next_pending_import_job` parcourt les jobs `pending` (triés par date
        de facture) et tente d'en réserver un en base (`status` passe de
        `pending` à `running` en un seul update conditionnel).
     3. Si l'établissement du job est déjà en cours chez un autre worker, il est
        **sauté** pour éviter les doublons.
     4. Le job retenu est exécuté par `import_invoice_from_import_job`, puis le statut
        est mis à `completed` (ou `error` en cas d'exception).
   - Quand aucun job n'est réservable, le worker envoie "Jobs done" et se rendort.

## 4) Logs & notifications Telegram

- Chaque message affiche uniquement les **3 derniers caractères** de l'identifiant
  du worker (ex. `→ [001] started:<id>`), pour des SMS/notifications plus lisibles.
- Les messages clés :
  - réveil (`Awake`),
  - début de job (`started`),
  - fin de job (`finished`) ou saut (`job without valid id skipped`),
  - arrêt faute de travail (`Jobs done`).
- En absence de Telegram, un fallback `print` est utilisé.

## 5) Ajout d'un nouveau worker d'import

1. **Choisir un port libre** dans la plage `9000-9199` (ex. `9003`).
2. **Déclarer le worker** dans `WORKERS["import"]` de `config.py` :
   ```python
   {
       "id": "worker_import_003",
       "url": "http://127.0.0.1:9003",
       "port": 9003,
       "description": "Troisième worker d'import pour répartir la charge.",
   }
   ```
3. **Créer le fichier worker** dans `workers/` en réutilisant le builder commun :
   ```python
   # app/manufacturers/workers/worker_import_003.py
   from app.manufacturers.base_worker import build_import_worker_app

   app, worker = build_import_worker_app("003")
   ```
4. **Démarrer le service** (ex. via Uvicorn ou Supervisor) sur le port choisi :
   `uvicorn app.manufacturers.workers.worker_import_003:app --port 9003`.
5. **Wakeupper** : aucune modification n'est requise, `InvoiceWakeupper` lit la
   configuration et réveillera automatiquement ce nouveau worker.

## 6) Règles de concurrence entre workers

- Deux workers **ne traitent jamais le même job** grâce au `update ... where status = 'pending'`.
- Deux workers **ne traitent jamais le même établissement en parallèle** :
  la liste des établissements déjà en `running` est exclue avant chaque prise de job.
- Le traitement est **séquentiel** dans un worker : un seul job actif par process.

## 7) Structure des fichiers

- `base_worker.py` : cœur métier des workers d'import (prise de job, exécution,
  notifications, contrôle `is_running`).
- `workers/worker_import_00X.py` : fins wrappers qui instancient un worker via
  `build_import_worker_app`.
- `base_wakeupper.py` : logique partagée pour réveiller une liste d'URLs.
- `wakeuppers/invoice_wakeupper.py` : wakeupper dédié aux imports, utilise la clé
  interne et la config pour cibler tous les workers d'import.
- `config.py` : source unique de vérité pour les ports, URLs et paramètres de
  sécurité.
- `ABOUT_MANUFACTURERS.md` : présentation synthétique du dossier.

## 8) Bonnes pratiques opérationnelles

- Vérifier que `MANUFACTURERS_KEY` est bien défini dans l'environnement avant de
  lancer les services.
- Surveiller les statuts `pending/running/completed/error` dans la table `import_job`
  pour diagnostiquer les blocages.
- En cas d'ajout massif de workers, rester dans la plage `PORT_RANGE` ou l'ajuster
  dans `config.py` et garder des ports contigus pour la lisibilité.
- Garder les identifiants cohérents (`worker_import_XXX`) pour que les suffixes
  affichés dans les messages restent parlants.

Avec ces règles, l'ajout d'un nouveau worker reste une opération déclarative (config
+ petit fichier wrapper) et la coordination multi-worker demeure robuste sans
modification du code métier.
