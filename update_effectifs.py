import pandas as pd
import random

# Définir une nouvelle seed pour regénérer complètement
random.seed(123)

def generate_effectif_updated():
    """Génère un effectif avec les nouvelles plages spécifiées"""
    # Distribution réaliste basée sur la structure des cabinets d'avocats en France:
    # - 40% : (1, 2) personnes
    # - 35% : (3, 10) personnes  
    # - 20% : (11, 25) personnes
    # - 4% : (26, 50) personnes
    # - 1% : (50, 200) personnes
    
    rand = random.random()
    if rand < 0.40:  # 40% - très petits cabinets
        return random.randint(1, 2)
    elif rand < 0.75:  # 35% - petits cabinets
        return random.randint(3, 10)
    elif rand < 0.95:  # 20% - cabinets moyens
        return random.randint(11, 25)
    elif rand < 0.99:  # 4% - grands cabinets
        return random.randint(26, 50)
    else:  # 1% - très grands cabinets
        return random.randint(50, 200)

# Lire le fichier TSV
file_path = r'c:\Users\LIBOUBAN.INTRANET\OneDrive - SEPTEO\Documents\GitHub\tlibouban.github.io\csv\db_anonymized.tsv'
df = pd.read_csv(file_path, sep='\t', encoding='utf-8')

print(f"Mise à jour des effectifs pour {len(df)} lignes...")
print(f"Exemple d'anciens effectifs: {df['Effectif'].head(10).tolist()}")

# Mettre à jour tous les effectifs avec les nouvelles plages
for i in range(len(df)):
    if pd.notna(df.loc[i, 'Effectif']):  # Ne pas toucher aux valeurs NaN
        df.loc[i, 'Effectif'] = generate_effectif_updated()
    
    # Afficher le progrès tous les 1000 lignes
    if (i + 1) % 1000 == 0:
        print(f"Mis à jour {i + 1} lignes...")

# Convertir explicitement en entier
df['Effectif'] = df['Effectif'].astype('Int64')

print(f"Exemple de nouveaux effectifs: {df['Effectif'].head(10).tolist()}")

# Sauvegarder le fichier mis à jour
df.to_csv(file_path, sep='\t', index=False, encoding='utf-8')

print(f"Fichier mis à jour avec succès!")
print(f"Statistiques des nouveaux effectifs:")
print(f"Effectif moyen: {df['Effectif'].mean():.1f}")
print(f"Effectif médian: {df['Effectif'].median()}")
print(f"Effectif min/max: {df['Effectif'].min()}/{df['Effectif'].max()}")

# Vérification des plages
effectifs_valid = df['Effectif'].dropna()
print(f"\nRépartition par plages:")
print(f"1-2 personnes: {((effectifs_valid >= 1) & (effectifs_valid <= 2)).sum()} ({((effectifs_valid >= 1) & (effectifs_valid <= 2)).sum()/len(effectifs_valid)*100:.1f}%)")
print(f"3-10 personnes: {((effectifs_valid >= 3) & (effectifs_valid <= 10)).sum()} ({((effectifs_valid >= 3) & (effectifs_valid <= 10)).sum()/len(effectifs_valid)*100:.1f}%)")
print(f"11-25 personnes: {((effectifs_valid >= 11) & (effectifs_valid <= 25)).sum()} ({((effectifs_valid >= 11) & (effectifs_valid <= 25)).sum()/len(effectifs_valid)*100:.1f}%)")
print(f"26-50 personnes: {((effectifs_valid >= 26) & (effectifs_valid <= 50)).sum()} ({((effectifs_valid >= 26) & (effectifs_valid <= 50)).sum()/len(effectifs_valid)*100:.1f}%)")
print(f"50-200 personnes: {((effectifs_valid >= 50) & (effectifs_valid <= 200)).sum()} ({((effectifs_valid >= 50) & (effectifs_valid <= 200)).sum()/len(effectifs_valid)*100:.1f}%)") 