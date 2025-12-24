from pathlib import Path
import importlib

# --- Dossier où sont stockés les contrats ---
CONTRACTS_PATH = Path(__file__).parent

# --- Index global de tous les contrats ---
CONTRACTS = {}

for schema_dir in CONTRACTS_PATH.iterdir():
    if not schema_dir.is_dir():
        continue

    for contract_file in schema_dir.glob("*_contract.py"):
        module_name = f"app.data_contracts.{schema_dir.name}.{contract_file.stem}"
        module = importlib.import_module(module_name)
        CONTRACTS[f"{schema_dir.name}.{module.CONTRACT['table']}"] = module.CONTRACT

print(f"[✓] {len(CONTRACTS)} contrats chargés ({', '.join(CONTRACTS.keys())})")
