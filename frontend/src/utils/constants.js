// Correspond aux enums de l'API
export const ROLE_ENUM = {
  LOCATAIRE: 'LOCATAIRE',
  PROPRIETAIRE: 'PROPRIETAIRE',
  ADMIN: 'ADMIN',
};

export const STATUT_ENUM = {
  PENDING: 'PENDING',
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
  [STATUT_ENUM.PENDING]: 'En attente de confirmation',
  [STATUT_ENUM.RESERVE]: 'Réservé',
  [STATUT_ENUM.CONFIRME]: 'Confirmé',
  [STATUT_ENUM.PAYE]: 'Payé',
  [STATUT_ENUM.ANNULE]: 'Annulé',
  [STATUT_ENUM.TERMINE]: 'Terminé',
};

export const STATUT_COLORS = {
  [STATUT_ENUM.PENDING]: 'warning',
  [STATUT_ENUM.RESERVE]: 'warning',
  [STATUT_ENUM.CONFIRME]: 'info',
  [STATUT_ENUM.PAYE]: 'success',
  [STATUT_ENUM.ANNULE]: 'danger',
  [STATUT_ENUM.TERMINE]: 'secondary',
};

// Autres constantes
export const VILLES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Lille',
  'Nice',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Rennes',
  'Grenoble',
];

export const NB_PIECES = [1, 2, 3, 4, 5];

export const PRIX_MAX = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000];

export const DEFAULT_PAGE_SIZE = 10;