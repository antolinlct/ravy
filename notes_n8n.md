# Intégration des appels N8N dans un backend Python

Architecture recommandée, bonnes pratiques, et mode d’emploi complet

🎯 Objectif

Ajouter une communication propre entre ton backend Python (FastAPI + Workers) et n8n, sans polluer ta logique métier, sans coupler ton code à l’outil, et en restant scalable.

## 1. Pourquoi NE PAS appeler N8N directement depuis les logiques métier ?

Mauvaises pratiques :

ton code métier devient dépendant de n8n

si n8n plante → ta facture plante

si n8n met 2 sec à répondre → ton worker ralentit

si tu changes d'outil (Zapier, Make, interne) → tu dois modifier 40 fichiers

ça rend tes tests unitaires impossibles

ça mélange métier + infrastructure dans un seul fichier

Donc, on ne met JAMAIS un httpx.post() dans une logique métier.

## 2. Architecture propre recommandée

La bonne architecture :

Logique métier -----------→ NotificationsService -----------→ n8n (webhook)
                                 (fichier séparé)


Ta logique métier doit juste faire :

await notifications_service.send("invoice_processed", payload)


Et c’est tout.

## 3. Créer un Webhook dans n8n

Dans n8n, ajoute un node :

Webhook → Trigger

Méthode : POST

URL : /webhook/event_ravy

Autorisations : clé API / IP filtering

Next nodes : email, SMS, Slack, log interne…

Tu obtiens une URL du type :

https://n8n.mondomaine.com/webhook/event_ravy?key=XXXXXX


Tu la mets dans les variables d’environnement :

N8N_WEBHOOK_URL=https://n8n.mondomaine.com/webhook/event_ravy?key=XXXXXX

## 4. Créer le service dédié : notifications_service.py

Chemin recommandé :

app/services/notifications_service.py


Contenu minimaliste (version async) :

import httpx
import os

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")


async def send(event: str, payload: dict) -> None:
    """
    Envoie un événement vers n8n.
    Ne casse jamais la logique métier.
    """
    if not N8N_WEBHOOK_URL:
        return

    data = {
        "event": event,
        "payload": payload,
    }

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(N8N_WEBHOOK_URL, json=data)
    except Exception:
        # très important : on ignore les erreurs
        # la logique métier ne doit JAMAIS dépendre de n8n
        pass

## 5. Comment l’utiliser dans n’importe quelle logique métier ?

Exemple dans ta fonction d’import facture :

from app.services import notifications_service

await notifications_service.send("invoice_processed", {
    "invoice_id": str(invoice_id),
    "establishment_id": str(establishment_id),
    "variation_count": len(filtered_variations),
})


👉 C’est la seule ligne à appeler depuis ton code métier.
👉 Tout le reste est centralisé dans notifications_service.py.

## 6. Architecture évolutive (si tu veux aller plus loin)

Aujourd’hui :
➡️ notification_service → webhook n8n

Plus tard, tu pourras changer l’intérieur du service sans toucher au reste :

passer par Redis queue

envoyer vers un microservice interne

bufferiser les events en cas de panne

implémenter un système exactly-once

activer des retries avec backoff

router certains events vers d'autres systèmes

TON CODE MÉTIER NE CHANGE PAS.
C’est tout l’intérêt de cette architecture.

## 7. Version synchrone si tu n’utilises pas async
import httpx
import os

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

def send(event: str, payload: dict) -> None:
    if not N8N_WEBHOOK_URL:
        return

    data = {"event": event, "payload": payload}

    try:
        httpx.post(N8N_WEBHOOK_URL, json=data, timeout=5)
    except Exception:
        pass

## 8. Sécurisation des appels

Toujours :

protéger le webhook par clé API

filtrer les IP d’autorisation côté n8n

jamais mettre l’URL en dur dans le code

ne jamais propager les erreurs de n8n au métier

## 9. Résumé rapide

❌ Ne jamais appeler n8n directement dans la logique métier

✔ Créer un service dédié (notifications_service.py)

✔ Votre logique métier appelle juste :
notifications_service.send(event, payload)

✔ Découplage total → scalable, maintenable

✔ N8N peut planter sans casser ton import facture

✔ Architecture professionnelle et robuste