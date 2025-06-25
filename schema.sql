-- PostgreSQL 16 – Schéma Delivery
-- ============================================================
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUMS
CREATE TYPE client_type AS ENUM ('Prospect','Client');
CREATE TYPE tri_state AS ENUM ('not_examined','rejected','activated');
CREATE TYPE devis_statut AS ENUM ('Brouillon','Envoye','Accepte','Refuse');
CREATE TYPE facture_statut AS ENUM ('Brouillon','Envoyee','Payee','Annulee');

-- TABLES
CREATE TABLE client (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  type client_type NOT NULL DEFAULT 'Prospect',
  erp TEXT,
  effectif INT,
  departement TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dossier (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES client(id) ON DELETE CASCADE,
  numero_dossier TEXT,
  projet TEXT,
  logiciel_base TEXT,
  sens TEXT,
  effectif_snapshot INT,
  departement_snapshot TEXT,
  logiciel_autre TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_dossier_updated
BEFORE UPDATE ON dossier
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE item_meta (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE,
  label TEXT NOT NULL,
  section TEXT,
  sous_section TEXT,
  item_type TEXT,
  default_minutes INT,
  default_prix_ht NUMERIC(10,2)
);

CREATE TABLE dossier_item (
  id SERIAL PRIMARY KEY,
  dossier_id INT REFERENCES dossier(id) ON DELETE CASCADE,
  item_meta_id INT REFERENCES item_meta(id) ON DELETE CASCADE,
  tri_state tri_state DEFAULT 'not_examined',
  quantity INT DEFAULT 1,
  minutes_override INT,
  prix_ht_override NUMERIC(10,2),
  extra JSONB DEFAULT '{}'::jsonb,
  UNIQUE(dossier_id,item_meta_id)
);

CREATE TABLE profil (
  id SERIAL PRIMARY KEY,
  dossier_id INT REFERENCES dossier(id) ON DELETE CASCADE,
  nom TEXT,
  nb_utilisateurs INT DEFAULT 0,
  tri_state_include tri_state,
  tri_state_modif tri_state
);

CREATE TABLE devis (
  id SERIAL PRIMARY KEY,
  dossier_id INT REFERENCES dossier(id) ON DELETE CASCADE,
  total_ht NUMERIC(12,2),
  total_ttc NUMERIC(12,2),
  statut devis_statut DEFAULT 'Brouillon',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE devis_ligne (
  id SERIAL PRIMARY KEY,
  devis_id INT REFERENCES devis(id) ON DELETE CASCADE,
  item_meta_id INT REFERENCES item_meta(id),
  quantity INT,
  prix_unitaire_ht NUMERIC(10,2),
  montant_ht NUMERIC(12,2)
);

CREATE TABLE equipe (
  id SERIAL PRIMARY KEY,
  libelle TEXT,
  type TEXT
);

CREATE TABLE utilisateur (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT,
  email TEXT UNIQUE,
  role TEXT
);

CREATE TABLE membre_equipe (
  equipe_id INT REFERENCES equipe(id) ON DELETE CASCADE,
  utilisateur_id UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
  debut DATE,
  fin DATE,
  PRIMARY KEY (equipe_id, utilisateur_id, debut)
);

CREATE TABLE affectation (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES client(id) ON DELETE CASCADE,
  equipe_id INT REFERENCES equipe(id) ON DELETE CASCADE,
  debut DATE NOT NULL,
  fin DATE
);

CREATE TABLE facture (
  id SERIAL PRIMARY KEY,
  devis_id INT REFERENCES devis(id),
  total_ht NUMERIC(12,2),
  tva NUMERIC(12,2),
  total_ttc NUMERIC(12,2),
  date_facture DATE,
  statut facture_statut DEFAULT 'Brouillon'
);

CREATE TABLE reglement (
  id SERIAL PRIMARY KEY,
  facture_id INT REFERENCES facture(id) ON DELETE CASCADE,
  montant NUMERIC(12,2),
  date_reglement DATE,
  mode_paiement TEXT
);

-- INDEXES
CREATE INDEX idx_client_nom_gin ON client USING gin (nom gin_trgm_ops);
CREATE INDEX idx_dossier_numero ON dossier(numero_dossier);
CREATE INDEX idx_item_meta_section ON item_meta(section);
CREATE INDEX idx_dossier_item_dossier ON dossier_item(dossier_id);
CREATE INDEX idx_dossier_item_meta ON dossier_item(item_meta_id);
CREATE INDEX idx_reglement_facture ON reglement(facture_id);

-- VIEWS
CREATE OR REPLACE VIEW v_exports_tva AS
SELECT f.id AS facture_id,
       f.date_facture,
       f.total_ht,
       f.tva,
       f.total_ttc,
       c.nom AS client,
       c.departement
FROM facture f
JOIN devis d ON d.id = f.devis_id
JOIN dossier ds ON ds.id = d.dossier_id
JOIN client c ON c.id = ds.client_id
WHERE f.statut = 'Payee';

CREATE OR REPLACE VIEW v_reglements AS
SELECT r.id,
       r.date_reglement,
       r.montant,
       r.mode_paiement,
       f.id AS facture_id,
       c.nom AS client
FROM reglement r
JOIN facture f ON f.id = r.facture_id
JOIN devis d ON d.id = f.devis_id
JOIN dossier ds ON ds.id = d.dossier_id
JOIN client c ON c.id = ds.client_id; 