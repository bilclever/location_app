// Adaptateurs pour convertir les données API vers format frontend
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_URL ||
  (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') : '');
const NORMALIZED_MEDIA_BASE_URL = MEDIA_BASE_URL.replace(/\/+$/, '');

const shouldStripMediaPrefix = /\/media\/?$/i.test(NORMALIZED_MEDIA_BASE_URL);

const stripLeadingMediaPrefix = (path) => {
  if (!shouldStripMediaPrefix || !path) return path;
  return path.replace(/^\/?media\//i, '');
};

const joinMediaBase = (path) => {
  const normalizedPath = stripLeadingMediaPrefix(path || '');
  return `${NORMALIZED_MEDIA_BASE_URL}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

const withMediaBase = (url) => {
  if (!url || typeof url !== 'string') return url;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return trimmedUrl;

  if (/^https?:\/\//i.test(trimmedUrl)) {
    if (!NORMALIZED_MEDIA_BASE_URL) return trimmedUrl;

    try {
      const parsedAbsoluteUrl = new URL(trimmedUrl);
      const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedAbsoluteUrl.hostname);
      const pointsToMediaPath = /^\/media\//i.test(parsedAbsoluteUrl.pathname);

      if (isLocalHost || pointsToMediaPath) {
        return joinMediaBase(`${parsedAbsoluteUrl.pathname}${parsedAbsoluteUrl.search}`);
      }
    } catch (_error) {
      return trimmedUrl;
    }

    return trimmedUrl;
  }

  if (!NORMALIZED_MEDIA_BASE_URL) return trimmedUrl;
  return joinMediaBase(trimmedUrl);
};

export const adapters = {
  // Adaptation de UserProfile vers format utilisateur frontend
  userProfile: (data) => {
    // Extraire les favoris de différentes sources possibles
    let favoris = [];
    
    if (Array.isArray(data.favoris)) {
      favoris = data.favoris;
    } else if (Array.isArray(data.favoris_ids)) {
      favoris = data.favoris_ids;
    } else if (data.profil_locataire?.favoris && Array.isArray(data.profil_locataire.favoris)) {
      favoris = data.profil_locataire.favoris;
    }
    
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: data.full_name,
      telephone: data.telephone,
      role: data.role,
      plan: data.plan || 'free',
      adresse: data.adresse,
      photoProfil: withMediaBase(data.photo_profil),
      dateNaissance: data.date_naissance,
      verifie: data.verifie,
      notificationsEmail: data.notifications_email,
      dateJoined: data.date_joined,
      lastLogin: data.last_login,
      profil: data.profil,
      favoris: favoris,
    };
  },

  // Adaptation de AppartementList vers format frontend
  appartementList: (data) => ({
    bien: typeof data.bien === 'object' && data.bien !== null ? data.bien.id : data.bien,
    id: data.id,
    slug: data.slug,
    titre: data.titre,
    ville: data.ville,
    typeBien: data.type_bien,
    loyerMensuel: parseFloat(data.loyer_mensuel),
    surface: data.surface,
    nbPieces: data.nb_pieces,
    disponible: data.disponible,
    photoPrincipaleUrl: withMediaBase(data.photo_principale_url),
    proprietaireNom: data.proprietaire_nom,
    nbVues: data.nb_vues,
    nbFavoris: data.nb_favoris,
  }),

  // Adaptation de AppartementDetail vers format frontend
  appartementDetail: (data) => {
    if (!data) return null;
    
    // Gérer les photos - elles peuvent être un tableau d'objets ou d'URLs
    let photos = data.photos;
    if (Array.isArray(photos)) {
      photos = photos.map(photo => {
        if (typeof photo === 'string') {
          return withMediaBase(photo);
        }
        return {
          ...photo,
          image: withMediaBase(photo.image || photo.url),
        };
      });
    }
    
    const bienId = typeof data.bien === 'object' && data.bien !== null
      ? data.bien.id
      : data.bien;

    return {
      id: data.id,
      slug: data.slug,
      titre: data.titre,
      description: data.description,
      adresse: data.adresse,
      ville: data.ville,
      codePostal: data.code_postal,
      typeBien: data.type_bien,
      loyerMensuel: parseFloat(data.loyer_mensuel),
      caution: parseFloat(data.caution),
      cautionMois: data.caution_mois ?? 0,
      surface: data.surface,
      nbPieces: data.nb_pieces,
      disponible: data.disponible,
      photoPrincipale: withMediaBase(data.photo_principale),
      photoPrincipaleUrl: withMediaBase(data.photo_principale_url),
      photos: photos,
      bien: bienId,
      proprietaire: data.proprietaire,
      proprietaireTelephone: data.proprietaire_telephone,
      nbVues: data.nb_vues,
      nbFavoris: data.nb_favoris,
      dateCreation: data.date_creation,
      dateModification: data.date_modification,
    };
  },

  // Adaptation de LocationList vers format frontend
  locationList: (data) => ({
    id: data.id,
    appartementId: data.appartement_id,
    appartementSlug: data.appartement_slug,
    appartementTitre: data.appartement_titre,
    appartementVille: data.appartement_ville,
    appartementProprietaireId: data.appartement_proprietaire_id,
    locataireId: data.locataire_id,
    locataireNom: data.locataire_nom,
    nomLocataire: data.nom_locataire,
    emailLocataire: data.email_locataire,
    telephoneLocataire: data.telephone_locataire,
    dateDebut: data.date_debut,
    dateFin: data.date_fin,
    statut: data.statut,
    montantTotal: parseFloat(data.montant_total),
    dateReservation: data.date_reservation,
    bailPdfUrl: data.bail_pdf_url,
  }),

  // Adaptation de LocationDetail vers format frontend
  locationDetail: (data) => ({
    id: data.id,
    appartement: data.appartement,
    locataire: data.locataire,
    nomLocataire: data.nom_locataire,
    emailLocataire: data.email_locataire,
    telephoneLocataire: data.telephone_locataire,
    dateDebut: data.date_debut,
    dateFin: data.date_fin,
    statut: data.statut,
    dateReservation: data.date_reservation,
    dateConfirmation: data.date_confirmation,
    datePaiement: data.date_paiement,
    montantTotal: parseFloat(data.montant_total),
    commission: parseFloat(data.commission),
    notes: data.notes,
    dureeSejour: data.duree_sejour,
    bailPdfUrl: data.bail_pdf_url,
    dateGenerationBail: data.date_generation_bail,
  }),

  // Adaptation de PaginatedResponse
  paginatedResponse: (data) => {
    const count = data.count || 0;
    const pageSize = data.page_size || 10;
    const currentPage = data.current_page || 1;
    
    // Calculer totalPages s'il n'existe pas
    let totalPages = data.total_pages;
    if (!totalPages || isNaN(totalPages)) {
      totalPages = Math.ceil(count / pageSize) || 1;
    }
    
    return {
      count,
      next: data.links?.next,
      previous: data.links?.previous,
      totalPages: Math.max(1, parseInt(totalPages) || 1),
      currentPage: Math.max(1, parseInt(currentPage) || 1),
      results: data.results || [],
    };
  },
};