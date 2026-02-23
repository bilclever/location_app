from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Lecture autorisée pour tous
    Écriture réservée aux administrateurs
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Les propriétaires peuvent modifier leurs ressources
    Les admins ont tous les droits
    """
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Vérifier si l'utilisateur est le propriétaire
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'locataire') and obj.locataire:
            return obj.locataire.user == request.user
        elif hasattr(obj, 'appartement') and obj.appartement.proprietaire:
            return obj.appartement.proprietaire.user == request.user
        
        return False


class IsProprietaire(permissions.BasePermission):
    """
    Vérifie si l'utilisateur est un propriétaire
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated 
                and request.user.role == 'PROPRIETAIRE')


class IsLocataire(permissions.BasePermission):
    """
    Vérifie si l'utilisateur est un locataire
    """
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated 
                and request.user.role == 'LOCATAIRE')


class CanManageAppartement(permissions.BasePermission):
    """
    Permission pour gérer un appartement
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        if request.user.role == 'PROPRIETAIRE':
            try:
                proprietaire = request.user.profil_proprietaire
                return obj.proprietaire == proprietaire
            except:
                return False
        
        return False