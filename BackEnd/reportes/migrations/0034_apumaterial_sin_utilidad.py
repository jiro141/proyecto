from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reportes', '0033_alter_reporte_forma_pago'),
    ]

    operations = [
        migrations.AddField(
            model_name='apumaterial',
            name='sin_utilidad',
            field=models.BooleanField(default=False, help_text='Si está activo, el material de ferretería usa el costo sin el 15% de utilidad'),
        ),
    ]
