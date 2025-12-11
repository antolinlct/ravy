# Erreur FastAPI lors de la création (UUID non sérialisable)

## Contexte
- Les schémas Pydantic utilisent des identifiants en `UUID` (ex. `UserProfiles.id`).
- Les routes générées appellent les services avec `data.dict()` pour constituer la charge Supabase.
- Supabase envoie ensuite cette charge via `httpx`, qui attend des valeurs JSON sérialisables.

## Symptômes observés
- Un `POST /user_profiles/` renvoie **500 Internal Server Error**.
- La trace d'exécution indique `TypeError: Object of type UUID is not JSON serializable` lors de l'appel `supabase.table("user_profiles").insert(payload).execute()`.
- Un avertissement distinct apparaît au démarrage : `Field name "json" in "Logs" shadows an attribute in parent "BaseModel"`.

## Origine de l'erreur
1. **Sérialisation des UUID**  
   - La route `create_user_profiles` passe `data.dict()` au service, ce qui laisse les `UUID` Python intacts dans le dictionnaire (les `json_encoders` de Pydantic ne sont appliqués que lors de `.json()` / `.model_dump(mode="json")`).【F:backend/app/api/routes/user_profiles.py†L31-L34】【F:backend/app/schemas/user_profiles.py†L8-L22】
   - Le service envoie ce dictionnaire tel quel à Supabase, provoquant l'échec de la sérialisation JSON côté client `httpx`.【F:backend/app/services/user_profiles_service.py†L45-L47】

2. **Avertissement sur `Logs.json`**  
   - La classe `Logs` définit un champ nommé `json`, qui masque la méthode héritée `BaseModel.json`, d'où l'avertissement Pydantic au démarrage. Le fonctionnement n'est pas bloquant mais le warning restera tant que ce nom sera conservé.【F:backend/app/schemas/logs.py†L10-L23】

## Pourquoi la correction UUID précédente ne suffit pas
- Le script de génération a bien aligné les signatures sur `UUID`, mais la sérialisation effective dépend de la manière dont la charge est construite avant l'appel Supabase. Tant que `data.dict()` est utilisé, les `UUID` ne seront pas convertis en chaînes.

## Pistes de résolution
- Construire la charge via `data.model_dump(mode="json")` (ou `data.json()` puis `json.loads`) pour appliquer les `json_encoders` et convertir les `UUID` en chaînes avant l'insertion.
- À défaut, transformer explicitement les valeurs `UUID` en `str` dans les services avant l'appel `insert/update` Supabase.
- Renommer le champ `json` dans le schéma `Logs` (par ex. `payload` ou `metadata`) pour supprimer l'avertissement Pydantic si nécessaire.
