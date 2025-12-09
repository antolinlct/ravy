# Rapports de tests des fonctions read

## Contexte des tests
- Environnement local sans variables `SUPABASE_URL`/`SUPABASE_KEY`, ce qui empêche d'exécuter les appels réels Supabase.
- Aucun test automatisé n'est présent sous `backend/tests/logic/read`; la commande `pytest` ne collecte donc aucun scénario sur ces fonctions (voir sortie ci-dessous).

```bash
pytest backend/tests/logic/read
```

## Bugs identifiés
### `app/logic/read/market_database_overview.py`
- **_fetch_user_articles_for_product** : la requête sur `articles` ne filtre pas par `establishment_id`, contrairement aux autres fetchers de ce module. Les articles d'autres établissements peuvent être mélangés dans les comparaisons marché.
  - Correctif suggéré : ajouter `.eq("establishment_id", establishment_id)` avant l'exécution Supabase pour isoler les données du bon tenant.

## Points bloquants pour des tests plus poussés
- Les fonctions initialisent directement le client Supabase au moment de l'import, ce qui rend difficile le test unitaire sans variables d'environnement ou sans possibilité d'injecter un client mock. Il faudrait autoriser l'injection ou le patch du client pour automatiser les scénarios.
