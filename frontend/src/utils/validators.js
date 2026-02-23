export const validators = {
  email(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  phone(phone) {
    const re = /^[0-9+\-\s]{10,}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  password(password) {
    return password.length >= 8;
  },

  passwordMatch(password, confirm) {
    return password === confirm;
  },

  dateRange(dateDebut, dateFin) {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    return debut < fin;
  },

  futureDate(date) {
    return new Date(date) > new Date();
  },

  positiveNumber(value) {
    return parseFloat(value) > 0;
  },

  surface(value) {
    const num = parseFloat(value);
    return num > 0 && num <= 1000;
  },

  loyer(value) {
    const num = parseFloat(value);
    return num > 0 && num <= 100000;
  },

  required(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  },
};