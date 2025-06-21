Sur @render.com j'ai un projet "DELIVERY", en environnement de "PRODUCTION", qui contient les services  
Postgrest_io (PostgresSQL 16), OptimExCo (Node) et tlibouban.github.io (static)
J'ai besoin d'utiliser la base de données (Postgrest_io) pour stocker des informations saisie dans le service static (tlibouban.github.io)
J'ai besoin d'un schéma fin de comprendre les flux de données entre les services.

DATABASER_URL=postgresql://tristan:n0M5hjSRolnNjTx5WF12PUESD3zIqtgw@dpg-d1b9upgdl3ps73ef3lc0-a/db_delivery_ho2n



4. Points à valider / informations manquantes
    4.1 Le front capture-t-il plusieurs « demandes » par client (devis, panier) ?
    **-> Oui, il capture plusieurs demandes par client (devis, panier)**

    4.2 Souhaitez-vous gérer des « sessions » programmées ou juste un catalogue + devis ?
    **-> Juste un catalogue + devis**

    4.3 Les équipes commerciales/formation/techniques doivent-elles être historisées (périmètre dans le temps) ?
    **-> Oui, elles doivent être historisées (périmètre dans le temps)**

    4.4 Avez-vous des exports comptables/facturation à prévoir (taux TVA, règlements, etc.) ?
    **-> Oui, j'ai des exports comptables/facturation à prévoir (taux TVA, règlements, etc.)**

    4.5 Volume estimé (nombre de clients, sessions/an) ? -> dimensionnement index & partitions.
    **-> Volume estimé (600 cabinets par an : à peu près 6000 clients par an donc, 12000 sessions/an)**
