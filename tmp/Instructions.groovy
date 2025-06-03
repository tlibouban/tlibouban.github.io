1. Dans le header, au niveau des calculs des heures, il faut ajouter la présence des heures de paramétrage, lorsque celles-ci sont validées. Comme je te l'ai déjà demandé. Cela donnerait ceci :
    `43h00 (dont 7h00 de paramétrage)`
    `6.5 journées (dont 1 journée de paramétrage)`
    `12.5 demi-journées (dont 2 demi-journées de paramétrage)`

2. Il faut également ajouter un calcul pour connaitre le nombre de formateurs nécessaires au déploiement.
    l'idée étant de déployer le client le plus rapidement possible.
    une à deux semaines sont généralement nécessaires pour le déploiement.
    Lorsque le paramétrage est présent, il faudra compter, par formateur, 4 jours de formation dispensée la première semaine. 5 jours les semaines suivantes.
    Il faudra tenir compte de ces éléments pour tes calculs.
    A l'exclusion de la "Validation des connaissances" qui intervient généralementun mois après le déploiement initial. Et qui ne nécessite que rarement la venue de plusieurs formateurs, à moins que cela dépasse la durée d'une semaine.
    On peut prendre un exemple :
        128h de formation
        18.5 jours
        37 demi-journées

        Si on décide de faire un déploiement en 1 semaine, il faudra n formateurs.
        Si on décide de faire un déploiement en 2 semaines, il faudra n formateurs.

    

3. Les déploiments à distance peuvent aussi être proposés, si l'effectif est < 8. Il faudra pouvoir activer cette option, au dessur de la sectio "PARAMETRAGE". Dans la même section que le "CSM" dont je parle plus loin.
    Si l'effectif était effectivement inférieur à 8, il faudra proposer un affichage d'une formation à distance ou d'une formation sur site.

4. Il faudrait faire apparaitre l'équipe de formation en charge du déploiement. Un peu dans le même principe que l'équipe commercialeEt dans la même zone peut être en dessous de l'équipe commerciale, car l'équipe formation intervient après. Il faud pouvoir afficher Les formateurs qui potentiellement intervien Pour ce déploiement
    Prénom, Nom :
    Zone :
    Spécialité : ADAPPS, NEO, AIR.
    Email :

    Prévois 12 formateAveAvec un mélange équitable d'hommes femmes avec.Avec les mêmes zones plus ou moins que les commerciaEsEst réparti sur le territoire de la même manière que.Euh que les cabinets d'avocats, c'est à dire certainement plus sur la région parisienne, et cetera. Tu as compris la logique


6. Il faut trouver le moyen d'afficher un warning, lorsque l'effectif du cabinet est supérieur à 20, que la présence d'un CSM (Customer Success Manager) peut être nécessaire.
    Du reste, il faudra pouvoir activer cette option CSM, au dessur de la sectio "PARAMETRAGE". Je pense du coup, que le warning pourrait s'afficher par ici. Comme les autres warning du formulair : Si l'effectif > 20, alors le warning apparaît.

7. Dans les filtres, dans le header, il faut ajouter un filtre sur les checkbox non-examinées, refusées et activées.

8. Dans <div class="commercial-team-content">, il faut ajouter un lien afin de pouvoir appeler directement le numéro de téléphone du commercial.

9. Dans le décompte des jours de formation dans le header, il faudrait arrondir À chaque moitié supérieure Par exemple, si c'est 18,3 Mettre 18,5 et sir c'est 18,7 Mettre 19.