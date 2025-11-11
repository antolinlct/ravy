# WORKFLOW N8N POUR LES SMS CLIENTS

{
  "workflow": "notify_sms",
  "description": "Workflow n8n gérant les SMS transactionnels envoyés par Ravy via ClickSend.",
  "goal": "Envoyer automatiquement les SMS d’alerte (variations de prix, autres alertes internes) et enregistrer un log unique pour chaque envoi.",

  "process": {
    "steps": [
      {
        "step": 1,
        "name": "Trigger Webhook",
        "description": "Reçoit la requête depuis le backend lorsque le système détecte un événement nécessitant un SMS (ex: variation de prix, alerte fournisseur)."
      },
      {
        "step": 2,
        "name": "Split Type SMS",
        "description": "Vérifie le type de SMS à envoyer : 'price_drop' (baisse de prix) ou 'price_increase' (hausse de prix) et adapte le texte du message."
      },
      {
        "step": 3,
        "name": "Send SMS (ClickSend Node)",
        "description": "Envoie le SMS via le node ClickSend avec le champ numéro de téléphone et le texte du message formaté."
      },
      {
        "step": 4,
        "name": "Record Log in Supabase",
        "description": "Enregistre une entrée dans la table notification_log avec les informations principales de l’envoi (user, canal, contact, contenu, type)."
      }
    ],
    "payload_example": {
      "user_id": "uuid",
      "contact": "+33612345678",
      "message": "📉 Le prix de la Tomate Roma a baissé de 7%. Consultez votre tableau de bord Ravy.",
      "template_name": "price_alert",
      "metadata": {
        "product": "Tomate Roma",
        "price_change": "-7%",
        "supplier": "Transgourmet"
      }
    }
  },

  "database": {
    "table": "notification_log",
    "description": "Table commune d’historique des notifications (email et SMS).",
    "columns": {
      "id": {
        "type": "uuid",
        "purpose": "Identifiant unique du log."
      },
      "user_id": {
        "type": "uuid",
        "purpose": "Utilisateur concerné (FK vers users)."
      },
      "channel": {
        "type": "text ('email' ou 'sms')",
        "purpose": "Canal de communication utilisé."
      },
      "contact": {
        "type": "text",
        "purpose": "Email ou numéro de téléphone de destination."
      },
      "subject": {
        "type": "text",
        "purpose": "Objet du message (non utilisé pour SMS)."
      },
      "content": {
        "type": "text",
        "purpose": "Contenu exact envoyé (texte du SMS)."
      },
      "template_name": {
        "type": "text",
        "purpose": "Type de message ou identifiant logique du modèle (ex: 'price_alert')."
      },
      "metadata": {
        "type": "jsonb",
        "purpose": "Données contextuelles relatives à l’événement déclencheur (produit, variation, fournisseur...)."
      },
      "sent_at": {
        "type": "timestamptz",
        "purpose": "Horodatage d’envoi du message."
      },
      "created_at": {
        "type": "timestamptz",
        "purpose": "Horodatage de création du log."
      }
    },
    "notes": [
      "Table unique utilisée aussi par le workflow Email.",
      "Contient tout l’historique des SMS envoyés aux utilisateurs.",
      "Aucune gestion de statut, la table sert uniquement de trace d’envoi."
    ]
  }
}
