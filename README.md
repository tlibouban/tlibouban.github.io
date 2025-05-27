# Checklist Paramétrage AIR NEO

Application web permettant de gérer les checklists de paramétrage des applications AIR et NEO.

## Description

Cet outil a été conçu pour faciliter le suivi et la gestion des paramétrages des applications AIR et NEO, en fournissant une interface intuitive pour les formateurs et les consultants.

## Fonctionnalités

- Gestion des profils utilisateurs
- Suivi des checklists de paramétrage
- Accès aux fiches de formation
- Interface responsive et intuitive
- Logo Septeo intégré pour une identité visuelle professionnelle

## Structure du projet

- `css/` - Fichiers de style
- `csv/` - Données au format CSV
- `Fiches formations/` - Documents PDF de support pour les formations (ignoré par Git)
- `img/` - Ressources images
- `js/` - Scripts JavaScript pour la logique applicative

## Installation

1. Clonez ce dépôt

```bash
git clone https://github.com/tlibouban/tlibouban.github.io.git
```

2. Ouvrez le fichier `index.html` dans votre navigateur

Aucune dépendance externe n'est nécessaire, l'application fonctionne directement dans le navigateur.

## Utilisation

Ouvrez `index.html` dans votre navigateur pour accéder à l'interface principale de l'application. Sélectionnez un profil utilisateur et suivez les étapes de paramétrage recommandées.

## Notes de développement

### Gestion des fichiers de formation

Le répertoire `Fiches formations/` contient des documents PDF sensibles qui ne doivent pas être versionnés publiquement. Ce répertoire est configuré dans `.gitignore` pour :
- Protéger la confidentialité des documents de formation
- Éviter l'encombrement du repository avec des fichiers binaires volumineux
- Permettre un développement local avec accès aux fiches tout en maintenant un repository propre

### Configuration Git

Les fichiers suivants sont ignorés par Git :
- `Fiches formations/` - Documents de formation confidentiels
- Fichiers systèmes (`.DS_Store`, `Thumbs.db`)
- Fichiers d'environnement et de configuration IDE

### Branding et identité visuelle

L'application intègre le logo officiel Septeo depuis le [site web Septeo](https://www.septeo.com/fr) pour maintenir une cohérence avec l'identité visuelle de l'entreprise. Le logo est affiché de manière responsive dans l'en-tête de l'application.

### Évolutions de la terminologie

La section précédemment appelée "TRONC COMMUN" a été renommée "Paramétrage" pour une meilleure clarté et cohérence terminologique. Cette modification affecte :
- Les titres de sections dans l'interface
- Les identifiants et attributs `data-section` 
- Les références dans le code JavaScript
- La documentation et les commentaires

### Améliorations techniques récentes

- **Correction du bouton de fermeture de la modal** : Ajout d'une gestion d'erreur robuste et de gestionnaires de secours pour assurer le bon fonctionnement de la fermeture de la modal de gestion des profils
- **Gestion d'erreurs JavaScript** : Implémentation de try-catch pour prévenir les erreurs d'initialisation
- **Handlers de secours** : Mécanisme de fallback pour garantir la fonctionnalité même en cas de problème d'initialisation
- **Restauration du tableau de gestion des profils** : Correction du problème de casse qui empêchait l'affichage du tableau des profils utilisateurs dans la section Paramétrage après le renommage de "TRONC COMMUN"
- **Robustesse du code** : Ajout d'une fonction helper `isSectionNamed()` pour centraliser les comparaisons de noms de sections et éviter les problèmes futurs lors de modifications de terminologie

## Contact

Pour toute question concernant cet outil, veuillez contacter l'équipe de formation SEPTEO.

## Licence

© SEPTEO - Tous droits réservés
