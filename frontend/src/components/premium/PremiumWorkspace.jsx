import React, { useMemo, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatters } from '../../utils/formatters';
import {
  BIEN_CATEGORIES,
  BIEN_STATUT_OPTIONS,
  COMPTA_ENTRY_TYPES,
  DEFAULT_APPARTEMENT_TYPES,
} from '../../utils/constants';
import {
  useCreatePremiumBail,
  useCreatePremiumBien,
  useCreatePremiumCategory,
  useCreatePremiumComptaEntry,
  useCreatePremiumLocataire,
  useCreatePremiumPayment,
  useCreatePremiumType,
  usePremiumAuditLogs,
  usePremiumBaux,
  usePremiumBiens,
  usePremiumCategories,
  usePremiumComptaEntries,
  usePremiumDashboard,
  usePremiumLocataires,
  usePremiumPayments,
  usePremiumAppartementTypes,
  usePurgePremiumLocataireData,
} from '../../hooks/usePremium';

const sanitizeCode = (value) => value.trim().toUpperCase().replace(/\s+/g, '_');

const extractResults = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

const PremiumWorkspace = () => {
  const { data: dashboard, isLoading: dashboardLoading } = usePremiumDashboard();
  const { data: categoriesData, isLoading: categoriesLoading } = usePremiumCategories();
  const { data: appartementTypesData, isLoading: typesLoading } = usePremiumAppartementTypes();
  const { data: biensData, isLoading: biensLoading } = usePremiumBiens();
  const { data: locatairesData, isLoading: locatairesLoading } = usePremiumLocataires();
  const { data: bauxData, isLoading: bauxLoading } = usePremiumBaux();
  const { data: comptaData, isLoading: comptaLoading } = usePremiumComptaEntries({ page_size: 8 });
  const { data: auditLogsData, isLoading: auditLoading } = usePremiumAuditLogs();
  const { data: paymentsData, isLoading: paymentsLoading } = usePremiumPayments();

  const createCategoryMutation = useCreatePremiumCategory();
  const createTypeMutation = useCreatePremiumType();
  const createBienMutation = useCreatePremiumBien();
  const createLocataireMutation = useCreatePremiumLocataire();
  const createBailMutation = useCreatePremiumBail();
  const createComptaMutation = useCreatePremiumComptaEntry();
  const createPaymentMutation = useCreatePremiumPayment();
  const purgeDataMutation = usePurgePremiumLocataireData();

  const categories = useMemo(() => {
    const apiCategories = extractResults(categoriesData);
    if (apiCategories.length > 0) return apiCategories;
    return BIEN_CATEGORIES.map((item) => ({ id: item.code, code: item.code, label: item.label }));
  }, [categoriesData]);

  const appartementTypes = useMemo(() => {
    const apiTypes = extractResults(appartementTypesData);
    if (apiTypes.length > 0) return apiTypes;
    return DEFAULT_APPARTEMENT_TYPES.map((item) => ({ id: item.code, code: item.code, label: item.label }));
  }, [appartementTypesData]);

  const biens = extractResults(biensData);
  const locataires = extractResults(locatairesData);
  const baux = extractResults(bauxData);
  const comptaEntries = extractResults(comptaData);
  const auditLogs = extractResults(auditLogsData);
  const payments = extractResults(paymentsData);

  const [newCategory, setNewCategory] = useState({ code: '', label: '' });
  const [newType, setNewType] = useState({ code: '', label: '' });
  const [newBien, setNewBien] = useState({
    titre: '',
    adresse: '',
    description: '',
    category: '',
    appartement_type: '',
    loyer_hc: '',
    charges: '',
    equipements: '',
    latitude: '',
    longitude: '',
    statut: 'VACANT',
  });
  const [newLocataire, setNewLocataire] = useState({
    nom: '',
    prenoms: '',
    email: '',
    telephone: '',
    date_naissance: '',
    profession: '',
    piece_identite: '',
    garant: '',
  });
  const [newBail, setNewBail] = useState({
    bien: '',
    locataire: '',
    date_entree: '',
    date_sortie: '',
    revision_annuelle: '0',
    depot_garantie: '',
  });
  const [newEntry, setNewEntry] = useState({
    bien: '',
    type_ecriture: 'REVENU',
    libelle: '',
    categorie: '',
    date_operation: '',
    montant: '',
  });
  const [selectedLocataireForPurge, setSelectedLocataireForPurge] = useState('');
  const [newPayment, setNewPayment] = useState({
    bail: '',
    date_paiement: '',
    periode_debut: '',
    periode_fin: '',
    montant: '',
    statut: 'PAYE',
  });

  const isLoading = dashboardLoading || categoriesLoading || typesLoading || biensLoading || locatairesLoading || bauxLoading || comptaLoading || auditLoading || paymentsLoading;

  const financialSummary = dashboard?.comptabilite || {};
  const patrimoineSummary = dashboard?.patrimoine || {};

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    await createCategoryMutation.mutateAsync({
      code: sanitizeCode(newCategory.code),
      label: newCategory.label.trim(),
    });
    setNewCategory({ code: '', label: '' });
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    await createTypeMutation.mutateAsync({
      code: sanitizeCode(newType.code),
      label: newType.label.trim(),
    });
    setNewType({ code: '', label: '' });
  };

  const handleCreateBien = async (e) => {
    e.preventDefault();
    await createBienMutation.mutateAsync({
      ...newBien,
      loyer_hc: Number(newBien.loyer_hc || 0),
      charges: Number(newBien.charges || 0),
      equipements: newBien.equipements
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      latitude: newBien.latitude ? Number(newBien.latitude) : null,
      longitude: newBien.longitude ? Number(newBien.longitude) : null,
    });

    setNewBien({
      titre: '',
      adresse: '',
      description: '',
      category: '',
      appartement_type: '',
      loyer_hc: '',
      charges: '',
      equipements: '',
      latitude: '',
      longitude: '',
      statut: 'VACANT',
    });
  };

  const handleCreateLocataire = async (e) => {
    e.preventDefault();
    await createLocataireMutation.mutateAsync({ ...newLocataire });
    setNewLocataire({
      nom: '',
      prenoms: '',
      email: '',
      telephone: '',
      date_naissance: '',
      profession: '',
      piece_identite: '',
      garant: '',
    });
  };

  const handleCreateBail = async (e) => {
    e.preventDefault();
    await createBailMutation.mutateAsync({
      ...newBail,
      revision_annuelle: Number(newBail.revision_annuelle || 0),
      depot_garantie: Number(newBail.depot_garantie || 0),
    });
    setNewBail({
      bien: '',
      locataire: '',
      date_entree: '',
      date_sortie: '',
      revision_annuelle: '0',
      depot_garantie: '',
    });
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    await createComptaMutation.mutateAsync({
      ...newEntry,
      montant: Number(newEntry.montant || 0),
    });
    setNewEntry({
      bien: '',
      type_ecriture: 'REVENU',
      libelle: '',
      categorie: '',
      date_operation: '',
      montant: '',
    });
  };

  const handlePurge = async () => {
    if (!selectedLocataireForPurge) {
      return;
    }
    await purgeDataMutation.mutateAsync(selectedLocataireForPurge);
    setSelectedLocataireForPurge('');
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    await createPaymentMutation.mutateAsync({
      ...newPayment,
      montant: Number(newPayment.montant || 0),
    });

    setNewPayment({
      bail: '',
      date_paiement: '',
      periode_debut: '',
      periode_fin: '',
      montant: '',
      statut: 'PAYE',
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="premium-page">
      <div className="premium-header">
        <h2>Plan Premium</h2>
        <p>Patrimoine, baux numeriques, comptabilite et conformite RGPD.</p>
      </div>

      <section className="premium-grid premium-summary-grid">
        <article className="premium-card">
          <h3>Patrimoine</h3>
          <p>Total biens: <strong>{patrimoineSummary.total_biens || biens.length}</strong></p>
          <p>Loues: <strong>{patrimoineSummary.loues || 0}</strong></p>
          <p>Vacants: <strong>{patrimoineSummary.vacants || 0}</strong></p>
          <p>En travaux: <strong>{patrimoineSummary.travaux || 0}</strong></p>
        </article>
        <article className="premium-card">
          <h3>Comptabilite</h3>
          <p>Revenus: <strong>{formatters.price(financialSummary.revenus || 0)}</strong></p>
          <p>Depenses: <strong>{formatters.price(financialSummary.depenses || 0)}</strong></p>
          <p>Benefice net: <strong>{formatters.price(financialSummary.benefice_net || 0)}</strong></p>
        </article>
        <article className="premium-card">
          <h3>Securite financiere</h3>
          <p>Audit logs paiements: <strong>{auditLogs.length}</strong></p>
          <p>Derniere action: <strong>{auditLogs[0]?.action || 'Aucune'}</strong></p>
        </article>
      </section>

      <section className="premium-grid premium-two-col">
        <article className="premium-card">
          <h3>Categories de biens</h3>
          <form onSubmit={handleCreateCategory} className="premium-inline-form">
            <input
              type="text"
              className="form-control"
              value={newCategory.label}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, label: e.target.value, code: prev.code || e.target.value }))}
              placeholder="Label (Maison, Bureau...)"
              required
            />
            <input
              type="text"
              className="form-control"
              value={newCategory.code}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Code"
              required
            />
            <button className="btn btn-primary" type="submit">Ajouter</button>
          </form>
          <ul className="premium-list">
            {categories.map((category) => (
              <li key={category.id}>{category.label}</li>
            ))}
          </ul>
        </article>

        <article className="premium-card">
          <h3>Types d appartement</h3>
          <form onSubmit={handleCreateType} className="premium-inline-form">
            <input
              type="text"
              className="form-control"
              value={newType.label}
              onChange={(e) => setNewType((prev) => ({ ...prev, label: e.target.value, code: prev.code || e.target.value }))}
              placeholder="Studio, Suite..."
              required
            />
            <input
              type="text"
              className="form-control"
              value={newType.code}
              onChange={(e) => setNewType((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Code"
              required
            />
            <button className="btn btn-primary" type="submit">Ajouter</button>
          </form>
          <ul className="premium-list">
            {appartementTypes.map((type) => (
              <li key={type.id}>{type.label}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="premium-card">
        <h3>Fiche Bien</h3>
        <form className="premium-grid premium-form-grid" onSubmit={handleCreateBien}>
          <input className="form-control" placeholder="Titre" value={newBien.titre} onChange={(e) => setNewBien((prev) => ({ ...prev, titre: e.target.value }))} required />
          <input className="form-control" placeholder="Adresse" value={newBien.adresse} onChange={(e) => setNewBien((prev) => ({ ...prev, adresse: e.target.value }))} required />
          <textarea className="form-control" placeholder="Description" value={newBien.description} onChange={(e) => setNewBien((prev) => ({ ...prev, description: e.target.value }))} rows={3} />

          <select className="form-control" value={newBien.category} onChange={(e) => setNewBien((prev) => ({ ...prev, category: e.target.value }))} required>
            <option value="">Categorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>

          <select className="form-control" value={newBien.appartement_type} onChange={(e) => setNewBien((prev) => ({ ...prev, appartement_type: e.target.value }))} required>
            <option value="">Type appartement</option>
            {appartementTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          <select className="form-control" value={newBien.statut} onChange={(e) => setNewBien((prev) => ({ ...prev, statut: e.target.value }))}>
            {BIEN_STATUT_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <input className="form-control" type="number" min="0" placeholder="Loyer HC" value={newBien.loyer_hc} onChange={(e) => setNewBien((prev) => ({ ...prev, loyer_hc: e.target.value }))} required />
          <input className="form-control" type="number" min="0" placeholder="Charges" value={newBien.charges} onChange={(e) => setNewBien((prev) => ({ ...prev, charges: e.target.value }))} required />
          <input className="form-control" placeholder="Equipements separes par virgule" value={newBien.equipements} onChange={(e) => setNewBien((prev) => ({ ...prev, equipements: e.target.value }))} />
          <input className="form-control" placeholder="Latitude" value={newBien.latitude} onChange={(e) => setNewBien((prev) => ({ ...prev, latitude: e.target.value }))} />
          <input className="form-control" placeholder="Longitude" value={newBien.longitude} onChange={(e) => setNewBien((prev) => ({ ...prev, longitude: e.target.value }))} />

          <button className="btn btn-primary" type="submit">Enregistrer le bien</button>
        </form>

        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Bien</th>
                <th>Categorie</th>
                <th>Type</th>
                <th>Loyer HC</th>
                <th>Charges</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {biens.map((bien) => (
                <tr key={bien.id}>
                  <td>{bien.titre}</td>
                  <td>{bien.category_label || bien.category?.label || '-'}</td>
                  <td>{bien.appartement_type_label || bien.appartement_type?.label || '-'}</td>
                  <td>{formatters.price(bien.loyer_hc || 0)}</td>
                  <td>{formatters.price(bien.charges || 0)}</td>
                  <td>{bien.statut || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="premium-grid premium-two-col">
        <article className="premium-card">
          <h3>Dossier Locataire</h3>
          <form className="premium-grid premium-form-grid" onSubmit={handleCreateLocataire}>
            <input className="form-control" placeholder="Nom" value={newLocataire.nom} onChange={(e) => setNewLocataire((prev) => ({ ...prev, nom: e.target.value }))} required />
            <input className="form-control" placeholder="Prenoms" value={newLocataire.prenoms} onChange={(e) => setNewLocataire((prev) => ({ ...prev, prenoms: e.target.value }))} required />
            <input className="form-control" type="email" placeholder="Email" value={newLocataire.email} onChange={(e) => setNewLocataire((prev) => ({ ...prev, email: e.target.value }))} required />
            <input className="form-control" placeholder="Telephone" value={newLocataire.telephone} onChange={(e) => setNewLocataire((prev) => ({ ...prev, telephone: e.target.value }))} />
            <input className="form-control" type="date" placeholder="Date de naissance" value={newLocataire.date_naissance} onChange={(e) => setNewLocataire((prev) => ({ ...prev, date_naissance: e.target.value }))} />
            <input className="form-control" placeholder="Profession" value={newLocataire.profession} onChange={(e) => setNewLocataire((prev) => ({ ...prev, profession: e.target.value }))} />
            <input className="form-control" placeholder="Piece identite" value={newLocataire.piece_identite} onChange={(e) => setNewLocataire((prev) => ({ ...prev, piece_identite: e.target.value }))} />
            <input className="form-control" placeholder="Garant" value={newLocataire.garant} onChange={(e) => setNewLocataire((prev) => ({ ...prev, garant: e.target.value }))} />
            <button className="btn btn-primary" type="submit">Creer le dossier</button>
          </form>

          <div className="premium-compact-list">
            {locataires.map((locataire) => (
              <div className="premium-compact-item" key={locataire.id}>
                <strong>{locataire.nom} {locataire.prenoms}</strong>
                <span>{locataire.email}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="premium-card">
          <h3>Bail numerique</h3>
          <form className="premium-grid premium-form-grid" onSubmit={handleCreateBail}>
            <select className="form-control" value={newBail.bien} onChange={(e) => setNewBail((prev) => ({ ...prev, bien: e.target.value }))} required>
              <option value="">Bien</option>
              {biens.map((bien) => (
                <option key={bien.id} value={bien.id}>{bien.titre}</option>
              ))}
            </select>

            <select className="form-control" value={newBail.locataire} onChange={(e) => setNewBail((prev) => ({ ...prev, locataire: e.target.value }))} required>
              <option value="">Locataire</option>
              {locataires.map((locataire) => (
                <option key={locataire.id} value={locataire.id}>{locataire.nom} {locataire.prenoms}</option>
              ))}
            </select>

            <input className="form-control" type="date" value={newBail.date_entree} onChange={(e) => setNewBail((prev) => ({ ...prev, date_entree: e.target.value }))} required />
            <input className="form-control" type="date" value={newBail.date_sortie} onChange={(e) => setNewBail((prev) => ({ ...prev, date_sortie: e.target.value }))} />
            <input className="form-control" type="number" step="0.01" value={newBail.revision_annuelle} onChange={(e) => setNewBail((prev) => ({ ...prev, revision_annuelle: e.target.value }))} placeholder="Revision annuelle (%)" />
            <input className="form-control" type="number" min="0" value={newBail.depot_garantie} onChange={(e) => setNewBail((prev) => ({ ...prev, depot_garantie: e.target.value }))} placeholder="Depot de garantie" />
            <button className="btn btn-primary" type="submit">Creer le bail</button>
          </form>

          <div className="premium-compact-list">
            {baux.map((bail) => (
              <div className="premium-compact-item" key={bail.id}>
                <strong>{bail.bien_titre || bail.bien?.titre || 'Bien'}</strong>
                <span>{formatters.date(bail.date_entree)} - {bail.date_sortie ? formatters.date(bail.date_sortie) : 'en cours'}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="premium-grid premium-two-col">
        <article className="premium-card">
          <h3>Module Comptabilite</h3>
          <form className="premium-grid premium-form-grid" onSubmit={handleCreateEntry}>
            <select className="form-control" value={newEntry.type_ecriture} onChange={(e) => setNewEntry((prev) => ({ ...prev, type_ecriture: e.target.value }))}>
              {COMPTA_ENTRY_TYPES.map((entryType) => (
                <option key={entryType.value} value={entryType.value}>{entryType.label}</option>
              ))}
            </select>

            <select className="form-control" value={newEntry.bien} onChange={(e) => setNewEntry((prev) => ({ ...prev, bien: e.target.value }))} required>
              <option value="">Bien</option>
              {biens.map((bien) => (
                <option key={bien.id} value={bien.id}>{bien.titre}</option>
              ))}
            </select>

            <input className="form-control" placeholder="Libelle" value={newEntry.libelle} onChange={(e) => setNewEntry((prev) => ({ ...prev, libelle: e.target.value }))} required />
            <input className="form-control" placeholder="Categorie (Travaux, Taxe...)" value={newEntry.categorie} onChange={(e) => setNewEntry((prev) => ({ ...prev, categorie: e.target.value }))} />
            <input className="form-control" type="date" value={newEntry.date_operation} onChange={(e) => setNewEntry((prev) => ({ ...prev, date_operation: e.target.value }))} required />
            <input className="form-control" type="number" min="0" placeholder="Montant" value={newEntry.montant} onChange={(e) => setNewEntry((prev) => ({ ...prev, montant: e.target.value }))} required />
            <button className="btn btn-primary" type="submit">Ajouter ecriture</button>
          </form>

          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Libelle</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {comptaEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatters.date(entry.date_operation)}</td>
                    <td>{entry.type_ecriture}</td>
                    <td>{entry.libelle}</td>
                    <td>{formatters.price(entry.montant || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="premium-card">
          <h3>Paiements loyers</h3>
          <form className="premium-grid premium-form-grid" onSubmit={handleCreatePayment}>
            <select className="form-control" value={newPayment.bail} onChange={(e) => setNewPayment((prev) => ({ ...prev, bail: e.target.value }))} required>
              <option value="">Bail</option>
              {baux.map((bail) => (
                <option key={bail.id} value={bail.id}>{bail.bien_titre || `Bail ${bail.id}`}</option>
              ))}
            </select>
            <input className="form-control" type="date" value={newPayment.date_paiement} onChange={(e) => setNewPayment((prev) => ({ ...prev, date_paiement: e.target.value }))} required />
            <input className="form-control" type="date" value={newPayment.periode_debut} onChange={(e) => setNewPayment((prev) => ({ ...prev, periode_debut: e.target.value }))} required />
            <input className="form-control" type="date" value={newPayment.periode_fin} onChange={(e) => setNewPayment((prev) => ({ ...prev, periode_fin: e.target.value }))} required />
            <input className="form-control" type="number" min="0" value={newPayment.montant} onChange={(e) => setNewPayment((prev) => ({ ...prev, montant: e.target.value }))} placeholder="Montant" required />
            <select className="form-control" value={newPayment.statut} onChange={(e) => setNewPayment((prev) => ({ ...prev, statut: e.target.value }))}>
              <option value="PAYE">PAYE</option>
              <option value="PARTIEL">PARTIEL</option>
              <option value="IMPAYE">IMPAYE</option>
            </select>
            <button className="btn btn-primary" type="submit">Enregistrer paiement</button>
          </form>

          <div className="premium-compact-list">
            {payments.slice(0, 8).map((payment) => (
              <div className="premium-compact-item" key={payment.id}>
                <strong>{formatters.price(payment.montant || 0)}</strong>
                <span>{payment.date_paiement} - {payment.statut}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="premium-card">
          <h3>RGPD & audit</h3>
          <p>
            Les champs sensibles du locataire doivent etre chiffres cote backend.
            La purge est autorisee uniquement apres la date de depart.
          </p>
          <div className="premium-inline-form">
            <select
              className="form-control"
              value={selectedLocataireForPurge}
              onChange={(e) => setSelectedLocataireForPurge(e.target.value)}
            >
              <option value="">Selectionner un locataire a purger</option>
              {locataires.map((locataire) => (
                <option key={locataire.id} value={locataire.id}>
                  {locataire.nom} {locataire.prenoms}
                </option>
              ))}
            </select>
            <button className="btn btn-outline" type="button" onClick={handlePurge}>
              Lancer la purge
            </button>
          </div>

          <h4>Audit Log Paiements</h4>
          <div className="premium-compact-list">
            {auditLogs.slice(0, 8).map((log) => (
              <div className="premium-compact-item" key={log.id}>
                <strong>{log.action}</strong>
                <span>{formatters.dateTime(log.changed_at)}</span>
              </div>
            ))}
            {auditLogs.length === 0 && <p>Aucun log disponible.</p>}
          </div>
        </article>
      </section>
    </div>
  );
};

export default PremiumWorkspace;
