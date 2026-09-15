from django.core.management.base import BaseCommand

from reportes.models import EstadoChoices, Reporte


class Command(BaseCommand):
    help = (
        "Recorre los presupuestos en estado EJECUTADO y recalcula su estado. "
        "Pasa a PAGADO los que ya tengan saldo pendiente en 0 (backfill para "
        "presupuestos que quedaron pagados antes de conectar la logica "
        "automatica al registrar abonos)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo muestra que presupuestos cambiarian, sin guardar nada.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        reportes = Reporte.objects.filter(estado=EstadoChoices.EJECUTADO)
        total = reportes.count()
        self.stdout.write(f"Presupuestos en EJECUTADO a revisar: {total}")

        actualizados = 0

        for reporte in reportes:
            if reporte.total_reporte > 0 and reporte.saldo_pendiente <= 0:
                self.stdout.write(
                    f"  #{reporte.n_presupuesto} ({reporte.cliente.nombre}) "
                    f"- total {reporte.total_reporte}, saldo {reporte.saldo_pendiente} "
                    f"-> PAGADO"
                )
                actualizados += 1
                if not dry_run:
                    reporte.recalcular_total()

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n[dry-run] {actualizados} presupuesto(s) pasarian a PAGADO. "
                f"Nada se guardo."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\n{actualizados} presupuesto(s) actualizado(s) a PAGADO."
            ))
