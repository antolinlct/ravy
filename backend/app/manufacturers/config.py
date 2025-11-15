"""
Manufacturers Configuration
===========================

Ce fichier définit la configuration complète du système d’exécution asynchrone de RAVY :
- les ports internes réservés aux workers (manufacturers)
- les adresses de communication internes (toujours locales)
- les clés et IPs autorisées pour la sécurité
- les règles de conception pour les futures extensions

Ce fichier est **le même** en local et en production (Hostinger, Docker, etc.).
Aucun nom de domaine public (comme app.ravy.fr) n’intervient ici.
"""

# ================================================================
# ⚙️ PLAGE DE PORTS DÉDIÉE AUX MANUFACTURERS
# ================================================================

"""
Les workers (manufacturers) tournent sur le même serveur que FastAPI.
Pour éviter tout conflit de port :

    - FastAPI utilise généralement le port 8000
    - Uvicorn (API workers internes) peut aussi occuper 8001–8099
    - PostgreSQL, Redis, Nginx ont également leurs ports réservés

👉 On réserve donc **une plage interne propre** pour les manufacturers : **9000–9199**

Pourquoi 9000 ?
---------------
- Cette plage est toujours libre sur les distributions Linux classiques (Ubuntu, Debian)
- Elle ne nécessite pas de privilèges root (contrairement aux ports <1024)
- Elle est lisible et facile à retenir (9000 = "système interne RAVY")
- Elle est suffisamment éloignée de FastAPI (8000–8099) pour éviter toute collision

Si un jour tu veux revenir aux ports 8000–8099 :
- change simplement les `port` et `url` ci-dessous
- rien d’autre ne doit être modifié (ni le code, ni les wakeuppers)
"""

PORT_RANGE = (9000, 9199)  # 🌐 Plage réservée aux processus internes RAVY

# ================================================================
# 🧩 DÉFINITION DES WORKERS (PAR DOMAINE)
# ================================================================


WORKERS = {
    # ------------------------------------------------------------
    # 🧾 IMPORT — Traitement et analyse des factures fournisseurs
    # ------------------------------------------------------------
    "import": [
        {
            "id": "worker_import_001",
            "url": "http://127.0.0.1:9001",
            "port": 9001,
            "description": "Premier worker chargé de traiter les imports de factures (OCR + structuration).",
        },
        {
            "id": "worker_import_002",
            "url": "http://127.0.0.1:9002",
            "port": 9002,
            "description": "Deuxième worker d’import, actif pour répartir la charge entre établissements.",
        },
    ],

    # ------------------------------------------------------------
    # 🔁 MERGESUPPLIERS — Regroupement des fournisseurs similaires
    # ------------------------------------------------------------
    "mergesuppliers": [
        {
            "id": "worker_mergesuppliers_001",
            "url": "http://127.0.0.1:9011",
            "port": 9011,
            "description": "Premier worker pour la fusion des fournisseurs similaires (corrections OCR, suggestions IA).",
        },
        {
            "id": "worker_mergesuppliers_002",
            "url": "http://127.0.0.1:9012",
            "port": 9012,
            "description": "Deuxième worker de fusion fournisseurs, utile pour le traitement parallèle.",
        },
    ],

    # ------------------------------------------------------------
    # 🔮 FUTURES EXTENSIONS — Exemples
    # ------------------------------------------------------------
    # "export": [
    #     {
    #         "id": "worker-export-a",
    #         "url": "http://127.0.0.1:9021",
    #         "port": 9021,
    #         "description": "Génère les exports PDF ou CSV à la demande.",
    #     }
    # ],
    #
    # "ia": [
    #     {
    #         "id": "worker-ia-a",
    #         "url": "http://127.0.0.1:9031",
    #         "port": 9031,
    #         "description": "Analyse intelligente des marges et recommandations automatiques.",
    #     }
    # ],
}

# ================================================================
# 🔒 PARAMÈTRES DE SÉCURITÉ INTERNE
# ================================================================

"""
Les wakeuppers et les workers communiquent uniquement sur le serveur local.
Mais par précaution, on ajoute deux couches de sécurité :
1️⃣ Une clé d’accès interne partagée
2️⃣ Un filtrage IP local
"""

# 1️⃣ Clé d’accès interne — utilisée dans le header HTTP des wakeuppers
INTERNAL_ACCESS_KEY = "ravy_workers_2025_prod_JxT4!d9vQ2mZn#L8sR"  # ⚠️ à remplacer par une vraie clé forte

# 2️⃣ Liste blanche d’IPs autorisées (par défaut, uniquement la machine locale)
ALLOWED_IPS = ["127.0.0.1", "localhost"]

# ================================================================
# 🧠 DOCUMENTATION TECHNIQUE
# ================================================================

"""
1️⃣ STRUCTURE DE COMMUNICATION
------------------------------
Wakeupper → envoie un signal HTTP vers → Worker (/run)
Chaque worker tourne sur un port local unique (ex: 9001, 9011…).
Aucune route n’est exposée sur Internet.
Le wakeupper et le worker communiquent via 127.0.0.1 (loopback Linux).

---

2️⃣ SÉCURITÉ
------------
✅ Tous les échanges se font en local (pas via le domaine public).
✅ Les routes /run vérifient le header "X-RAVY-KEY" avant exécution.
✅ Seules les IP autorisées (ALLOWED_IPS) peuvent ping les workers.
✅ En production, les ports 9000–9199 peuvent rester fermés sur le pare-feu externe.

Résultat : même si ton domaine "app.ravy.fr" est attaqué, les processus internes restent inaccessibles.

---

3️⃣ DÉVELOPPEMENT LOCAL
------------------------
Cette configuration fonctionne **telle quelle** sur ton Mac ou PC :
- FastAPI sur 8000
- tes workers sur 9001, 9002, 9011, etc.
- les wakeuppers envoient leurs pings en local

Aucune modification nécessaire entre le local et le serveur Hostinger.

---

4️⃣ DÉPLOIEMENT HOSTINGER
--------------------------
Sur ton KVM8 Hostinger :
- FastAPI tournera toujours sur le port 8000 (ou derrière Nginx en 443)
- Les workers tourneront en parallèle sur les ports 9000+
- Le réseau local du serveur gère les échanges sans dépendre de ton domaine public.

Tout est interne au système. Rien ne passe par Internet.

---

5️⃣ RETOUR AUX PORTS 8000+
---------------------------
Si un jour tu veux revenir à la plage 8000–8099 :
- change les valeurs "port" et "url" ici (ex: 8001, 8002…)
- redémarre les workers et wakeuppers
Le reste du code fonctionnera sans aucune modification.

---

6️⃣ BONNE PRATIQUE : NOMMAGE
-----------------------------
Chaque worker a un ID unique ("worker-merge-a", "worker-facture-b", etc.)
➡️ Cela facilite la lecture des logs et l’analyse des erreurs.

Tu peux utiliser le schéma :
    worker-<type>-<lettre>
    ex: worker-ia-a, worker-export-b
"""

# ================================================================
# 🧰 FONCTION UTILITAIRE
# ================================================================

def get_worker_urls(worker_type: str):
    """
    Renvoie la liste des URLs des workers d’un type donné.

    Exemple :
        get_worker_urls("facture")
        → ["http://127.0.0.1:9001", "http://127.0.0.1:9002"]

    Cette fonction est utilisée par les wakeuppers pour réveiller les bons workers.
    """
    if worker_type not in WORKERS:
        raise ValueError(f"Type de worker inconnu : {worker_type}")
    return [w["url"] for w in WORKERS[worker_type]]
