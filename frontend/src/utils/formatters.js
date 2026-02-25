import { format, formatDistance, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatters = {
  price(amount) {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `${formattedAmount} CFA`;
  },

  date(date, pattern = 'dd MMMM yyyy') {
    if (!date) return '';
    return format(new Date(date), pattern, { locale: fr });
  },

  dateTime(date, pattern = 'dd MMMM yyyy à HH:mm') {
    if (!date) return '';
    return format(new Date(date), pattern, { locale: fr });
  },

  relativeDate(date) {
    if (!date) return '';
    return formatDistance(new Date(date), new Date(), {
      addSuffix: true,
      locale: fr,
    });
  },

  relativeTime(date) {
    if (!date) return '';
    return formatRelative(new Date(date), new Date(), { locale: fr });
  },

  phone(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/(\d{2})(?=\d)/g, '$1 ');
  },

  surface(m2) {
    return `${m2} m²`;
  },

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  statut(statut) {
    const labels = {
      RESERVE: 'Réservé',
      CONFIRME: 'Confirmé',
      PAYE: 'Payé',
      ANNULE: 'Annulé',
      TERMINE: 'Terminé',
    };
    return labels[statut] || statut;
  },

  role(role) {
    const labels = {
      LOCATAIRE: 'Locataire',
      PROPRIETAIRE: 'Propriétaire',
      ADMIN: 'Administrateur',
    };
    return labels[role] || role;
  },

  truncate(str, length = 100) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },
};