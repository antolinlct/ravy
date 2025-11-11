# QUEU MANAGMENT BY 2 WORKERS

{
  "module": "import_queue_workers",
  "description": "Gestion intelligente de la file d’attente d’imports de factures, avec workers réveillables, traitement parallèle entre établissements et notifications via n8n.",
  "goal": "Garantir que chaque établissement voit ses factures traitées dans l’ordre d’arrivée (FIFO), tout en permettant le traitement simultané des factures de plusieurs établissements.",
  
  "methodology": {
    "workflow_overview": [
      "Les imports de factures arrivent depuis n8n et sont enregistrés comme 'jobs' en attente de traitement.",
      "Chaque job est lié à un établissement (establishment_id) et placé dans une file d’attente centrale.",
      "Des workers Python s’exécutent en arrière-plan pour traiter ces jobs.",
      "Chaque worker gère un job à la fois, mais plusieurs workers peuvent tourner en parallèle.",
      "Les workers se coordonnent automatiquement pour ne jamais traiter deux jobs du même établissement simultanément."
    ],

    "execution_logic": [
      "1. n8n crée un job d’import (status='pending') après réception d’un OCR terminé.",
      "2. n8n réveille un ou plusieurs workers via une requête HTTP (webhook interne).",
      "3. Chaque worker, à son réveil, cherche un job 'pending' dans la file.",
      "4. Avant de le traiter, il tente de prendre un verrou (lock) sur l’établissement du job.",
      "   - Si le verrou est disponible, le worker traite la facture.",
      "   - Si le verrou est déjà pris (autre worker actif sur cet établissement), il passe au job suivant.",
      "5. Le worker exécute la logique métier de l’import (calculs, création de factures, articles, recettes, marges, etc.).",
      "6. À la fin du traitement :",
      "   - Si tout s’est bien passé → job marqué comme 'completed'.",
      "   - En cas d’erreur → job marqué 'failed' + message d’erreur enregistré.",
      "7. Une fois la file vidée → le worker s’arrête proprement ('mise en sommeil').",
      "8. Quand un nouveau job arrive → n8n réveille à nouveau un worker pour relancer le cycle."
    ],

    "parallelism_rules": [
      "Chaque worker peut traiter un établissement à la fois.",
      "Un seul worker peut travailler sur un établissement donné à un instant T (grâce au verrouillage).",
      "Deux workers peuvent traiter deux établissements différents en parallèle sans risque de conflit.",
      "Les jobs d’un même établissement sont traités dans l’ordre d’arrivée (FIFO)."
    ],

    "sleep_wake_cycle": [
      "Quand un worker détecte qu’il n’y a plus aucun job 'pending', il se met en sommeil.",
      "Une notification est envoyée à n8n pour logguer l’événement et éventuellement alerter via Telegram : 'Worker en sommeil'.",
      "Quand n8n crée un nouveau job, il appelle une route d’API ('wake_worker') qui relance un ou plusieurs workers.",
      "Lors du réveil, n8n envoie aussi une notification Telegram pour suivi : 'Worker réveillé – X jobs en attente'."
    ],

    "error_and_retry_handling": [
      "Chaque worker capture les exceptions pendant le traitement.",
      "En cas d’échec, le job passe en 'failed' avec le message d’erreur sauvegardé.",
      "Les jobs échoués peuvent être relancés manuellement (status repassé en 'pending').",
      "Un process de surveillance (scheduler n8n) peut périodiquement vérifier les jobs 'failed' ou bloqués.",
      "S’il détecte un problème → n8n envoie une notification Telegram d’alerte (ex: '5 jobs échoués sur Ravy Import Queue')."
    ],

    "scaling_strategy": [
      "Débuter avec 1 ou 2 workers est suffisant pour un petit volume de clients.",
      "Chaque worker traite environ 300 à 400 factures par heure en moyenne.",
      "Tu peux ajouter un worker tous les 15 à 20 établissements pour conserver une file fluide.",
      "Le scaling est horizontal : tu lances un nouveau process identique sans modification de code."
    ],

    "telegram_notifications": [
      "Aucune intégration Telegram directe dans le code Python.",
      "Les workers envoient simplement une requête HTTP vers un webhook n8n.",
      "Ce webhook se charge de relayer les messages sur Telegram selon leur type :",
      "   - Démarrage du worker : '🟢 Worker #X réveillé — X jobs en attente'",
      "   - Fin de traitement : '😴 Worker #X en sommeil — queue vide'",
      "   - Erreur : '⚠️ Worker #X — job échoué : {message}'"
    ]
  },

  "summary": {
    "philosophy": "1 établissement = 1 file FIFO exclusive. Plusieurs établissements = exécution parallèle. Les workers dorment quand la file est vide et se réveillent automatiquement via n8n.",
    "advantages": [
      "Traitement fiable et séquentiel par établissement (aucun conflit de données).",
      "Traitement parallèle entre établissements pour plus de débit.",
      "Aucune consommation inutile quand il n’y a pas de job à traiter.",
      "Surveillance et alertes simplifiées via n8n et Telegram."
    ],
    "efficiency": {
      "import_time_average": "7–10 secondes par facture standard",
      "import_speed_per_worker": "300–400 factures par heure",
      "recommended_workers": "1 worker par tranche de 15–20 établissements actifs"
    }
  }
}

