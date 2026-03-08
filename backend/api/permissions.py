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

        if hasattr(obj, 'user') and obj.user == request.user:
            return True

        if hasattr(obj, 'locataire') and obj.locataire and obj.locataire == request.user:
            return True

        if hasattr(obj, 'appartement') and obj.appartement and obj.appartement.proprietaire:
            if obj.appartement.proprietaire == request.user:
                return True

        return False


class IsProprietaire(permissions.BasePermission):
    """
    Vérifie si l'utilisateur est un propriétaire
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsLocataire(permissions.BasePermission):
    """
    Vérifie si l'utilisateur est un locataire
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class CanManageAppartement(permissions.BasePermission):
    """
    Permission pour gérer un appartement
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        return bool(obj.proprietaire == request.user)


class IsPremiumUser(permissions.BasePermission):
    """
    Acces reserve aux utilisateurs premium.
    Les admins conservent l'acces.
    """

    message = "Cette fonctionnalite est reservee au plan premium."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'is_staff', False):
            return True

        return getattr(user, 'plan', 'free') == 'premium'