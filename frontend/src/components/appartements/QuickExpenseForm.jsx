import React, { useState } from 'react';

const QuickExpenseForm = ({ bienId, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    type_ecriture: 'DEPENSE',
    libelle: '',
    categorie: '',
    date_operation: new Date().toISOString().split('T')[0],
    montant: '',
  });

  const [errors, setErrors] = useState({});

  const expenseCategories = [
    'TRAVAUX',
    'CHARGES_COPROPRIETE',
    'TAXE_FONCIERE',
    'ASSURANCE',
    'ENTRETIEN',
    'FRAIS_GESTION',
    'REPARATIONS',
    'HONORAIRES',
    'AUTRES_DEPENSES',
  ];

  const revenueCategories = [
    'LOYER',
    'CHARGES_LOCATAIRE',
    'REGULARISATION_CHARGES',
    'AUTRES_REVENUS',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.libelle.trim()) {
      newErrors.libelle = 'Le libellé est requis';
    }

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }

    if (!formData.date_operation) {
      newErrors.date_operation = 'La date est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const dataToSend = {
      ...formData,
      bien: bienId,
      montant: parseFloat(formData.montant),
    };

    await onSubmit(dataToSend);
    
    // Reset form
    setFormData({
      type_ecriture: 'DEPENSE',
      libelle: '',
      categorie: '',
      date_operation: new Date().toISOString().split('T')[0],
      montant: '',
    });
  };

  const currentCategories = formData.type_ecriture === 'DEPENSE' 
    ? expenseCategories 
    : revenueCategories;

  return (
    <form onSubmit={handleSubmit} className="quick-expense-form" style={styles.form}>
      <div style={styles.header}>
        <h4 style={styles.title}>Enregistrer une opération</h4>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Type</label>
          <select
            name="type_ecriture"
            value={formData.type_ecriture}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="DEPENSE">Dépense</option>
            <option value="REVENU">Revenu</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date</label>
          <input
            type="date"
            name="date_operation"
            value={formData.date_operation}
            onChange={handleChange}
            style={styles.input}
            required
          />
          {errors.date_operation && <span style={styles.error}>{errors.date_operation}</span>}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Libellé</label>
        <input
          type="text"
          name="libelle"
          value={formData.libelle}
          onChange={handleChange}
          placeholder="Ex: Réparation plomberie"
          style={styles.input}
          required
        />
        {errors.libelle && <span style={styles.error}>{errors.libelle}</span>}
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Catégorie</label>
          <select
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Sélectionner --</option>
            {currentCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Montant (FCFA)</label>
          <input
            type="number"
            name="montant"
            value={formData.montant}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="0.01"
            style={styles.input}
            required
          />
          {errors.montant && <span style={styles.error}>{errors.montant}</span>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
};

const styles = {
  form: {
    background: '#fff',
    borderRadius: '8px',
    padding: '0.6rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    marginBottom: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  formGroup: {
    marginBottom: '0.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '0.4rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  error: {
    display: 'block',
    color: '#dc3545',
    fontSize: '0.8125rem',
    marginTop: '0.25rem',
  },
  button: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#f2a65a',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default QuickExpenseForm;
