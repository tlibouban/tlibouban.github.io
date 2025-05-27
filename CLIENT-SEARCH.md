# 🔍 Module de Recherche Client

## 📋 Description

Le module de recherche client permet de rechercher automatiquement le nom d'un client à partir de son numéro de dossier en utilisant la base de données `csv/db.tsv`. Cette fonctionnalité améliore l'efficacité de saisie et réduit les erreurs.

## ✨ Fonctionnalités

### 🔄 Recherche Automatique
- **Saisie en temps réel** : Recherche déclenchée automatiquement après 500ms de pause dans la saisie
- **Recherche immédiate** : Appuyez sur Entrée ou cliquez ailleurs pour une recherche instantanée
- **Cache intelligent** : Les résultats sont mis en cache pour une performance optimale

### 🎯 Types de Recherche
1. **Exacte** : Correspondance parfaite avec le numéro de dossier
2. **Approximative** : Recherche par sous-chaînes si aucune correspondance exacte
3. **Flexible** : Gestion automatique des zéros en début (262 = 0262 = 00262)

### 📱 Interface Utilisateur

#### Indicateurs Visuels
- **🔍 Icône de recherche** : Visible dans le champ numéro de dossier
- **États du champ client** :
  - 🟢 **Vert** : Client trouvé (correspondance exacte)
  - 🟡 **Orange** : Correspondance approximative
  - 🔴 **Rouge** : Aucun client trouvé

#### Notifications
- **Messages contextuels** : Informations sur le résultat de la recherche
- **Position adaptative** : 
  - Desktop : En haut à droite
  - Mobile : En bas de l'écran
- **Types de notifications** :
  - ✅ Succès (vert)
  - ⚠️ Avertissement (orange)
  - ℹ️ Information (bleu)
  - ❌ Erreur (rouge)

## 🛠️ Installation et Configuration

### Fichiers Ajoutés
```
js/clientSearch.js       # Module principal de recherche
css/client-search.css    # Styles pour l'interface
```

### Intégration HTML
Les références ont été ajoutées automatiquement dans `index.html` :
```html
<!-- CSS -->
<link rel="stylesheet" href="css/client-search.css" />

<!-- JavaScript -->
<script src="js/clientSearch.js"></script>
```

### Base de Données
Le fichier `csv/db.tsv` doit contenir :
- **Format** : TSV (Tab-Separated Values)
- **Structure** : `N°[TAB]Client`
- **Encodage** : UTF-8

Exemple :
```
N°	Client
262	MENDI CAHN
263	BIGNON LEBRAY & Associés (Paris)
264	CONSEIL NATIONAL DES BARREAUX
```

## 🎮 Utilisation

### Workflow Utilisateur
1. **Saisir le numéro** dans le champ "N° Dossier"
2. **Attendre 500ms** ou appuyer sur Entrée
3. **Le client se remplit automatiquement** si trouvé
4. **Notification affichée** avec le résultat

### Exemples d'Usage
```javascript
// Recherche manuelle (via console ou script)
const clientSearch = window.getClientSearchInstance();
const client = clientSearch.searchClient('262');
console.log(client); // "MENDI CAHN"

// Statistiques
console.log(clientSearch.getStats());
// { totalClients: 23408, isLoaded: true, cacheSize: 5 }
```

## 🚀 Performance

### Optimisations Incluses
- **Cache des résultats** : Évite les recherches répétitives
- **Debounce** : Limite les recherches pendant la saisie
- **Map JavaScript** : Structure de données optimisée pour la recherche
- **Lazy Loading** : Chargement uniquement quand nécessaire

### Métriques
- **Taille base** : ~23 000 clients
- **Temps de chargement** : ~100-200ms (selon connexion)
- **Temps de recherche** : <1ms (après chargement)

## 📱 Responsive & Accessibilité

### Mobile-First
- **Notifications adaptatives** : Position optimisée pour mobile
- **Taille des touches** : Respecte les standards touch (44px minimum)
- **Animations fluides** : Transitions optimisées

### Accessibilité
- **Navigation clavier** : Tab, Entrée, Échap supportés
- **Lecteurs d'écran** : Aria-labels appropriés
- **Contraste élevé** : Respect des standards WCAG
- **Réduction de mouvement** : Support de `prefers-reduced-motion`

## 🎨 Personnalisation

### Classes CSS Disponibles
```css
.client-found         /* Client trouvé (exact) */
.client-approximate   /* Correspondance approximative */
.client-not-found     /* Aucun client trouvé */
.search-icon          /* Icône de recherche */
.search-input-container /* Conteneur avec icône */
```

### Variables CSS
```css
--notification-duration: 4s;     /* Durée d'affichage */
--search-icon-color: #666;       /* Couleur icône */
--border-success: #22c55e;       /* Bordure succès */
--border-warning: #f59e0b;       /* Bordure avertissement */
```

## 🐛 Dépannage

### Problèmes Courants

#### Client non trouvé
- **Vérifier** que le numéro existe dans `csv/db.tsv`
- **Tester** avec/sans zéros en début
- **Contrôler** l'encodage du fichier TSV

#### Fichier TSV non chargé
```javascript
// Vérifier dans la console
console.log('Base chargée:', window.getClientSearchInstance()?.getStats());
```

#### Performance lente
- **Vider le cache** : `clientSearch.clearCache()`
- **Vérifier la taille** du fichier TSV
- **Optimiser** le serveur web

### Messages d'Erreur
- `❌ Erreur lors de l'initialisation` : Problème de chargement TSV
- `⚠️ Champs introuvables` : IDs HTML manquants
- `ℹ️ Aucun client trouvé` : Numéro inexistant dans la base

## 🔄 API Développeur

### Méthodes Principales
```javascript
const clientSearch = window.getClientSearchInstance();

// Recherche manuelle
clientSearch.searchClient('262');

// Statistiques
clientSearch.getStats();

// Gestion du cache
clientSearch.clearCache();
```

### Événements
```javascript
// Écouter les changements de client
document.getElementById('client').addEventListener('change', (e) => {
  console.log('Client modifié:', e.target.value);
});
```

## 📈 Évolutions Futures

### Améliorations Prévues
- **Recherche floue** : Correction automatique des fautes de frappe
- **Historique** : Mémorisation des dernières recherches
- **Autocomplétion** : Suggestions pendant la saisie
- **Export/Import** : Gestion de plusieurs bases de données
- **API REST** : Interface pour mise à jour dynamique

### Intégrations Possibles
- **Base de données** : Connexion directe à une DB
- **CRM** : Synchronisation avec systèmes externes
- **Analytics** : Suivi des recherches les plus fréquentes

---

*Module développé pour optimiser la saisie et réduire les erreurs dans le formulaire de checklist de déploiement.* 