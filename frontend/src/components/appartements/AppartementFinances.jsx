import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { formatters } from '../../utils/formatters';
import QuickExpenseForm from './QuickExpenseForm';
import {
  usePremiumComptaEntries,
  useCreatePremiumComptaEntry
} from '../../hooks/usePremium';
import LoadingSpinner from '../common/LoadingSpinner';

const AppartementFinances = ({ bienId }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, DEPENSE, REVENU
  
  // Si pas de bienId, on récupère quand même les données (sera vide)
  const { data: comptaData, isLoading } = usePremiumComptaEntries(
    bienId ? { bien_id: bienId, page_size: 20 } : { page_size: 20 }
  );
  const createEntryMutation = useCreatePremiumComptaEntry();

  const entries = Array.isArray(comptaData) 
    ? comptaData 
    : comptaData?.results || [];

  const filteredEntries = filter === 'ALL' 
    ? entries 
    : entries.filter(e => e.type_ecriture === filter);

  const totalDepenses = entries
    .filter(e => e.type_ecriture === 'DEPENSE')
    .reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);

  const totalRevenus = entries
    .filter(e => e.type_ecriture === 'REVENU')
    .reduce((sum, e) => sum + parseFloat(e.montant || 0), 0);

  const solde = totalRevenus - totalDepenses;

  const handleCreateEntry = async (data) => {
    if (!bienId) {
      toast.error('Cet appartement n\'est pas encore lie a un bien Premium.');
      return;
    }

    await createEntryMutation.mutateAsync(data);
    setShowForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Comptabilité</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            ...styles.toggleButton,
            backgroundColor: showForm ? '#6c757d' : '#f2a65a',
          }}
        >
          {showForm ? 'Annuler' : '+ Nouvelle '}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '0.5rem' }}>
          <QuickExpenseForm
            bienId={bienId}
            onSubmit={handleCreateEntry}
            isLoading={createEntryMutation.isLoading}
          />
        </div>
      )}

      {/* Résumé financier */}
      <div style={styles.summaryGrid}>
        <div style={{...styles.summaryCard, borderLeftColor: '#2f9c75'}}>
          <div style={styles.summaryLabel}>Revenus</div>
          <div style={{...styles.summaryValue, color: '#2f9c75'}}>
            {formatters.price(totalRevenus)}
          </div>
        </div>
        <div style={{...styles.summaryCard, borderLeftColor: '#e0565b'}}>
          <div style={styles.summaryLabel}>Dépenses</div>
          <div style={{...styles.summaryValue, color: '#e0565b'}}>
            {formatters.price(totalDepenses)}
          </div>
        </div>
        <div style={{
          ...styles.summaryCard,
          borderLeftColor: solde >= 0 ? '#4c8ea3' : '#f0b04b'
        }}>
          <div style={styles.summaryLabel}>Solde</div>
          <div style={{
            ...styles.summaryValue,
            color: solde >= 0 ? '#4c8ea3' : '#f0b04b'
          }}>
            {formatters.price(solde)}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.filters}>
        <button
          onClick={() => setFilter('ALL')}
          style={{
            ...styles.filterButton,
            ...(filter === 'ALL' ? styles.filterButtonActive : {}),
          }}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('REVENU')}
          style={{
            ...styles.filterButton,
            ...(filter === 'REVENU' ? styles.filterButtonActive : {}),
          }}
        >
          Revenus
        </button>
        <button
          onClick={() => setFilter('DEPENSE')}
          style={{
            ...styles.filterButton,
            ...(filter === 'DEPENSE' ? styles.filterButtonActive : {}),
          }}
        >
          Dépenses
        </button>
      </div>

      {/* Liste des opérations */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredEntries.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Aucune opération enregistrée</p>
        </div>
      ) : (
        <div style={styles.entriesList}>
          {filteredEntries.map((entry) => (
            <div key={entry.id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <div style={styles.entryInfo}>
                  <span style={{
                    ...styles.entryType,
                    backgroundColor: entry.type_ecriture === 'REVENU' 
                      ? 'rgba(47, 156, 117, 0.15)' 
                      : 'rgba(224, 86, 91, 0.15)',
                    color: entry.type_ecriture === 'REVENU' 
                      ? '#245e52' 
                      : '#b8444a',
                  }}>
                    {entry.type_ecriture === 'REVENU' ? '↑' : '↓'} {entry.type_ecriture}
                  </span>
                  <span style={styles.entryDate}>
                    {formatters.date(entry.date_operation)}
                  </span>
                </div>
                <div style={{
                  ...styles.entryAmount,
                  color: entry.type_ecriture === 'REVENU' ? '#2f9c75' : '#e0565b',
                }}>
                  {entry.type_ecriture === 'REVENU' ? '+' : '-'}{formatters.price(entry.montant)}
                </div>
              </div>
              <div style={styles.entryBody}>
                <div style={styles.entryLibelle}>{entry.libelle}</div>
                {entry.categorie && (
                  <div style={styles.entryCategory}>
                    {entry.categorie.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '0.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    padding: '0.5rem 1rem',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '6px',
    padding: '0.4rem',
    borderLeft: '4px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#6c757d',
    marginBottom: '0.25rem',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '1.1rem',
    fontWeight: '700',
  },
  filters: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '0.4rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '0.4rem 0.8rem',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#f2a65a',
    color: '#fff',
    borderColor: '#f2a65a',
  },
  entriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  entryCard: {
    background: '#fff',
    borderRadius: '6px',
    padding: '0.4rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.3rem',
  },
  entryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  entryType: {
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  entryDate: {
    fontSize: '0.8rem',
    color: '#6c757d',
  },
  entryAmount: {
    fontSize: '1rem',
    fontWeight: '700',
  },
  entryBody: {
    borderTop: '1px solid #e9ecef',
    paddingTop: '0.3rem',
  },
  entryLibelle: {
    fontSize: '0.875rem',
    color: '#333',
    marginBottom: '0.25rem',
  },
  entryCategory: {
    fontSize: '0.75rem',
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6c757d',
    background: '#fff',
    borderRadius: '6px',
  },
  alert: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    padding: '1rem',
  },
  alertText: {
    margin: 0,
    color: '#856404',
  },
};

export default AppartementFinances;
