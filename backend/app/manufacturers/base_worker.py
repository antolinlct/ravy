"""
BaseWorker
-----------

Classe mère pour tous les workers RAVY.
Un worker :
- ignore les réveils s’il travaille déjà
- exécute ses jobs séquentiellement
- se rendort une fois la file vide
"""

import traceback

class BaseWorker:
    def __init__(self, name: str):
        self.name = name
        self.is_running = False

    def wake_up(self):
        """Appelée par /run – réveille le worker si libre."""
        if self.is_running:
            print(f"[{self.name}] 🔄 Déjà en cours — réveil ignoré.")
            return  # pas de retour
        print(f"[{self.name}] 🟢 Réveil reçu.")
        self.is_running = True
        try:
            self.run()
        except Exception as e:
            print(f"[{self.name}] ❌ Erreur : {e}")
            traceback.print_exc()
        finally:
            self.is_running = False
            print(f"[{self.name}] 💤 Travail terminé, retour au repos.")

    def run(self):
        """À implémenter dans les sous-classes concrètes."""
        raise NotImplementedError
