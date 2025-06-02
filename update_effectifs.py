#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter les colonnes de métiers dans db_anonymized.tsv
Basé sur la répartition des métiers selon la taille des cabinets
"""

import csv
import random
import math

def get_job_distribution(effectif):
    """
    Retourne la répartition des métiers selon l'effectif du cabinet
    Basé sur le fichier '# Répartition des métiers dans les cabin.md'
    """
    
    if effectif <= 5:
        # Petites structures (1-5 membres)
        return {
            'avocats_associes': (80, 90),
            'avocats_collaborateurs': (5, 15),
            'secretaires': (5, 10),
            'assistants_juridiques': (0, 1),  # Rare
            'juristes': (0, 1),  # Très rare
            'informatique': (0, 0),
            'rh': (0, 0),
            'communication': (0, 0),
            'documentation': (0, 0),
            'comptabilite': (0, 0)  # Externalisé
        }
    elif effectif <= 50:
        # Moyennes structures (6-50 membres)
        return {
            'avocats_associes': (40, 60),
            'avocats_collaborateurs': (25, 35),
            'secretaires': (10, 15),
            'assistants_juridiques': (8, 12),
            'juristes': (2, 5),
            'informatique': (0, 1),  # Rare
            'rh': (0, 1),  # Rare
            'communication': (0, 1),  # Rare
            'documentation': (0, 1),  # Rare
            'comptabilite': (1, 3)
        }
    else:
        # Grandes structures (50+ membres)
        return {
            'avocats_associes': (20, 30),
            'avocats_collaborateurs': (35, 45),
            'secretaires': (8, 12),
            'assistants_juridiques': (10, 15),
            'juristes': (8, 12),
            'informatique': (2, 4),
            'rh': (2, 3),
            'communication': (1, 2),
            'documentation': (1, 2),
            'comptabilite': (2, 4)
        }

def calculate_job_numbers(effectif, distribution):
    """
    Calcule le nombre de personnes pour chaque métier
    """
    jobs = {}
    total_assigned = 0
    
    # Calculer chaque métier
    for job, (min_pct, max_pct) in distribution.items():
        if min_pct == 0 and max_pct == 0:
            jobs[job] = 0
        elif min_pct == 0 and max_pct == 1:  # Rare
            # 20% de chance d'avoir 1 personne
            jobs[job] = 1 if random.random() < 0.2 else 0
        else:
            # Calculer le pourcentage aléatoire dans la fourchette
            pct = random.uniform(min_pct, max_pct) / 100
            number = max(1, round(effectif * pct))
            jobs[job] = number
        
        total_assigned += jobs[job]
    
    # Ajuster si le total dépasse l'effectif
    if total_assigned > effectif:
        # Réduire proportionnellement en commençant par les plus gros effectifs
        jobs_sorted = sorted(jobs.items(), key=lambda x: x[1], reverse=True)
        excess = total_assigned - effectif
        
        for job, count in jobs_sorted:
            if excess <= 0:
                break
            reduction = min(count - 1, excess)
            if reduction > 0:
                jobs[job] = max(1, count - reduction)
                excess -= reduction
    
    # Si le total est inférieur, ajouter aux avocats associés/collaborateurs
    elif total_assigned < effectif:
        shortfall = effectif - total_assigned
        if jobs['avocats_associes'] > 0:
            jobs['avocats_associes'] += shortfall
        elif jobs['avocats_collaborateurs'] > 0:
            jobs['avocats_collaborateurs'] += shortfall
        else:
            jobs['avocats_associes'] = shortfall
    
    return jobs

def update_tsv_with_jobs():
    """
    Met à jour le fichier TSV avec les colonnes de métiers
    """
    
    # Lire le fichier existant
    rows = []
    with open('csv/db_anonymized.tsv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        rows = list(reader)
    
    # Header existant
    if len(rows) == 0:
        return
        
    header = rows[0]
    
    # Nouvelles colonnes de métiers
    new_columns = [
        'Avocats_Associes',
        'Avocats_Collaborateurs', 
        'Secretaires',
        'Assistants_Juridiques',
        'Juristes',
        'Informatique',
        'RH',
        'Communication',
        'Documentation',
        'Comptabilite'
    ]
    
    # Vérifier si les colonnes existent déjà
    existing_columns = set(header)
    columns_to_add = [col for col in new_columns if col not in existing_columns]
    
    if columns_to_add:
        # Ajouter les nouvelles colonnes au header
        header.extend(columns_to_add)
        rows[0] = header
    
    # Index des colonnes importantes
    effectif_idx = header.index('Effectif') if 'Effectif' in header else 4
    
    # Index des nouvelles colonnes
    job_indices = {col: header.index(col) for col in new_columns if col in header}
    
    # Traiter chaque ligne de données
    for i in range(1, len(rows)):
        row = rows[i]
        
        # Étendre la ligne si nécessaire
        while len(row) < len(header):
            row.append('0')
        
        try:
            effectif = int(row[effectif_idx]) if effectif_idx < len(row) and row[effectif_idx].isdigit() else 1
        except (ValueError, IndexError):
            effectif = 1
        
        # Obtenir la distribution selon la taille
        distribution = get_job_distribution(effectif)
        
        # Calculer les nombres pour chaque métier
        jobs = calculate_job_numbers(effectif, distribution)
        
        # Mapper les jobs aux colonnes
        job_mapping = {
            'avocats_associes': 'Avocats_Associes',
            'avocats_collaborateurs': 'Avocats_Collaborateurs',
            'secretaires': 'Secretaires',
            'assistants_juridiques': 'Assistants_Juridiques',
            'juristes': 'Juristes',
            'informatique': 'Informatique',
            'rh': 'RH',
            'communication': 'Communication',
            'documentation': 'Documentation',
            'comptabilite': 'Comptabilite'
        }
        
        # Remplir les valeurs
        for job_key, job_count in jobs.items():
            column_name = job_mapping[job_key]
            if column_name in job_indices:
                row[job_indices[column_name]] = str(job_count)
        
        rows[i] = row
    
    # Écrire le fichier mis à jour
    with open('csv/db_anonymized.tsv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerows(rows)
    
    print(f"✅ Fichier mis à jour avec {len(new_columns)} colonnes de métiers")
    print(f"📊 {len(rows)-1} lignes de données traitées")
    
    # Afficher quelques statistiques
    if len(rows) > 1:
        print("\n📈 Aperçu des premières lignes:")
        print("\t".join(header))
        for i in range(1, min(6, len(rows))):
            print("\t".join(rows[i]))

if __name__ == "__main__":
    # Fixer la seed pour avoir des résultats reproductibles
    random.seed(42)
    
    print("🏢 Mise à jour du fichier TSV avec la répartition des métiers...")
    update_tsv_with_jobs()
    print("✨ Terminé !") 