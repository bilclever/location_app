# Premium Plan - Backend + Frontend

## 1) Backend (Supabase)

A migration SQL est fournie dans:
`supabase/migrations/20260308_premium_plan.sql`

### Contenu backend ajoute

- Gestion patrimoine:
  - `premium_categories`
  - `premium_appartement_types`
  - `premium_biens`
- Gestion locataires et baux:
  - `premium_locataires`
  - `premium_baux`
- Comptabilite:
  - `premium_ecritures_comptables`
  - `premium_payments`
  - `premium_balance_view`
- Securite/RGPD:
  - Chiffrement des champs sensibles via `premium_encrypt_text` / `premium_decrypt_text`
  - Purge RGPD via `premium_purge_locataire_data`
- Securite financiere:
  - `premium_payments_audit_logs`
  - Trigger d audit sur insert/update/delete paiement
- Automatisation:
  - Trigger `trg_premium_payment_to_revenue` pour creer une ecriture de revenu lors d un paiement
- RLS:
  - Policies owner-only sur toutes les tables premium

## 2) Frontend (React)

### Nouveaux fichiers

- `src/services/premium.js`
- `src/hooks/usePremium.js`
- `src/components/premium/PremiumWorkspace.jsx`
- `src/pages/PremiumPage.jsx`

### Integration navigation/routes

- Route privee: `/premium`
- Onglet `Premium` dans le dashboard
- Lien `Premium` dans le header utilisateur connecte

### Fonctionnalites ajoutees

- Patrimoine:
  - CRUD categorie
  - CRUD type appartement (studio, chambre salon, palais, suite...)
  - Creation fiche bien (adresse, description, equipements, loyer HC, charges, geolocalisation, statut)
- Locations & locataires:
  - Creation dossier locataire (identite, profession, garant, historique)
  - Creation bail numerique (entree/sortie, revision annuelle, depot)
- Comptabilite:
  - Saisie revenus/depenses
  - Affichage resume revenus/depenses/benefice net
- Conformite:
  - Action de purge RGPD (locataire)
  - Affichage des logs d audit paiement
- Accessibilite:
  - Mise en page responsive mobile pour toutes les sections premium

## 3) Endpoints API attendus

Le frontend consomme les endpoints suivants:

- `GET/POST /premium/categories/`
- `PUT/DELETE /premium/categories/{id}/`
- `GET/POST /premium/appartement-types/`
- `DELETE /premium/appartement-types/{id}/`
- `GET/POST /premium/biens/`
- `PUT/DELETE /premium/biens/{id}/`
- `GET/POST /premium/locataires/`
- `PUT /premium/locataires/{id}/`
- `GET/POST /premium/baux/`
- `GET/POST /premium/comptabilite/ecritures/`
- `GET /premium/dashboard/`
- `GET /premium/payments/audit-logs/`
- `POST /premium/rgpd/purge/`

Si votre backend est 100% Supabase, mappez ces endpoints vers vos RPC/tables ou adaptez `src/services/premium.js`.
