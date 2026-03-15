import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatters } from '../../utils/formatters';
import { useAppartements, useAppartementLocations } from '../../hooks/useAppartements';
import { useLocations } from '../../hooks/useLocations';
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

const DOCUMENT_URL_FIELDS = [
  'document_url',
  'url_document',
  'pdf_url',
  'url_pdf',
  'bail_pdf',
  'bail_pdf_url',
  'contrat_url',
  'fichier_url',
  'file_url',
  'piece_identite_url',
  'piece_identite_document_url',
];

const isLikelyUrl = (value) => typeof value === 'string' && /^(https?:\/\/|\/)/i.test(value.trim());

const extractDocumentUrl = (entity = {}) => {
  for (const field of DOCUMENT_URL_FIELDS) {
    const value = entity?.[field];
    if (isLikelyUrl(value)) {
      return value.trim();
    }
  }

  if (isLikelyUrl(entity?.document)) {
    return entity.document.trim();
  }

  if (isLikelyUrl(entity?.fichier)) {
    return entity.fichier.trim();
  }

  if (isLikelyUrl(entity?.piece_identite)) {
    return entity.piece_identite.trim();
  }

  return '';
};

const extractFileNameFromUrl = (url = '') => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const withoutQuery = url.split('?')[0].split('#')[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  const rawFileName = segments.length > 0 ? segments[segments.length - 1] : '';

  if (!rawFileName) {
    return '';
  }

  try {
    return decodeURIComponent(rawFileName);
  } catch (_error) {
    return rawFileName;
  }
};

const toSlug = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const normalizeText = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const normalizePhone = (value = '') => value.toString().replace(/\D/g, '');

const findAssociatedAppartement = (bien, appartements = []) => {
  if (!bien) {
    return null;
  }

  const bienId = bien?.id !== undefined && bien?.id !== null ? String(bien.id) : '';
  const bienTitle = normalizeText(bien?.titre || '');
  const bienCity = normalizeText(bien?.ville || bien?.appartement_ville || '');
  const bienSlugCandidates = new Set(
    [bien?.appartement_slug, bien?.appartement?.slug, bien?.slug, toSlug(bien?.titre || '')]
      .filter(Boolean)
      .map((value) => String(value))
  );

  return appartements.find((appartement) => {
    const appartementBienId = typeof appartement?.bien === 'object' && appartement?.bien !== null
      ? String(appartement.bien.id)
      : (appartement?.bien !== undefined && appartement?.bien !== null ? String(appartement.bien) : '');
    const appartementSlug = appartement?.slug ? String(appartement.slug) : '';
    const sameLinkedBien = bienId && appartementBienId && appartementBienId === bienId;
    const sameSlug = appartementSlug && bienSlugCandidates.has(appartementSlug);
    const sameTitle = bienTitle && normalizeText(appartement?.titre || '') === bienTitle;
    const sameCity = !bienCity || normalizeText(appartement?.ville || '') === bienCity;

    return sameLinkedBien || sameSlug || (sameTitle && sameCity);
  }) || null;
};

const splitFullName = (value = '') => {
  const [nom = '', ...prenoms] = value.trim().split(/\s+/).filter(Boolean);
  return {
    nom,
    prenoms: prenoms.join(' '),
  };
};

const buildReservationRequestKey = (reservation = {}) => [
  reservation?.id,
  reservation?.emailLocataire || '',
  reservation?.telephoneLocataire || '',
  reservation?.dateDebut || '',
  reservation?.dateFin || '',
].join('::');

const findMatchingLocataireId = (reservation, locataires) => {
  if (!reservation) {
    return '';
  }

  const reservationEmail = normalizeText(reservation.emailLocataire);
  const reservationPhone = normalizePhone(reservation.telephoneLocataire);
  const reservationName = normalizeText(reservation.nomLocataire);

  const matchedLocataire = locataires.find((locataire) => {
    const locataireEmail = normalizeText(locataire?.email);
    const locatairePhone = normalizePhone(locataire?.telephone);
    const locataireName = normalizeText([locataire?.nom, locataire?.prenoms].filter(Boolean).join(' '));

    return (
      (reservationEmail && locataireEmail && reservationEmail === locataireEmail)
      || (reservationPhone && locatairePhone && reservationPhone === locatairePhone)
      || (reservationName && locataireName && reservationName === locataireName)
    );
  });

  return matchedLocataire ? String(matchedLocataire.id) : '';
};

