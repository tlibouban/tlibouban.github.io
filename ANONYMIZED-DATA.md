# 🔒 Documentation des Données Anonymisées

## 📋 Vue d'ensemble

Ce projet utilise des données anonymisées pour permettre un déploiement public sécurisé tout en préservant la confidentialité des informations client réelles.

## 📊 Fichiers de données

### `csv/db_anonymized.tsv`
- **📈 Nombre d'entrées** : 23,407 (+ en-tête)
- **🏢 Format** : N° de dossier [TAB] Nom du cabinet
- **🎯 Objectif** : Données de démonstration pour la fonctionnalité de recherche client

### Données exclues : `csv/db.tsv`
- **❌ Statut** : Exclu du repository (`.gitignore`)
- **🔐 Raison** : Contient des données client confidentielles
- **⚠️ Attention** : Ne jamais committer ce fichier

## 🎭 Processus d'anonymisation

### Génération des numéros de dossier
- **📋 Plage** : 262 - ~24000 (avec quelques numéros sautés)
- **🎲 Logique** : Respect de la structure originale
- **📊 Distribution** : ~1.5% de numéros manquants pour réalisme

### Génération des noms de cabinets
Les noms sont générés selon plusieurs modèles réalistes :

#### 📝 Types de structures (25% chacun)
1. **Nom simple** : `MARTIN`
2. **Prénom + Nom** : `BERNARD Jean-Pierre`
3. **Nom + Type** : `DUPONT AVOCATS`
4. **Deux noms** : `MARTIN & BERNARD`
5. **Structures légales** : `SCP ROUSSEAU SIMON VINCENT`

#### 🏙️ Variantes géographiques
- **Grandes villes** : Paris, Lyon, Marseille, Toulouse...
- **Codes postaux** : (75001), (69001), etc.
- **Spécialisations** : CONSEIL, EXPERTISE, LEGAL

#### 👨‍💼 Base de noms utilisés
- **80+ noms de famille** français courants
- **50+ prénoms** masculins et féminins
- **15+ types de cabinets** (SCP, SELARL, etc.)
- **50+ villes** françaises

## 🔧 Structure technique

### Format TSV
```
N°	Client
262	DUBOIS & ASSOCIES
263	MARTIN LEBLANC Avocats (75001)
264	SCP BERNARD DURAND
...
```

### Exemples de noms générés
- `MARTIN & BERNARD`
- `SCP DUBOIS ROUSSEAU VINCENT`
- `CONSEIL EXPERTISE PARIS`
- `BERTRAND AVOCATS (75007)`
- `SELARL MOREAU-SIMON & ASSOCIES`

## 🎯 Avantages de l'anonymisation

### ✅ Sécurité
- **🔒 Protection** des données client réelles
- **🌐 Déploiement public** sans risque
- **📋 Conformité** aux réglementations de confidentialité

### ✅ Fonctionnalité
- **🔍 Tests complets** de la recherche client
- **📊 Volume réaliste** de données (23K+ entrées)
- **🎭 Noms authentiques** français

### ✅ Maintenance
- **⚡ Performance** optimisée pour le web
- **🔄 Reproductibilité** du processus
- **📝 Documentation** complète

## 🚀 Utilisation

### Pour les développeurs
```javascript
// Le fichier est automatiquement chargé par clientSearch.js
// Aucune modification nécessaire du code existant
```

### Pour les tests
- Utiliser n'importe quel numéro entre 262 et ~24000
- Tester des recherches partielles
- Vérifier l'autocomplétion

## ⚠️ Important

1. **Ne jamais committer `csv/db.tsv`** (données réelles)
2. **Utiliser uniquement `csv/db_anonymized.tsv`** pour les déploiements
3. **Maintenir la cohérence** des formats TSV
4. **Documenter** toute modification du processus

## 🔄 Régénération

Si besoin de régénérer les données anonymisées :

1. Modifier le script `generate_clients.py` si nécessaire
2. Exécuter : `python generate_clients.py`
3. Vérifier le résultat
4. Committer le nouveau fichier

---

**📅 Dernière mise à jour** : Décembre 2024  
**🏷️ Version** : 1.0  
**👤 Auteur** : Automatiquement généré 