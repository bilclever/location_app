# Adaptation Frontend - Supabase Auth & Modèle Utilisateur Unifié

## Vue d'ensemble
Le frontend a été adapté pour supporter le nouveau modèle utilisateur unifié avec Supabase Auth, où un utilisateur unique peut à la fois publier des appartements (propriétaire) ET effectuer des locations (locataire).

## Changements effectués

### 1. **hooks/useAuth.js**
- **Suppression** : Suppression des propriétés `isLocataire`, `isProprietaire` et `isAdmin`
- **Raison** : Un utilisateur unique peut maintenant faire les deux actions
- **Nouveau modèle** : 
  ```javascript
  // Retourne maintenant:
  const auth = {
    user,                    // Profil utilisateur
    isAuthenticated,        // Booléen simple
    // Les rôles ne sont plus utilisés pour contrôler les actions
  }
  ```

### 2. **components/common/PrivateRoute.jsx**
- **Suppression** : Paramètre `roles = []` pour vérification de rôles
- **Nouveau comportement** : 
  - Vérifie uniquement l'authentification `isAuthenticated`
  - Plus de vérification basée sur les rôles
  - Toutes les routes protégées ne vérifient que l'authentification

### 3. **App.jsx**
- **Adaptation** : Suppression des `roles` des `<PrivateRoute>`
  ```jsx
  // Avant:
  <PrivateRoute roles={['PROPRIETAIRE', 'LOCATAIRE']}>
  
  // Après:
  <PrivateRoute>
  ```

### 4. **components/common/Header.jsx**
- **Changement** : Les deux menus s'affichent maintenant pour les utilisateurs authentifiés
  ```jsx
  // Affiche maintenant:
  - Favoris
  - Mes réservations
  - Tableau de bord        // Pour les annonces (propriétaire)
  - Administration        // Seulement pour ADMIN
  ```

### 5. **pages/DashboardPage.jsx**
- **Ajout** : Système d'onglets pour afficher les deux dashboards
  ```jsx
  // Onglet 1: "Mes Annonces" → ProprietaireDashboard
  // Onglet 2: "Mes Réservations" → LocataireDashboard
  ```
- Les deux parties sont maintenant accessibles dans une seule page

### 6. **components/locations/LocationCard.jsx**
- **Changement** : Ajout du prop `isOwnProperty` pour déterminer les actions
  ```jsx
  <LocationCard 
    location={location}
    isOwnProperty={true}  // Si je suis propriétaire de ce bien
  />
  ```
- **Logique** : 
  - Actions propriétaire affichées si `isOwnProperty === true`
  - Actions locataire affichées si l'utilisateur a créé la réservation

### 7. **components/appartements/AppartementCard.jsx**
- **Changement** : Bouton Favoris affichable pour tous les utilisateurs authentifiés
  ```jsx
  // Avant: Affichage si user?.role === 'LOCATAIRE'
  // Après: Affichage si isAuthenticated
  ```

## Architecture du modèle unifié

### Flux d'authentification
```
Login/Register (Supabase)
    ↓
accessToken + refreshToken stockés
    ↓
GET /api/auth/profile/
    ↓
User avec potentiellement role ADMIN seulement
    ↓
Les actions sont déterminées par le contexte:
- Property Owner: Vérifiée via isOwnProperty (prop ou API)
- Locataire: Vérifiée via la création de la réservation
```

## Points d'attention pour le backend

### 1. **Authentification Supabase**
- L'API doit valider le JWT Supabase dans `Authorization: Bearer <token>`
- Supprimer la gestion des rôles PROPRIETAIRE/LOCATAIRE côté authentification
- Garder le rôle ADMIN si nécessaire pour l'administration

### 2. **Endpoints à adapter**
```
POST /api/auth/login/      → Avec Supabase, peut retourner les infos utilisateur
POST /api/auth/register/   → Enregistrement Supabase
GET /api/auth/profile/     → Profil unifié de l'utilisateur

PUT /api/auth/profile/     → Mise à jour profil utilisateur
POST /api/auth/logout/     → Déconnexion
```

### 3. **Propriété des ressources**
- **Appartements** : L'API doit vérifier que l'utilisateur est le propriétaire
- **Locations** : L'API doit vérifier que l'utilisateur est le locataire OU le propriétaire du bien

### 4. **Structure utilisateur attendue**
```javascript
{
  id: number,
  username: string,
  email: string,
  role: "ADMIN" | null,  // Seulement pour admins
  telephone: string,
  adresse: string,
  photo_profil: string,
  favoris: number[],     // IDs des appartements en favoris
  // ... autres champs
}
```

## Migration des données

### Checklist avant déploiement
- [ ] Vérifier que Supabase Auth est configuré
- [ ] Tester le login/register avec Supabase
- [ ] Valider que le profil utilisateur retourne les bonnes données
- [ ] Vérifier la gestion des favoris pour tous les utilisateurs
- [ ] Tester le Dashboard avec onglets
- [ ] Tester la gestion des locations (en tant que proprio et locataire)

## Changements non effectués (à considérer)

### AdminPage
- Reste inchangée pour l'instant
- À adapter si le backend change la gestion des rôles ADMIN

### Permissions Backend
- Le frontend suppose que le backend valide les permissions
- Exemple : Seul le propriétaire peut modifier/supprimer un appartement
- Exemple : Seul le locataire peut annuler sa réservation

## Conseils pour les tests

```bash
# Teste les scénarios suivants:
1. Utilisateur non authentifié:
   - Voir les appartements ✓
   - Clic sur "Mes réservations" → Redirection login ✓
   - Clic sur "Tableau de bord" → Redirection login ✓

2. Utilisateur authentifié (locataire):
   - Voir "Favoris" dans le menu ✓
   - Voir "Mes réservations" dans le menu ✓
   - Voir "Tableau de bord" avec onglets ✓
   - Favoriser un appartement ✓

3. Utilisateur authentifié (avec appartements):
   - Voir "Tableau de bord" avec onglet "Mes Annonces" ✓
   - Gérer ses locations depuis les onglets ✓

4. Admin:
   - Voir lien "Administration" ✓
```

## Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [API REST Endpoints](./API_ENDPOINTS.md)
