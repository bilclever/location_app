from django.contrib import admin
from django.utils.html import format_html
from .models import User, Appartement, Photo, Location, Favori


# 1. Gestion des photos secondaires (Gallery)
class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 3  # Affiche 3 emplacements vides pour ajouter des photos
    fields = ('image', 'apercu', 'ordre', 'legende')
    readonly_fields = ('apercu',)

    def apercu(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 100px; height: auto; border-radius: 4px;" />',
                               obj.image.url)
        return "Pas encore d'image"


@admin.register(Appartement)
class AppartementAdmin(admin.ModelAdmin):
    # Affichage dans la liste
    list_display = ('titre', 'ville', 'loyer_mensuel', 'disponible', 'proprietaire', 'apercu_principale')

    # Organisation du formulaire de modification
    fieldsets = (
        ('Informations Principales', {
            'fields': ('proprietaire', 'titre', 'slug', 'description', 'disponible')
        }),
        ('Localisation', {
            'fields': ('adresse', 'ville', 'code_postal')
        }),
        ('Prix et Caractéristiques', {
            'fields': (('loyer_mensuel', 'caution'), ('surface', 'nb_pieces'))
        }),
        ('PHOTO PRINCIPALE (Obligatoire)', {
            'fields': ('photo_principale',),
            'description': "C'est la photo qui s'affichera sur les cartes de recherche."
        }),
        ('Statistiques', {
            'fields': ('nb_vues', 'nb_favoris'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('nb_vues', 'nb_favoris')
    prepopulated_fields = {'slug': ('titre',)}

    # 2. ICI ON AJOUTE LES PHOTOS SECONDAIRES
    inlines = [PhotoInline]

    def apercu_principale(self, obj):
        if obj.photo_principale:
            return format_html('<img src="{}" style="width: 50px; height: 35px; object-fit: cover;" />',
                               obj.photo_principale.url)
        return "🚫"

    apercu_principale.short_description = 'Photo P.'


# Pour les autres modèles
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'plan', 'is_admin')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('appartement', 'nom_locataire', 'statut', 'date_debut')


@admin.register(Favori)
class FavoriAdmin(admin.ModelAdmin):
    list_display = ('locataire', 'appartement', 'date_ajout')
