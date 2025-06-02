import pandas as pd
import random
import numpy as np

# Définir la seed pour la reproductibilité (optionnel)
random.seed(42)
np.random.seed(42)

def generate_type():
    """Génère Type: 60% Client, 40% Prospect"""
    return random.choices(['Client', 'Prospect'], weights=[60, 40])[0]

def generate_erp(type_client):
    """Génère ERP selon le type de client"""
    if type_client == 'Client':
        return random.choices(['ADAPPS', 'AIR', 'NEO'], weights=[10, 30, 60])[0]
    else:  # Prospect
        return random.choices(['PolyOffice', 'Jarvis', 'Kléos', 'Clématis', 'Kami', 'AvocatOnline'], 
                             weights=[15, 10, 10, 8, 5, 52])[0]

def generate_effectif():
    """Génère un effectif réaliste pour un cabinet d'avocats en France"""
    # Distribution réaliste basée sur la structure des cabinets d'avocats en France:
    # - Cabinets individuels: 1-2 personnes (40%)
    # - Petits cabinets: 3-10 personnes (35%)
    # - Cabinets moyens: 11-50 personnes (20%)
    # - Grands cabinets: 51-200 personnes (4%)
    # - Très grands cabinets: 201-1000+ personnes (1%)
    
    rand = random.random()
    if rand < 0.40:  # 40% - cabinets individuels/très petits
        return random.randint(1, 2)
    elif rand < 0.75:  # 35% - petits cabinets
        return random.randint(3, 10)
    elif rand < 0.95:  # 20% - cabinets moyens
        return random.randint(11, 50)
    elif rand < 0.99:  # 4% - grands cabinets
        return random.randint(51, 200)
    else:  # 1% - très grands cabinets
        return random.randint(201, 1000)

# Lire le fichier TSV
file_path = r'c:\Users\LIBOUBAN.INTRANET\OneDrive - SEPTEO\Documents\GitHub\tlibouban.github.io\csv\db_anonymized.tsv'
df = pd.read_csv(file_path, sep='\t', encoding='utf-8')

print(f"Fichier lu avec {len(df)} lignes")
print(f"Colonnes: {list(df.columns)}")

# Générer les données pour chaque ligne
for i in range(len(df)):
    if pd.isna(df.loc[i, 'Type']) or df.loc[i, 'Type'] == '':
        # Générer Type
        type_client = generate_type()
        df.loc[i, 'Type'] = type_client
        
        # Générer ERP basé sur le type
        df.loc[i, 'ERP'] = generate_erp(type_client)
        
        # Générer Effectif
        df.loc[i, 'Effectif'] = generate_effectif()
    
    # Afficher le progrès tous les 1000 lignes
    if (i + 1) % 1000 == 0:
        print(f"Traité {i + 1} lignes...")

# Sauvegarder le fichier mis à jour
df.to_csv(file_path, sep='\t', index=False, encoding='utf-8')

print(f"Fichier mis à jour avec succès!")
print(f"Résumé des données générées:")
print(f"Types: {df['Type'].value_counts()}")
print(f"ERPs: {df['ERP'].value_counts()}")
print(f"Effectif moyen: {df['Effectif'].mean():.1f}")
print(f"Effectif médian: {df['Effectif'].median()}")
print(f"Effectif min/max: {df['Effectif'].min()}/{df['Effectif'].max()}") 