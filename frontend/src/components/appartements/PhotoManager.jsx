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

  return (
    <div className="photo-manager">
      <div className="card">
        <div className="card-header">
          <h3>Ajouter des photos</h3>
        </div>

        <div className="card-body">
          {/* Ajouter de nouvelles photos */}
          <div>
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
    </div>
  );
};

export default PhotoManager;
