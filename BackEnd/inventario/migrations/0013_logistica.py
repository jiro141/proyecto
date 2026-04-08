from django.db import migrations, models
from decimal import Decimal


def crear_logistica(apps, schema_editor):
    Logistica = apps.get_model('inventario', 'Logistica')
    
    logistica = [
        {'descripcion': 'ALIMENTACION', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('15.00'), 'item_fijo': True},
        {'descripcion': 'HOTEL', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('13.00'), 'item_fijo': True},
        {'descripcion': 'VARIOS', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('3.00'), 'item_fijo': True},
    ]
    
    for l in logistica:
        Logistica.objects.create(**l)


def eliminar_logistica(apps, schema_editor):
    Logistica = apps.get_model('inventario', 'Logistica')
    Logistica.objects.filter(item_fijo=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0012_empleado'),
    ]

    operations = [
        migrations.CreateModel(
            name='Logistica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.CharField(max_length=255)),
                ('unidad', models.CharField(default='DIA', max_length=20)),
                ('cantidad', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('precio_unitario', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('item_fijo', models.BooleanField(default=False, help_text='Indica si es un ítem fijo del sistema.')),
            ],
            options={
                'verbose_name': 'Logística',
                'verbose_name_plural': 'Logística',
                'ordering': ('descripcion',),
            },
        ),
        migrations.RunPython(crear_logistica, eliminar_logistica),
    ]
