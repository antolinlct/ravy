# --- Image de base ---
FROM python:3.11-slim

# --- Répertoire de travail ---
WORKDIR /app

# --- Dépendances ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Copier le code source ---
COPY ./app ./app

# --- Commande de démarrage ---
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
