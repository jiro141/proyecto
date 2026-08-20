from django.db import migrations
from django.db.models import Count, Q


def _legacy_facturas(Factura):
    """Facturas legacy emitidas en modo descripción completa:
    exactamente un item con apu=NULL, unidad='global' y cantidad=1."""
    return (
        Factura.objects.annotate(
            total_items=Count("items"),
            signature_items=Count(
                "items",
                filter=Q(items__apu__isnull=True, items__unidad="global", items__cantidad=1),
            ),
        )
        .filter(total_items=1, signature_items=1)
    )


def forwards(apps, schema_editor):
    Factura = apps.get_model("facturacion", "Factura")
    ids = list(
        _legacy_facturas(Factura)
        .filter(factura_completa=False)
        .values_list("id", flat=True)
    )
    Factura.objects.filter(id__in=ids).update(factura_completa=True)


def reverse(apps, schema_editor):
    Factura = apps.get_model("facturacion", "Factura")
    ids = list(_legacy_facturas(Factura).values_list("id", flat=True))
    Factura.objects.filter(id__in=ids).update(factura_completa=False)


class Migration(migrations.Migration):

    dependencies = [
        ("facturacion", "0005_factura_factura_completa"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse),
    ]