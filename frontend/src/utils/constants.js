// Correspond aux enums de l'API
export const ROLE_ENUM = {
  LOCATAIRE: 'LOCATAIRE',
  PROPRIETAIRE: 'PROPRIETAIRE',
  ADMIN: 'ADMIN',
};

export const STATUT_ENUM = {
  RESERVE: 'RESERVE',
  CONFIRME: 'CONFIRME',
  PAYE: 'PAYE',
  ANNULE: 'ANNULE',
  TERMINE: 'TERMINE',
};

export const ACTION_ENUM = {
  ADD: 'add',
  REMOVE: 'remove',
};

// Labels pour affichage
export const ROLE_LABELS = {
  [ROLE_ENUM.LOCATAIRE]: 'Locataire',
  [ROLE_ENUM.PROPRIETAIRE]: 'Propriétaire',
  [ROLE_ENUM.ADMIN]: 'Administrateur',
};

export const STATUT_LABELS = {
  [STATUT_ENUM.RESERVE]: 'En attente de confirmation',
  [STATUT_ENUM.CONFIRME]: 'Confirmé',
  [STATUT_ENUM.PAYE]: 'Payé',
  [STATUT_ENUM.ANNULE]: 'Annulé',
  [STATUT_ENUM.TERMINE]: 'Terminé',
};

export const STATUT_COLORS = {
  [STATUT_ENUM.RESERVE]: 'warning',
  [STATUT_ENUM.CONFIRME]: 'info',
  [STATUT_ENUM.PAYE]: 'success',
  [STATUT_ENUM.ANNULE]: 'danger',
  [STATUT_ENUM.TERMINE]: 'secondary',
};

// Autres constantes
export const VILLES = [
  'Lomé',
  'Kara',
  'Sokodé',
  'Kpalimé',
  'Atakpamé',
  'Tsévié',
  'Aného',
  'Dapaong',
  'Notsé',
  'Mango',
  'Bassar',
  'Bafilo',
  'Kandé',
  'Badou',
  'Vogan',
];

export const NB_PIECES = [1, 2, 3, 4, 5];

export const BIEN_TYPE_OPTIONS = [
  { value: 'APPARTEMENT', label: 'Appartement' },
  { value: 'MAISON', label: 'Maison' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'LOCAL_COMMERCIAL', label: 'Local commercial' },
  { value: 'BUREAU', label: 'Bureau' },
  { value: 'TERRAIN', label: 'Terrain' },
];

export const PRIX_MAX = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000];

export const DEFAULT_PAGE_SIZE = 10;

export const BIEN_CATEGORIES = [
  { code: 'APPARTEMENT', label: 'Appartement' },
  { code: 'MAISON', label: 'Maison' },
  { code: 'BUREAU', label: 'Bureau' },
  { code: 'PARKING', label: 'Parking' },
  { code: 'LOCAL_COMMERCIAL', label: 'Local commercial' },
  { code: 'TERRAIN', label: 'Terrain' },
];

export const DEFAULT_APPARTEMENT_TYPES = [
  { code: 'STUDIO', label: 'Studio' },
  { code: 'CHAMBRE_SALON', label: 'Chambre salon' },
  { code: 'PALAIS', label: 'Palais' },
  { code: 'SUITE', label: 'Suite' },
];

export const BIEN_STATUT_OPTIONS = [
  { value: 'LOUE', label: 'Loue' },
  { value: 'VACANT', label: 'Vacant' },
  { value: 'TRAVAUX', label: 'En travaux' },
];

export const COMPTA_ENTRY_TYPES = [
  { value: 'REVENU', label: 'Revenu' },
  { value: 'DEPENSE', label: 'Depense' },
];