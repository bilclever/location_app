from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    User, Proprietaire, Locataire, Appartement,
    Photo, Location, Favori
)


class CustomUserAdmin(UserAdmin):
    """
    Configuration de l'admin pour User
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'telephone', 'adresse', 'photo_profil', 
                      'date_naissance', 'verifie', 'notifications_email')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations personnelles', {
            'fields': ('first_name', 'last_name', 'email', 'role')
        }),
    )


@admin.register(Proprietaire)
class ProprietaireAdmin(admin.ModelAdmin):
    list_display = ['user', 'siret', 'raison_sociale', 'commission', 'total_appartements', 'date_inscription']
    search_fields = ['user__email', 'user__username', 'siret']
    list_filter = ['date_inscription']
    readonly_fields = ['total_appartements', 'total_reservations']


@admin.register(Locataire)
class LocataireAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'telephone', 'budget_max', 'total_reservations', 'date_inscription']
    search_fields = ['nom', 'email', 'user__username']
    list_filter = ['date_inscription']
    readonly_fields = ['total_reservations', 'total_depenses']


class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 1
    fields = ['image', 'legende', 'ordre']


@admin.register(Appartement)
class AppartementAdmin(admin.ModelAdmin):
    list_display = ['titre', 'ville', 'loyer_mensuel', 'proprietaire', 'disponible', 'nb_vues', 'apercu_photo']
    list_filter = ['disponible', 'ville', 'nb_pieces']
    search_fields = ['titre', 'description', 'adresse']
    list_editable = ['disponible']
    readonly_fields = ['nb_vues', 'nb_favoris', 'date_creation', 'date_modification']
    inlines = [PhotoInline]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('titre', 'description', 'proprietaire')
        }),
        ('Localisation', {
            'fields': ('adresse', 'ville', 'code_postal')
        }),
        ('Caractéristiques', {
            'fields': ('surface', 'nb_pieces', 'loyer_mensuel', 'caution')
        }),
        ('Disponibilité', {
            'fields': ('disponible',)
        }),
        ('Photos', {
            'fields': ('photo_principale',),
            'classes': ('collapse',)
        }),
        ('Statistiques', {
            'fields': ('nb_vues', 'nb_favoris'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def apercu_photo(self, obj):
        if obj.photo_principale:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;" />',
                obj.photo_principale.url
            )
        return "Pas de photo"
    apercu_photo.short_description = "Aperçu"


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['nom_locataire', 'appartement', 'date_debut', 'date_fin', 'statut', 'montant_total']
    list_filter = ['statut', 'date_debut', 'date_fin']
    search_fields = ['nom_locataire', 'email_locataire', 'appartement__titre']
    list_editable = ['statut']
    readonly_fields = ['date_reservation', 'montant_total', 'commission']
    
    fieldsets = (
        ('Locataire', {
            'fields': ('locataire', 'nom_locataire', 'email_locataire', 'telephone_locataire')
        }),
        ('Location', {
            'fields': ('appartement', 'date_debut', 'date_fin', 'statut', 'notes')
        }),
        ('Dates', {
            'fields': ('date_reservation', 'date_confirmation', 'date_paiement'),
            'classes': ('collapse',)
        }),
        ('Montants', {
            'fields': ('montant_total', 'commission'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirmer_locations', 'marquer_payees', 'annuler_locations']
    
    def confirmer_locations(self, request, queryset):
        queryset.update(statut='CONFIRME', date_confirmation=timezone.now())
    confirmer_locations.short_description = "Confirmer les locations sélectionnées"
    
    def marquer_payees(self, request, queryset):
        queryset.update(statut='PAYE', date_paiement=timezone.now())
    marquer_payees.short_description = "Marquer comme payées"
    
    def annuler_locations(self, request, queryset):
        queryset.update(statut='ANNULE')
    annuler_locations.short_description = "Annuler les locations"


@admin.register(Favori)
class FavoriAdmin(admin.ModelAdmin):
    list_display = ['locataire', 'appartement', 'date_ajout']
    list_filter = ['date_ajout']
    search_fields = ['locataire__nom', 'appartement__titre']