const isIsoDateString = (value = '') => /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());

const buildLocatairePayload = (locataire = {}) => {
  const payload = {
    nom: locataire.nom,
    prenoms: locataire.prenoms,
    email: locataire.email,
    telephone: locataire.telephone,
    profession: locataire.profession,
    piece_identite: locataire.piece_identite,
    garant: locataire.garant,
  };

  if (isIsoDateString(locataire.date_naissance)) {
    payload.date_naissance = String(locataire.date_naissance).trim();
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
  );
};

const extractApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data[0] || fallbackMessage;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
  if (firstFieldError) {
    return firstFieldError[0];
  }

  return fallbackMessage;
};

const PremiumWorkspace = () => {
  const navigate = useNavigate();
  const bienScopeParams = useMemo(() => ({}), []);
  const { data: appartementsData } = useAppartements({ page_size: 500 });

  const { data: dashboard, isLoading: dashboardLoading } = usePremiumDashboard(bienScopeParams);
  const { data: categoriesData, isLoading: categoriesLoading } = usePremiumCategories();
  const { data: appartementTypesData, isLoading: typesLoading } = usePremiumAppartementTypes();
  const { data: biensData, isLoading: biensLoading } = usePremiumBiens();
  const locatairesParams = useMemo(() => ({ page_size: 500 }), []);
  const { data: locatairesData, isLoading: locatairesLoading } = usePremiumLocataires(locatairesParams);
  const { data: bauxData, isLoading: bauxLoading } = usePremiumBaux(bienScopeParams);
  const comptaParams = useMemo(() => ({ page_size: 8, ...bienScopeParams }), [bienScopeParams]);
  const { data: comptaData, isLoading: comptaLoading } = usePremiumComptaEntries(comptaParams);
  const { data: auditLogsData, isLoading: auditLoading } = usePremiumAuditLogs();
  const { data: paymentsData, isLoading: paymentsLoading } = usePremiumPayments(bienScopeParams);
  const locationsParams = useMemo(() => ({ page_size: 500 }), []);
  const { data: locationsData, isLoading: locationsLoading } = useLocations(locationsParams);

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
  const locations = useMemo(() => locationsData?.results || [], [locationsData]);
  const appartements = useMemo(() => appartementsData?.results || [], [appartementsData]);

  const locataireNameById = useMemo(() => {
    const map = new Map();
    locataires.forEach((locataire) => {
      const fullName = [locataire?.nom, locataire?.prenoms].filter(Boolean).join(' ').trim() || `Locataire #${locataire?.id}`;
      map.set(String(locataire.id), fullName);
    });
    return map;
  }, [locataires]);

  const premiumDocuments = useMemo(() => {
    const locationBailDocuments = locations
      .filter((location) => Boolean(location?.bailPdfUrl))
      .map((location) => ({
        id: `location-bail-${location.id}`,
        type: 'Bail numerique',
        titre: location?.appartementTitre || `Bail location #${location.id}`,
        locataire: location?.nomLocataire || location?.emailLocataire || '-',
        date: location?.dateConfirmation || location?.dateReservation || '',
        url: location?.bailPdfUrl,
        reference: '',
      }));

    const bailDocuments = baux.map((bail) => {
      const locataireId = typeof bail?.locataire === 'object' && bail?.locataire !== null
        ? bail.locataire.id
        : bail?.locataire;

      const locataireName = bail?.locataire_nom
        || bail?.locataire_name
        || (typeof bail?.locataire === 'object' ? [bail.locataire?.nom, bail.locataire?.prenoms].filter(Boolean).join(' ') : '')
        || locataireNameById.get(String(locataireId))
        || '-';

      return {
        id: `bail-${bail.id}`,
        type: 'Bail numerique',
        titre: bail?.bien_titre || bail?.bien?.titre || `Bail #${bail.id}`,
        locataire: locataireName,
        date: bail?.created_at || bail?.updated_at || bail?.date_entree || '',
        url: extractDocumentUrl(bail),
        reference: '',
      };
    });

    const identityDocuments = locataires
      .filter((locataire) => Boolean(locataire?.piece_identite) || Boolean(extractDocumentUrl(locataire)))
      .map((locataire) => {
        const pieceIdentite = (locataire?.piece_identite || '').toString().trim();
        const documentUrl = extractDocumentUrl(locataire);

        return {
          id: `locataire-piece-${locataire.id}`,
          type: 'Piece identite',
          titre: [locataire?.nom, locataire?.prenoms].filter(Boolean).join(' ').trim() || `Locataire #${locataire.id}`,
          locataire: [locataire?.nom, locataire?.prenoms].filter(Boolean).join(' ').trim() || '-',
          date: locataire?.updated_at || locataire?.created_at || '',
          url: documentUrl,
          reference: !documentUrl && pieceIdentite && !isLikelyUrl(pieceIdentite) ? pieceIdentite : '',
        };
      });

    const mergedDocuments = [...locationBailDocuments, ...bailDocuments, ...identityDocuments];
    const deduplicatedByUrl = [];
    const seenUrls = new Set();

    mergedDocuments.forEach((documentItem) => {
      const normalizedUrl = (documentItem.url || '').trim();
      if (normalizedUrl) {
        if (seenUrls.has(normalizedUrl)) {
          return;
        }
        seenUrls.add(normalizedUrl);
      }
      deduplicatedByUrl.push(documentItem);
    });

    return deduplicatedByUrl
      .sort((a, b) => {
        const left = a.date ? new Date(a.date).getTime() : 0;
        const right = b.date ? new Date(b.date).getTime() : 0;
        return right - left;
      });
  }, [locations, baux, locataires, locataireNameById]);

  const slugByPremiumBienId = useMemo(() => {
    const map = new Map();

    appartements.forEach((appartement) => {
      const linkedBienId = typeof appartement?.bien === 'object' && appartement?.bien !== null
        ? appartement.bien.id
        : appartement?.bien;

      if (linkedBienId && appartement?.slug) {
        map.set(String(linkedBienId), appartement.slug);
      }
    });

    return map;
  }, [appartements]);

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
    reservationRequestKey: '',
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

  const selectedBien = useMemo(
    () => biens.find((bien) => String(bien.id) === String(newBail.bien)) || null,
    [biens, newBail.bien]
  );
  const selectedBienSlug = useMemo(() => {
    if (!selectedBien) {
      return '';
    }

    const associatedAppartement = findAssociatedAppartement(selectedBien, appartements);

    return selectedBien?.appartement_slug
      || selectedBien?.appartement?.slug
      || slugByPremiumBienId.get(String(selectedBien.id))
      || associatedAppartement?.slug
      || selectedBien?.slug
      || '';
  }, [selectedBien, slugByPremiumBienId, appartements]);
  const selectedLocationParams = useMemo(() => ({ statut: 'RESERVE' }), []);
  const {
    data: selectedBienLocationsData,
    isLoading: selectedBienLocationsLoading,
  } = useAppartementLocations(selectedBienSlug, selectedLocationParams);
  const selectedBienReservations = useMemo(
    () => [...(selectedBienLocationsData?.results || [])].sort((left, right) => {
      const leftTimestamp = left?.dateReservation ? new Date(left.dateReservation).getTime() : 0;
      const rightTimestamp = right?.dateReservation ? new Date(right.dateReservation).getTime() : 0;
      return rightTimestamp - leftTimestamp;
    }),
    [selectedBienLocationsData]
  );

  const isLoading = dashboardLoading || categoriesLoading || typesLoading || biensLoading || locatairesLoading || bauxLoading || comptaLoading || auditLoading || paymentsLoading || locationsLoading;

  const financialSummary = dashboard?.comptabilite || {};
  const patrimoineSummary = dashboard?.patrimoine || {};
  const selectedBailReservation = selectedBienReservations.find(
    (reservation) => buildReservationRequestKey(reservation) === newBail.reservationRequestKey
  ) || selectedBienReservations[0] || null;
  const matchedLocataireId = findMatchingLocataireId(selectedBailReservation, locataires);

  const applyReservationToBail = useCallback((bienId, reservation) => {
    const selectedBien = biens.find((bien) => String(bien.id) === String(bienId));
    const nextLocataireId = findMatchingLocataireId(reservation, locataires);

    setNewBail((prev) => ({
      ...prev,
      bien: bienId,
      locataire: nextLocataireId,
      reservationRequestKey: reservation ? buildReservationRequestKey(reservation) : '',
      date_entree: reservation?.dateDebut || '',
      date_sortie: reservation?.dateFin || '',
      depot_garantie: selectedBien?.loyer_hc !== undefined && selectedBien?.loyer_hc !== null
        ? String(selectedBien.loyer_hc)
        : '',
    }));
  }, [biens, locataires]);

  useEffect(() => {
    if (!newBail.bien || selectedBienReservations.length === 0) {
      return;
    }

    const currentSelectionExists = selectedBienReservations.some(
      (reservation) => buildReservationRequestKey(reservation) === newBail.reservationRequestKey
    );

    if (!currentSelectionExists) {
      applyReservationToBail(newBail.bien, selectedBienReservations[0]);
    }
  }, [newBail.bien, newBail.reservationRequestKey, selectedBienReservations, applyReservationToBail]);

  const handleBailBienChange = (e) => {
    const bienId = e.target.value;

    if (!bienId) {
      setNewBail((prev) => ({
        ...prev,
        bien: '',
        locataire: '',
        reservationRequestKey: '',
        date_entree: '',
        date_sortie: '',
        depot_garantie: '',
      }));
      return;
    }

    const selectedBienForGuarantee = biens.find((bien) => String(bien.id) === String(bienId));
    setNewBail((prev) => ({
      ...prev,
      bien: bienId,
      locataire: '',
      reservationRequestKey: '',
      date_entree: '',
      date_sortie: '',
      depot_garantie: selectedBienForGuarantee?.loyer_hc !== undefined && selectedBienForGuarantee?.loyer_hc !== null
        ? String(selectedBienForGuarantee.loyer_hc)
        : '',
    }));
  };

  const handleBailReservationChange = (e) => {
    const reservationRequestKey = e.target.value;
    const reservation = selectedBienReservations.find(
      (item) => buildReservationRequestKey(item) === reservationRequestKey
    );

    applyReservationToBail(newBail.bien, reservation || null);
  };

  const handleBailLocataireChange = (e) => {
    const locataireId = e.target.value;
    setNewBail((prev) => ({
      ...prev,
      locataire: locataireId,
      reservationRequestKey: '',
    }));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategoryMutation.mutateAsync({
        code: sanitizeCode(newCategory.code),
        label: newCategory.label.trim(),
      });
      setNewCategory({ code: '', label: '' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation de categorie'));
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await createTypeMutation.mutateAsync({
        code: sanitizeCode(newType.code),
        label: newType.label.trim(),
      });
      setNewType({ code: '', label: '' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation du type'));
    }
  };

  const handleCreateBien = async (e) => {
    e.preventDefault();
    try {
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
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation du bien'));
    }
  };

  const handleCreateLocataire = async (e) => {
    e.preventDefault();
    try {
      await createLocataireMutation.mutateAsync(buildLocatairePayload(newLocataire));
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
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation du locataire'));
    }
  };

  const handleCreateBail = async (e) => {
    e.preventDefault();
    const bienId = newBail.bien;
    if (!bienId) {
      return;
    }

    let locataireId = newBail.locataire;

    if (selectedBailReservation && !locataireId) {
      const matchedReservationLocataireId = findMatchingLocataireId(selectedBailReservation, locataires);

      if (matchedReservationLocataireId) {
        locataireId = matchedReservationLocataireId;
      } else {
        const { nom, prenoms } = splitFullName(selectedBailReservation.nomLocataire || '');
        const reservationEmail = (selectedBailReservation.emailLocataire || '').trim();
        if (!reservationEmail) {
          toast.error('Impossible de creer le locataire automatiquement: email manquant sur la reservation.');
          return;
        }
        const sanitizedNom = nom || 'Locataire';
        const sanitizedPrenoms = prenoms || sanitizedNom;
        try {
          const createdLocataire = await createLocataireMutation.mutateAsync(buildLocatairePayload({
            nom: sanitizedNom,
            prenoms: sanitizedPrenoms,
            email: reservationEmail,
            telephone: selectedBailReservation.telephoneLocataire || '',
            date_naissance: '',
            profession: '',
            piece_identite: '',
            garant: '',
          }));

          locataireId = createdLocataire?.id ? String(createdLocataire.id) : '';
        } catch (error) {
          toast.error(extractApiErrorMessage(error, 'Impossible de creer le locataire automatiquement'));
          return;
        }
      }
    }

    if (!locataireId) {
      toast.error('Selectionnez un locataire valide pour creer le bail.');
      return;
    }

    try {
      await createBailMutation.mutateAsync({
        bien: bienId,
        locataire: locataireId,
        date_entree: newBail.date_entree,
        date_sortie: newBail.date_sortie || null,
        revision_annuelle: Number(newBail.revision_annuelle || 0),
        depot_garantie: Number(newBail.depot_garantie || 0),
      });
      setNewBail({
        bien: '',
        locataire: '',
        reservationRequestKey: '',
        date_entree: '',
        date_sortie: '',
        revision_annuelle: '0',
        depot_garantie: '',
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation du bail'));
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    const bienId = newEntry.bien;
    if (!bienId) {
      return;
    }

    try {
      await createComptaMutation.mutateAsync({
        ...newEntry,
        bien: bienId,
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
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation de l ecriture'));
    }
  };

  const handlePurge = async () => {
    if (!selectedLocataireForPurge) {
      return;
    }
    try {
      await purgeDataMutation.mutateAsync(selectedLocataireForPurge);
      setSelectedLocataireForPurge('');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'La purge RGPD a echoue'));
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
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
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Erreur lors de la creation du paiement'));
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="premium-page">
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
            <option value="">Type de bien</option>
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
              {biens.map((bien) => {
                const relatedSlug =
                  bien?.appartement_slug ||
                  bien?.appartement?.slug ||
                  bien?.slug ||
                  slugByPremiumBienId.get(String(bien.id)) ||
                  toSlug(bien?.titre || '');

                return (
                <tr
                  key={bien.id}
                  className={relatedSlug ? 'is-clickable' : ''}
                  style={relatedSlug ? { cursor: 'pointer' } : undefined}
                  onClick={() => {
                    if (relatedSlug) {
                      navigate(`/appartements/${encodeURIComponent(relatedSlug)}`);
                    }
                  }}
                >
                  <td>{bien.titre}</td>
                  <td>{bien.category_label || bien.category?.label || '-'}</td>
                  <td>{bien.appartement_type_label || bien.appartement_type?.label || '-'}</td>
                  <td>{formatters.price(bien.loyer_hc || 0)}</td>
                  <td>{formatters.price(bien.charges || 0)}</td>
                  <td>{bien.statut || '-'}</td>
                </tr>
                );
              })}
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

        </article>

        <article className="premium-card">
          <h3>Bail numerique</h3>
          <form className="premium-grid premium-form-grid" onSubmit={handleCreateBail}>
            <select className="form-control" value={newBail.bien} onChange={handleBailBienChange} required>
              <option value="">Bien</option>
              {biens.map((bien) => (
                <option key={bien.id} value={bien.id}>{bien.titre}</option>
              ))}
            </select>

            {newBail.bien && selectedBienSlug && selectedBienLocationsLoading && (
              <div style={{ gridColumn: '1 / -1' }}>
                <LoadingSpinner />
              </div>
            )}

            {selectedBienReservations.length > 0 ? (
              <select className="form-control" value={newBail.reservationRequestKey} onChange={handleBailReservationChange} required>
                <option value="">Locataire demandeur</option>
                {selectedBienReservations.map((reservation) => {
                  const optionLocataireId = findMatchingLocataireId(reservation, locataires);
                  return (
                    <option key={buildReservationRequestKey(reservation)} value={buildReservationRequestKey(reservation)}>
                      {reservation.nomLocataire} | {formatters.date(reservation.dateDebut)} - {formatters.date(reservation.dateFin)}{optionLocataireId ? '' : ' | nouveau dossier'}
                    </option>
                  );
                })}
              </select>
            ) : (
              <select className="form-control" value={newBail.locataire} onChange={handleBailLocataireChange} required>
                <option value="">Locataire</option>
                {locataires.map((locataire) => (
                  <option key={locataire.id} value={locataire.id}>{locataire.nom} {locataire.prenoms}</option>
                ))}
              </select>
            )}

            <input className="form-control" type="date" value={newBail.date_entree} onChange={(e) => setNewBail((prev) => ({ ...prev, date_entree: e.target.value }))} required />
            <input className="form-control" type="date" value={newBail.date_sortie} onChange={(e) => setNewBail((prev) => ({ ...prev, date_sortie: e.target.value }))} />
            <input className="form-control" type="number" step="0.01" value={newBail.revision_annuelle} onChange={(e) => setNewBail((prev) => ({ ...prev, revision_annuelle: e.target.value }))} placeholder="Revision annuelle (%)" />
            <input className="form-control" type="number" min="0" value={newBail.depot_garantie} onChange={(e) => setNewBail((prev) => ({ ...prev, depot_garantie: e.target.value }))} placeholder="Depot de garantie" />
            <button className="btn btn-primary" type="submit">Creer le bail</button>
          </form>

          {selectedBailReservation && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <strong>Demande de reservation detectee</strong>
              <p>
                {selectedBailReservation.nomLocataire} du {formatters.date(selectedBailReservation.dateDebut)} au {formatters.date(selectedBailReservation.dateFin)}.
              </p>
              <p>
                Contact: {selectedBailReservation.emailLocataire || 'email indisponible'}{selectedBailReservation.telephoneLocataire ? ` | ${selectedBailReservation.telephoneLocataire}` : ''}
              </p>
              <p>
                {matchedLocataireId
                  ? 'Le locataire, les dates et le depot ont ete pre-remplis automatiquement.'
                  : 'Les dates et le depot ont ete pre-remplis. Le dossier locataire premium sera cree automatiquement a la creation du bail si besoin.'}
              </p>
            </div>
          )}

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
          <h3>Documents</h3>

          <div className="premium-table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Nom du fichier</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {premiumDocuments.map((documentItem) => (
                  <tr
                    key={documentItem.id}
                    className={documentItem.url ? 'is-clickable' : ''}
                    style={documentItem.url ? { cursor: 'pointer' } : undefined}
                    onClick={() => {
                      if (documentItem.url) {
                        window.open(documentItem.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <td>{documentItem.titre}</td>
                    <td>{extractFileNameFromUrl(documentItem.url) || documentItem.reference || 'Indisponible'}</td>
                    <td>{documentItem.date ? formatters.date(documentItem.date) : '-'}</td>
                  </tr>
                ))}
                {premiumDocuments.length === 0 && (
                  <tr>
                    <td colSpan={3}>Aucun document disponible pour le moment.</td>
                  </tr>
                )}
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
