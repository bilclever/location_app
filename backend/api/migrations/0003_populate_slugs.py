from django.db import migrations


def generate_unique_slug(apps, schema_editor):
    Appartement = apps.get_model('api', 'Appartement')
    from django.utils.text import slugify

    for obj in Appartement.objects.all():
        try:
            if not getattr(obj, 'slug', None) and getattr(obj, 'titre', None):
                base = slugify(obj.titre)[:200]
                slug_candidate = base
                counter = 1
                # Ensure uniqueness
                while Appartement.objects.filter(slug=slug_candidate).exclude(pk=obj.pk).exists():
                    slug_candidate = f"{base}-{counter}"
                    counter += 1
                obj.slug = slug_candidate
                obj.save(update_fields=['slug'])
        except Exception:
            # Skip problematic rows to avoid migration failure; can be logged later
            continue


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_add_slug'),
    ]

    operations = [
        migrations.RunPython(generate_unique_slug, reverse_code=migrations.RunPython.noop),
    ]
