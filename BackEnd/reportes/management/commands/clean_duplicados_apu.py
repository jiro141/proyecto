from django.core.management.base import BaseCommand, CommandError
from reportes.models import APU


class Command(BaseCommand):
    help = "Elimina APUs duplicados en un reporte (misma descripcion), conservando el de mayor numero"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reporte",
            type=int,
            required=True,
            help="ID del reporte al que limpiarle los APUs duplicados",
        )

    def handle(self, *args, **options):
        reporte_id = options["reporte"]

        apus = APU.objects.filter(reporte_id=reporte_id).order_by("numero")

        if not apus.exists():
            self.stdout.write(self.style.WARNING(f"No se encontraron APUs para el reporte {reporte_id}"))
            return

        self.stdout.write(f"Total APUs en reporte {reporte_id}: {apus.count()}")

        # Agrupar por descripcion (case-insensitive, trimmed)
        grupos = {}
        for apu in apus:
            key = (apu.descripcion or "").strip().lower()
            if key not in grupos:
                grupos[key] = []
            grupos[key].append(apu)

        total_eliminados = 0
        total_kept = 0

        for desc, group in grupos.items():
            if len(group) > 1:
                # Ordenar por numero descendente para quedarnos con el mas alto
                sorted_group = sorted(group, key=lambda a: a.numero or 0, reverse=True)
                keep = sorted_group[0]
                to_delete = sorted_group[1:]

                for dup in to_delete:
                    dup.delete()
                    total_eliminados += 1
                    self.stdout.write(
                        f"  Eliminado APU #{dup.id} (numero={dup.numero}) - \"{desc[:60]}...\""
                    )

                total_kept += 1
                self.stdout.write(
                    f"  Conservado APU #{keep.id} (numero={keep.numero}) - \"{desc[:60]}...\""
                )
            else:
                total_kept += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nResumen: {total_kept - total_eliminados} APUs unicos conservados, "
            f"{total_eliminados} duplicados eliminados."
        ))

        # Recalcular totales del reporte
        reporte = apus.first().reporte
        reporte.recalcular_total()
        self.stdout.write(self.style.SUCCESS(f"Totales del reporte recalculados."))
