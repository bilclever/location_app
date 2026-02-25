// Adaptateurs pour convertir les données API vers format frontend
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_URL ||
  (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') : '');

const withMediaBase = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!MEDIA_BASE_URL) return url;
  return `${MEDIA_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const adapters = {
  // Adaptation de UserProfile vers format utilisateur frontend
  userProfile: (data) => {
    // Extraire les favoris de différentes sources possibles
    let favoris = [];
    
    // Log pour debug
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Adapter] Full user data:', data);
      console.log('[Adapter] data.favoris:', data.favoris);
      console.log('[Adapter] data.favoris_ids:', data.favoris_ids);
      console.log('[Adapter] data.profil_locataire:', data.profil_locataire);
    }
    
    if (Array.isArray(data.favoris)) {
      favoris = data.favoris;
      console.log('[Adapter] ✅ Found favoris from data.favoris:', favoris);
    } else if (Array.isArray(data.favoris_ids)) {
      favoris = data.favoris_ids;
      console.log('[Adapter] ✅ Found favoris from data.favoris_ids:', favoris);
    } else if (data.profil_locataire?.favoris && Array.isArray(data.profil_locataire.favoris)) {
      favoris = data.profil_locataire.favoris;
      console.log('[Adapter] ✅ Found favoris from data.profil_locataire.favoris:', favoris);
    } else {
      // Chercher tous les chemins possibles en tant que fallback
      for (const [key, value] of Object.entries(data)) {
        if (key.includes('favor') && Array.isArray(value)) {
          favoris = value;
          console.log(`[Adapter] ✅ Found favoris from data.${key}:`, favoris);
          break;
        }
      }
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
      adresse: data.adresse,
      photoProfil: data.photo_profil,
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
    id: data.id,
    titre: data.titre,
    ville: data.ville,
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
    
    return {
      id: data.id,
      titre: data.titre,
      description: data.description,
      adresse: data.adresse,
      ville: data.ville,
      codePostal: data.code_postal,
      loyerMensuel: parseFloat(data.loyer_mensuel),
      caution: parseFloat(data.caution),
      surface: data.surface,
      nbPieces: data.nb_pieces,
      disponible: data.disponible,
      photoPrincipale: withMediaBase(data.photo_principale),
      photoPrincipaleUrl: withMediaBase(data.photo_principale_url),
      photos: photos,
      proprietaire: data.proprietaire,
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
    appartementTitre: data.appartement_titre,
    appartementVille: data.appartement_ville,
    locataireId: data.locataire_id,
    locataireNom: data.locataire_nom,
    nomLocataire: data.nom_locataire,
    dateDebut: data.date_debut,
    dateFin: data.date_fin,
    statut: data.statut,
    montantTotal: parseFloat(data.montant_total),
    dateReservation: data.date_reservation,
    estActive: data.est_active,
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
    estActive: data.est_active,
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