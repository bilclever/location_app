import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLocation } from '../../hooks/useLocations';
import { useAuth } from '../../hooks/useAuth';
import { appartementService } from '../../services/appartements';
import { validators } from '../../utils/validators';
import { formatters } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ReservationForm = ({ appartementId, appartement }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createMutation = useCreateLocation();
  
  const [formData, setFormData] = useState({
    nom_locataire: '',
    email_locataire: '',
    telephone_locataire: '',
    date_debut: '',
    date_fin: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [disponibilite, setDisponibilite] = useState(null);
  const [total, setTotal] = useState(null);

  // Pré-remplir avec les données de l'utilisateur connecté
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom_locataire: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.username,
        email_locataire: user.email || '',
        telephone_locataire: user.telephone || '',
        date_debut: today,
        date_fin: nextWeek,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (formData.date_debut && formData.date_fin && appartement) {
      verifierDisponibilite();
      calculerTotal();
    }
  }, [formData.date_debut, formData.date_fin, appartement]);

  const verifierDisponibilite = async () => {
    if (!validators.dateRange(formData.date_debut, formData.date_fin)) {
      setDisponibilite(null);
      return;
    }

    try {
      const result = await appartementService.checkDisponibilite(
        appartementId,
        formData.date_debut,
        formData.date_fin
      );
      setDisponibilite(result);
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
    }
  };

  const calculerTotal = () => {
    const debut = new Date(formData.date_debut);
    const fin = new Date(formData.date_fin);
    const nbJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
    
    if (nbJours > 0 && appartement) {
      const loyerJournalier = parseFloat(appartement.loyerMensuel) / 30;
      setTotal(loyerJournalier * nbJours);
    } else {
      setTotal(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Les informations utilisateur sont automatiquement remplies, on valide juste les dates
    if (!validators.dateRange(formData.date_debut, formData.date_fin)) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }

    if (!validators.futureDate(formData.date_debut)) {
      newErrors.date_debut = 'La date de début doit être dans le futur';
    }

    if (disponibilite && !disponibilite.disponible) {
      newErrors.date_debut = 'Ces dates ne sont pas disponibles';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await createMutation.mutateAsync({
        appartement: appartementId,
        ...formData,
      });
      
      toast.success('Réservation effectuée avec succès');
      navigate('/mes-reservations');
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="date_debut" className="form-label">
            Date d'arrivée *
          </label>
          <input
            type="date"
            id="date_debut"
            name="date_debut"
            className={`form-control ${errors.date_debut ? 'error' : ''}`}
            value={formData.date_debut}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          {errors.date_debut && (
            <div className="form-error">{errors.date_debut}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date_fin" className="form-label">
            Date de départ *
          </label>
          <input
            type="date"
            id="date_fin"
            name="date_fin"
            className={`form-control ${errors.date_fin ? 'error' : ''}`}
            value={formData.date_fin}
            onChange={handleChange}
            min={formData.date_debut}
            required
          />
          {errors.date_fin && (
            <div className="form-error">{errors.date_fin}</div>
          )}
        </div>
      </div>

      {disponibilite && (
        <div className={`alert alert-${disponibilite.disponible ? 'success' : 'error'}`}>
          {disponibilite.message}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="notes" className="form-label">
          Notes (optionnel)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          className="form-control"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Informations complémentaires..."
        />
      </div>

      {total !== null && (
        <div style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total du séjour :</span>
            <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
              {formatters.price(total)}
            </span>
          </div>
        </div>
      )}

      {errors.non_field_errors && (
        <div className="alert alert-error">{errors.non_field_errors}</div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoading || (disponibilite && !disponibilite.disponible)}
        >
          {isLoading ? 'Réservation...' : 'Confirmer la réservation'}
        </button>
        
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(`/appartements/${appartementId}`)}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default ReservationForm;