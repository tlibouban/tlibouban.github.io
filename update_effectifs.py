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
    S'assure que la somme totale = effectif exact
    """
    if effectif <= 0:
        return {job: 0 for job in distribution.keys()}
    
    jobs = {}
    
    # Phase 1: Calculer les nombres idéaux selon les pourcentages
    ideal_numbers = {}
    for job, (min_pct, max_pct) in distribution.items():
        if min_pct == 0 and max_pct == 0:
            ideal_numbers[job] = 0
        elif min_pct == 0 and max_pct == 1:  # Rare
            # 20% de chance d'avoir 1 personne pour les métiers "rares"
            ideal_numbers[job] = 1 if random.random() < 0.2 and effectif > 3 else 0
        else:
            # Calculer le pourcentage aléatoire dans la fourchette
            pct = random.uniform(min_pct, max_pct) / 100
            ideal_numbers[job] = effectif * pct
    
    # Phase 2: Convertir en entiers et ajuster pour avoir exactement l'effectif
    # Commencer par les nombres entiers
    for job in distribution.keys():
        jobs[job] = 0
    
    # Trier les métiers par nombre idéal décroissant pour distribuer intelligemment
    sorted_jobs = sorted(ideal_numbers.items(), key=lambda x: x[1], reverse=True)
    
    remaining_effectif = effectif
    
    # Phase 3: Attribuer au minimum 1 personne aux métiers principaux obligatoires
    # Pour petites structures: au moins 1 associé
    # Pour moyennes/grandes: au moins 1 associé et 1 collaborateur
    if effectif >= 1:
        jobs['avocats_associes'] = 1
        remaining_effectif -= 1
        
        if effectif >= 2 and effectif > 5:  # Moyennes/grandes structures
            if remaining_effectif > 0:
                jobs['avocats_collaborateurs'] = 1
                remaining_effectif -= 1
    
    # Phase 4: Distribuer le reste selon les proportions idéales
    if remaining_effectif > 0:
        # Calculer les parts restantes à distribuer
        jobs_to_distribute = []
        for job, ideal_val in sorted_jobs:
            if job not in ['avocats_associes', 'avocats_collaborateurs'] or jobs[job] == 0:
                if ideal_val > 0:
                    jobs_to_distribute.append((job, ideal_val))
        
        # Distribuer le reste proportionnellement
        total_ideal = sum(val for _, val in jobs_to_distribute)
        
        if total_ideal > 0:
            for job, ideal_val in jobs_to_distribute:
                if remaining_effectif <= 0:
                    break
                    
                # Calculer la part proportionnelle
                proportion = ideal_val / total_ideal
                to_add = max(0, round(remaining_effectif * proportion))
                
                if to_add > remaining_effectif:
                    to_add = remaining_effectif
                    
                jobs[job] += to_add
                remaining_effectif -= to_add
        
        # Phase 5: Distribuer les dernières personnes aux métiers principaux
        if remaining_effectif > 0:
            # Ajouter aux avocats (associés d'abord, puis collaborateurs)
            if remaining_effectif > 0:
                jobs['avocats_associes'] += remaining_effectif // 2 + remaining_effectif % 2
                remaining_effectif = remaining_effectif // 2
                
            if remaining_effectif > 0:
                jobs['avocats_collaborateurs'] += remaining_effectif
                remaining_effectif = 0
    
    # Phase 6: Vérification finale et ajustement
    total_assigned = sum(jobs.values())
    
    # Si on a trop assigné, réduire en commençant par les métiers support
    while total_assigned > effectif:
        # Ordre de réduction: support → juristes → secrétaires → collaborateurs
        reduction_order = [
            'comptabilite', 'documentation', 'communication', 'rh', 'informatique',
            'juristes', 'assistants_juridiques', 'secretaires', 'avocats_collaborateurs'
        ]
        
        reduced = False
        for job in reduction_order:
            if jobs[job] > 0 and total_assigned > effectif:
                jobs[job] -= 1
                total_assigned -= 1
                reduced = True
                break
        
        if not reduced:  # Sécurité pour éviter une boucle infinie
            break
    
    # Si on n'a pas assez assigné, ajouter aux avocats
    while total_assigned < effectif:
        if jobs['avocats_associes'] < jobs['avocats_collaborateurs']:
            jobs['avocats_associes'] += 1
        else:
            jobs['avocats_collaborateurs'] += 1
        total_assigned += 1
    
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