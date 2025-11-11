# WORKFLOW N8N POUR LES EMAILS CLIENTS

{
  "workflow": "notify_email",
  "description": "Workflow n8n gérant tous les emails transactionnels envoyés par Ravy via Brevo.",
  "goal": "Envoyer les emails système (confirmation, abonnement, facture, essai, etc.) et enregistrer un log unique pour chaque envoi.",
  
  "process": {
    "steps": [
      {
        "step": 1,
        "name": "Trigger Webhook",
        "description": "Reçoit la requête depuis le backend ou un autre flux n8n. Le payload contient user_id, contact, type de mail, sujet, et contenu HTML."
      },
      {
        "step": 2,
        "name": "Split Type Email",
        "description": "Vérifie le type de mail à envoyer (ex: 'account_confirmation', 'subscription_renewal', 'invoice_success', etc.) et sélectionne le bon message ou bloc HTML."
      },
      {
        "step": 3,
        "name": "Send Email (Brevo Node)",
        "description": "Envoie le mail via le node Brevo 'Send Email' avec les champs : destinataire, sujet, contenu HTML, et expéditeur Ravy."
      },
      {
        "step": 4,
        "name": "Record Log in Supabase",
        "description": "Enregistre une entrée dans la table notification_log avec les informations principales de l’envoi (user, canal, contact, sujet, contenu, type)."
      }
    ],
    "payload_example": {
      "user_id": "uuid",
      "contact": "user@example.com",
      "subject": "Bienvenue chez Ravy",
      "content": "<p>Bonjour, merci pour votre inscription.</p>",
      "template_name": "account_confirmation",
      "metadata": {
        "trigger": "signup"
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
        "purpose": "Objet du mail (pour les emails uniquement)."
      },
      "content": {
        "type": "text",
        "purpose": "Contenu envoyé (HTML ou texte brut)."
      },
      "template_name": {
        "type": "text",
        "purpose": "Type de message ou identifiant logique du modèle (ex: 'account_confirmation')."
      },
      "metadata": {
        "type": "jsonb",
        "purpose": "Informations additionnelles liées à l’envoi (plan, fournisseur, contexte...)."
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
      "Table unique pour toutes les communications sortantes.",
      "Aucun statut ou réponse conservé pour garder la table légère.",
      "Les workflows Email et SMS y écrivent chacun leur ligne."
    ]
  }
}
