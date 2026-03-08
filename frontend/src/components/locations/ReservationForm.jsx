import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLocation } from '../../hooks/useLocations';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { appartementService } from '../../services/appartements';
import { validators } from '../../utils/validators';
import { formatters } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ReservationForm = ({ appartementSlug, appartement }) => {
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
        nom_locataire: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email_locataire: user.email || '',
        telephone_locataire: user.telephone || '',
        date_debut: today,
        date_fin: nextWeek,
      }));
    }
  }, [user]);

  const verifierDisponibilite = useCallback(async () => {
    if (!validators.dateRange(formData.date_debut, formData.date_fin)) {
      setDisponibilite(null);
      return;
    }

    try {
      const result = await appartementService.checkDisponibilite(
        appartementSlug,
        formData.date_debut,
        formData.date_fin
      );
      setDisponibilite(result);
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
    }
  }, [appartementSlug, formData.date_debut, formData.date_fin]);

  const calculerTotal = useCallback(() => {
    const debut = new Date(formData.date_debut);
    const fin = new Date(formData.date_fin);
    const nbJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));

    if (nbJours > 0 && appartement) {
      const moisReservation = Math.max(1, Math.ceil(nbJours / 30));
      let cautionMois = Number(appartement.cautionMois || 0);

      // Compatibilité legacy: si cautionMois absent, essayer de le déduire
      if (cautionMois <= 0 && Number(appartement.loyerMensuel) > 0 && Number(appartement.caution) > 0) {
        const cautionCalcule = Math.round(Number(appartement.caution) / Number(appartement.loyerMensuel));
        if (cautionCalcule > 0) {
          cautionMois = cautionCalcule;
        }
      }

      const moisFactures = Math.max(moisReservation, cautionMois);
      setTotal(Number(appartement.loyerMensuel) * moisFactures);
    } else {
      setTotal(null);
    }
  }, [appartement, formData.date_debut, formData.date_fin]);

  useEffect(() => {
    if (formData.date_debut && formData.date_fin && appartement) {
      verifierDisponibilite();
      calculerTotal();
    }
  }, [formData.date_debut, formData.date_fin, appartement, verifierDisponibilite, calculerTotal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Valider les champs requis
    if (!formData.nom_locataire?.trim()) {
      newErrors.nom_locataire = 'Le nom du locataire est requis';
    }

    if (!formData.email_locataire?.trim()) {
      newErrors.email_locataire = 'L\'email est requis';
    } else if (!validators.email(formData.email_locataire)) {
      newErrors.email_locataire = 'L\'email n\'est pas valide';
    }

    if (!formData.telephone_locataire?.trim()) {
      newErrors.telephone_locataire = 'Le numéro de téléphone est requis';
    }

    // Valider les dates
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
      const payload = {
        appartement: appartementSlug,
        ...formData,
      };
      
      console.log('Payload envoyé (JSON):', JSON.stringify(payload, null, 2));
      console.log('Appartement slug:', appartementSlug);
      console.log('Form data:', JSON.stringify(formData, null, 2));
      
      await createMutation.mutateAsync(payload);
      
      toast.success('Réservation effectuée avec succès');
      navigate('/mes-reservations');
    } catch (error) {
      console.error('Erreur réservation complète:', error);
      console.error('Détails erreur backend (full):', JSON.stringify(error.response?.data, null, 2));
      console.error('Statut:', error.response?.status);
      
      if (error.response?.data) {
        // Si c'est un tableau d'erreurs (DRF validation errors)
        if (Array.isArray(error.response.data)) {
          setErrors({ general: error.response.data.join(', ') });
        } else if (typeof error.response.data === 'object') {
          setErrors(error.response.data);
        } else {
          setErrors({ general: String(error.response.data) });
        }
        toast.error('Vérifiez les champs du formulaire');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="nom_locataire" className="form-label">
            Nom complet *
          </label>
          <input
            type="text"
            id="nom_locataire"
            name="nom_locataire"
            className={`form-control ${errors.nom_locataire ? 'error' : ''}`}
            value={formData.nom_locataire}
            onChange={handleChange}
            required
          />
          {errors.nom_locataire && (
            <div className="form-error">{errors.nom_locataire}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email_locataire" className="form-label">
            Email *
          </label>
          <input
            type="email"
            id="email_locataire"
            name="email_locataire"
            className={`form-control ${errors.email_locataire ? 'error' : ''}`}
            value={formData.email_locataire}
            onChange={handleChange}
            required
          />
          {errors.email_locataire && (
            <div className="form-error">{errors.email_locataire}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="telephone_locataire" className="form-label">
          Téléphone *
        </label>
        <input
          type="tel"
          id="telephone_locataire"
          name="telephone_locataire"
          className={`form-control ${errors.telephone_locataire ? 'error' : ''}`}
          value={formData.telephone_locataire}
          onChange={handleChange}
          required
        />
        {errors.telephone_locataire && (
          <div className="form-error">{errors.telephone_locataire}</div>
        )}
      </div>

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
          onClick={() => navigate(`/appartements/${appartementSlug}`)}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default ReservationForm;