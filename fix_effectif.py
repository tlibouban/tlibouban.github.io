import pandas as pd

# Lire le fichier TSV
file_path = r'c:\Users\LIBOUBAN.INTRANET\OneDrive - SEPTEO\Documents\GitHub\tlibouban.github.io\csv\db_anonymized.tsv'
df = pd.read_csv(file_path, sep='\t', encoding='utf-8')

print(f"Avant conversion - exemple de valeurs Effectif: {df['Effectif'].head(10).tolist()}")
print(f"Nombre de valeurs NaN dans Effectif: {df['Effectif'].isna().sum()}")

# Convertir la colonne Effectif en entier (pandas convertira automatiquement en Int64 qui gère les NaN)
df['Effectif'] = df['Effectif'].astype('Int64')

print(f"Après conversion - exemple de valeurs Effectif: {df['Effectif'].head(10).tolist()}")

# Sauvegarder le fichier mis à jour
df.to_csv(file_path, sep='\t', index=False, encoding='utf-8')

print("Fichier mis à jour avec succès - les effectifs sont maintenant des entiers sans décimales !") 