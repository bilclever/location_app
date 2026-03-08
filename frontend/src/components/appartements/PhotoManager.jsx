import React, { useState } from 'react';
import { useUploadPhoto } from '../../hooks/useAppartements';

const PhotoManager = ({ appartement }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const uploadPhotoMutation = useUploadPhoto();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Créer des aperçus
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      formData.append('photo', selectedFiles[i]);

      try {
        await uploadPhotoMutation.mutateAsync({ 
          slug: appartement.slug, 
          formData 
        });
      } catch (error) {
        console.error(`Erreur lors de l'upload de la photo ${i + 1}:`, error);
      }
    }

    // Réinitialiser
    setSelectedFiles([]);
    setPreviewUrls([]);
    
    // Nettoyer les URLs d'aperçu
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const allPhotos = [
    ...(appartement.photoPrincipaleUrl ? [{
      url: appartement.photoPrincipaleUrl,
      isPrincipal: true,
      legende: 'Photo principale'
    }] : []),
    ...(appartement.photos?.map(p => ({
      url: typeof p === 'string' ? p : p.image,
      id: p.id,
      legende: p.legende || ''
    })) || [])
  ];

  return (
    <div className="photo-manager">
      <div className="card">
        <div className="card-header">
          <h3>Gestion des photos</h3>
        </div>

        <div className="card-body">
          {/* Photos existantes */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Photos actuelles ({allPhotos.length})</h4>
            {allPhotos.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {allPhotos.map((photo, index) => (
                  <div key={photo.id || index} style={{ position: 'relative' }}>
                    <img
                      src={photo.url}
                      alt={photo.legende || `Image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: photo.isPrincipal ? '3px solid #3b82f6' : 'none'
                      }}
                    />
                    {photo.isPrincipal && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>Aucune photo pour cet appartement</p>
            )}
          </div>

          {/* Ajouter de nouvelles photos */}
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Ajouter des photos</h4>
            
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="form-control"
                disabled={uploadPhotoMutation.isLoading}
              />
              <div className="form-hint">
                Vous pouvez sélectionner plusieurs photos à la fois
              </div>
            </div>

            {/* Aperçus des photos à uploader */}
            {previewUrls.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                  Photos sélectionnées ({previewUrls.length})
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {previewUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Aperçu ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploadPhotoMutation.isLoading}
                  >
                    {uploadPhotoMutation.isLoading ? 'Upload en cours...' : 'Uploader les photos'}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCancel}
                    disabled={uploadPhotoMutation.isLoading}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .photo-manager h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }
      `}</style>
    </div>
  );
};

export default PhotoManager;