# WORKER FONCTIONNEMENT

{
  "function": "wake_worker",
  "description": "Endpoint d’API (FastAPI ou équivalent) utilisé par n8n pour réveiller un ou plusieurs workers lorsqu’un nouveau job d’import est créé.",
  "goal": "Relancer automatiquement le traitement de la file d’attente sans laisser un process tourner inutilement quand il n’y a rien à faire.",
  
  "workflow": {
    "trigger_source": "Appel HTTP POST depuis n8n dès qu’un nouveau import_job est créé avec status='pending'.",
    "main_steps": [
      {
        "step": 1,
        "name": "Réception de la requête n8n",
        "description": "n8n envoie un POST vers /api/wake-worker. Le payload contient éventuellement le nombre de workers à démarrer et des infos de contexte (ex: nombre de jobs pending)."
      },
      {
        "step": 2,
        "name": "Vérification de la file d’attente",
        "description": "La fonction interroge la table import_jobs pour vérifier qu’il y a bien des jobs 'pending'. Si la file est vide, elle renvoie un message 'Aucun job à traiter'."
      },
      {
        "step": 3,
        "name": "Lancement d’un ou plusieurs workers",
        "description": "Si des jobs sont en attente, la fonction lance un ou plusieurs processus (subprocess, Docker ou task asynchrone) pour exécuter worker.py."
      },
      {
        "step": 4,
        "name": "Notification à n8n / Telegram",
        "description": "La fonction appelle le webhook n8n 'notify_telegram' pour signaler : '🟢 Worker réveillé – X jobs en attente'."
      },
      {
        "step": 5,
        "name": "Réponse HTTP à n8n",
        "description": "Renvoie un JSON de confirmation contenant l’état du réveil et le nombre de workers lancés."
      }
    ],
    "payload_example": {
      "requested_by": "n8n",
      "pending_jobs": 12,
      "workers_to_start": 2
    },
    "response_example": {
      "status": "success",
      "message": "2 workers démarrés",
      "pending_jobs": 12
    }
  },

  "behaviour_rules": [
    "La fonction ne lance jamais plus de workers que le maximum défini dans la config (ex: 4).",
    "Si un worker est déjà actif et traite la queue, le wake_worker ne relance pas inutilement d’autres processus.",
    "Si la file est vide, la fonction loggue simplement l’appel sans rien exécuter.",
    "La communication Telegram passe toujours via un webhook n8n, jamais directement depuis le code backend.",
    "En cas d’erreur de lancement (ex: process bloqué), la fonction envoie aussi un message d’erreur à n8n pour Telegram ('⚠️ Erreur lors du réveil des workers')."
  ],

  "summary": {
    "philosophy": "Réveiller les workers uniquement quand il y a du travail, puis les laisser dormir une fois la queue vidée.",
    "key_points": [
      "Pas de boucle constante : exécution à la demande.",
      "Le backend n’a qu’à exécuter un subprocess (ou conteneur) à chaque réveil.",
      "n8n est le seul responsable des appels et des notifications Telegram.",
      "La fonction est stateless : elle ne garde aucun suivi des workers après leur lancement."
    ],
    "example_flow": [
      "1️⃣ N8N ajoute un job 'pending' dans import_jobs.",
      "2️⃣ N8N appelle /api/wake-worker (FastAPI).",
      "3️⃣ FastAPI démarre un process worker.py.",
      "4️⃣ Worker traite la file jusqu’à ce qu’elle soit vide, puis s’arrête.",
      "5️⃣ FastAPI / Worker envoie un message via n8n → Telegram : '😴 Worker en sommeil'."
    ]
  }
}
