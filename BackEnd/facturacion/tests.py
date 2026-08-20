from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from reportes.models import Cliente, Reporte, EstadoChoices, APU
from .models import Factura, FacturaItem, FacturaConfig, EstadoFactura


class FacturaBaseTestCase(TestCase):
    def setUp(self):
        self.cliente = Cliente.objects.create(
            nombre="Cliente Test",
            rif="J-12345678-9",
            encargado="Encargado Test",
            telefono="0412-0000000",
            direccion="Calle Test 123",
            correo_electronico="cliente@test.com",
        )
        self.reporte = Reporte.objects.create(
            cliente=self.cliente,
            n_presupuesto="1",
            estado=EstadoChoices.EJECUTADO,
            total_reporte=Decimal("1000.00"),
        )
        self.apu = APU.objects.create(
            reporte=self.reporte,
            numero=1,
            descripcion="APU Test",
            unidad="M2",
            cantidad=Decimal("10.00"),
            precio_unitario=Decimal("100.00"),
        )
        FacturaConfig.objects.create(serie="A", punto_inicio=1)
        self.client = APIClient()


class FacturaModelTests(FacturaBaseTestCase):
    def test_numeracion_secuencial(self):
        f1 = Factura.objects.create(reporte=self.reporte, fecha="2026-01-01")
        f2 = Factura.objects.create(reporte=self.reporte, fecha="2026-01-02")

        self.assertEqual(f1.n_factura, "A-0001")
        self.assertEqual(f2.n_factura, "A-0002")

    def test_snapshot_cliente(self):
        f = Factura.objects.create(reporte=self.reporte, fecha="2026-01-01")
        self.assertEqual(f.cliente_nombre, "Cliente Test")
        self.assertEqual(f.cliente_rif, "J-12345678-9")


class FacturaApiTests(FacturaBaseTestCase):
    def test_crear_factura_con_items(self):
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "porcentaje_descuento": "10.00",
            "monto_iva": "0.00",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "unidad": "M2",
                    "cantidad": "5",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        factura = Factura.objects.get(pk=response.data["id"])
        self.assertEqual(factura.n_factura, "A-0001")
        self.assertEqual(factura.subtotal, Decimal("500.00"))
        self.assertEqual(factura.monto_descuento, Decimal("50.00"))
        self.assertEqual(factura.total, Decimal("450.00"))

    def test_no_factura_presupuesto_no_ejecutado(self):
        self.reporte.estado = EstadoChoices.EN_ESPERA
        self.reporte.save()

        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "1",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_excede_pendiente(self):
        # Primera factura factura 6 de 10
        payload1 = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "6",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response1 = self.client.post("/api/facturas/", payload1, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Segunda factura intenta facturar 5 → excede pendiente (quedan 4)
        payload2 = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-20",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "5",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response2 = self.client.post("/api/facturas/", payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anular_libera_pendiente(self):
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "4",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        factura_id = response.data["id"]

        anular = self.client.post(f"/api/facturas/{factura_id}/anular/")
        self.assertEqual(anular.status_code, status.HTTP_200_OK)
        self.assertEqual(anular.data["estado"], "ANULADA")

        # Tras anular, se puede facturar de nuevo hasta 10
        payload2 = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-21",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "10",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response2 = self.client.post("/api/facturas/", payload2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

    def test_factura_completa_construye_linea_desde_reporte(self):
        # El backend debe IGNORAR los items enviados y usar el reporte real.
        self.reporte.descripcion = "Servicio de remodelación completo"
        self.reporte.total_reporte = Decimal("1000.00")
        self.reporte.save()

        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "factura_completa": True,
            # Items manipulados a propósito: deben ser ignorados
            "items": [
                {
                    "apu_id": None,
                    "apu_descripcion": "Monto falso",
                    "unidad": "UND",
                    "cantidad": "1",
                    "precio_unitario": "0.01",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        factura = Factura.objects.get(pk=response.data["id"])
        items = factura.items.all()

        # Un solo item, construido desde el reporte
        self.assertEqual(items.count(), 1)
        item = items.first()
        self.assertEqual(item.apu, None)
        self.assertEqual(item.apu_descripcion, "Servicio de remodelación completo")
        self.assertEqual(item.unidad, "global")
        self.assertEqual(item.cantidad, Decimal("1.00"))
        self.assertEqual(item.precio_unitario, Decimal("1000.00"))
        self.assertEqual(item.total_item, Decimal("1000.00"))

        # Descuento en 0; IVA 16% sobre total_reporte; total = total + IVA
        self.assertEqual(factura.porcentaje_descuento, Decimal("0.00"))
        self.assertEqual(factura.subtotal, Decimal("1000.00"))
        self.assertEqual(factura.monto_iva, Decimal("160.00"))
        self.assertEqual(factura.monto_descuento, Decimal("0.00"))
        self.assertEqual(factura.total, Decimal("1160.00"))

    def test_crear_factura_con_orden_control(self):
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "orden_control": "OC-100",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "unidad": "M2",
                    "cantidad": "1",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        factura = Factura.objects.get(pk=response.data["id"])
        self.assertEqual(factura.orden_control, "OC-100")
        # n_factura lo genera el backend
        self.assertEqual(factura.n_factura, "A-0001")

    def test_no_se_puede_setear_n_factura_manual_via_api(self):
        # Aunque se envíe n_factura manual, el backend lo ignora y genera el siguiente
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "n_factura": "Z-9999",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "1",
                    "precio_unitario": "100.00",
                }
            ],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        factura = Factura.objects.get(pk=response.data["id"])
        # Se ignora "Z-9999" → genera la siguiente de la serie configurada (A)
        self.assertEqual(factura.n_factura, "A-0001")
        self.assertEqual(factura.serie, "A")
        self.assertEqual(factura.numero, 1)

    def test_actualizar_orden_control_via_api(self):
        factura = Factura.objects.create(reporte=self.reporte, fecha="2026-01-01")
        factura.orden_control = "OC-1"
        factura.save()

        response = self.client.patch(
            f"/api/facturas/{factura.id}/",
            {"fecha": "2026-01-01", "orden_control": "OC-2"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        factura.refresh_from_db()
        self.assertEqual(factura.orden_control, "OC-2")
        # n_factura no se puede modificar
        self.assertEqual(factura.n_factura, "A-0001")

    def test_presupuestos_disponibles_solo_ejecutado_con_pendiente(self):
        response = self.client.get("/api/facturas/presupuestos-disponibles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["n_presupuesto"], "1")
        # Pendiente > 0 → facturable, NO facturado_completo
        self.assertFalse(response.data[0]["facturado_completo"])
        self.assertEqual(float(response.data[0]["pendiente_cantidad"]), 10.0)

        # Facturar todo por APUs → sin pendiente, pero el reporte SIGUE en la
        # lista con facturado_completo=true (ya no se puede facturar).
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "10",
                    "precio_unitario": "100.00",
                }
            ],
        }
        self.client.post("/api/facturas/", payload, format="json")
        response2 = self.client.get("/api/facturas/presupuestos-disponibles/")
        self.assertEqual(len(response2.data), 1)
        self.assertEqual(response2.data[0]["n_presupuesto"], "1")
        self.assertTrue(response2.data[0]["facturado_completo"])
        self.assertEqual(float(response2.data[0]["pendiente_cantidad"]), 0.0)

    def test_presupuesto_con_pendiente_aparece_con_facturado_completo_false(self):
        # Presupuesto EJECUTADO con APU sin facturar → facturado_completo false
        self.reporte.descripcion = "Solo pendiente"
        self.reporte.save()
        response = self.client.get("/api/facturas/presupuestos-disponibles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = next((r for r in response.data if r["id"] == self.reporte.id), None)
        self.assertIsNotNone(item)
        self.assertFalse(item["facturado_completo"])
        self.assertEqual(float(item["pendiente_cantidad"]), 10.0)

    def test_factura_completa_por_descripcion_marca_presupuesto_facturado_completo(self):
        self.reporte.descripcion = "Servicio completo"
        self.reporte.total_reporte = Decimal("1000.00")
        self.reporte.save()

        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "factura_completa": True,
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Se persiste el flag en el modelo
        factura = Factura.objects.get(pk=response.data["id"])
        self.assertTrue(factura.factura_completa)

        # El presupuesto sigue en la lista pero con facturado_completo=true
        response2 = self.client.get("/api/facturas/presupuestos-disponibles/")
        item = next((r for r in response2.data if r["id"] == self.reporte.id), None)
        self.assertIsNotNone(item)
        self.assertTrue(item["facturado_completo"])
        self.assertEqual(float(item["pendiente_cantidad"]), 0.0)

    def test_presupuesto_sin_apus_nunca_facturado_no_es_facturado_completo(self):
        # Un reporte EJECUTADO sin APUs y nunca facturado NO debe bloquear el
        # modo descripción completa → facturado_completo false.
        reporte_sin_apus = Reporte.objects.create(
            cliente=self.cliente,
            n_presupuesto="99",
            estado=EstadoChoices.EJECUTADO,
            total_reporte=Decimal("500.00"),
        )
        response = self.client.get("/api/facturas/presupuestos-disponibles/")
        item = next(
            (r for r in response.data if r["id"] == reporte_sin_apus.id), None
        )
        self.assertIsNotNone(item)
        self.assertFalse(item["facturado_completo"])
        self.assertEqual(float(item["pendiente_cantidad"]), 0.0)

        # Una vez facturado por descripción completa → facturado_completo true
        payload = {
            "reporte": reporte_sin_apus.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "factura_completa": True,
        }
        self.client.post("/api/facturas/", payload, format="json")
        response2 = self.client.get("/api/facturas/presupuestos-disponibles/")
        item2 = next(
            (r for r in response2.data if r["id"] == reporte_sin_apus.id), None
        )
        self.assertIsNotNone(item2)
        self.assertTrue(item2["facturado_completo"])

    def test_crear_factura_completa_persiste_flag_en_modelo(self):
        self.reporte.descripcion = "Servicio completo"
        self.reporte.total_reporte = Decimal("1000.00")
        self.reporte.save()

        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "factura_completa": True,
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["factura_completa"])

        factura = Factura.objects.get(pk=response.data["id"])
        self.assertTrue(factura.factura_completa)

        # Una factura normal (por APUs) NO marca el flag
        payload_normal = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-20",
            "moneda": "USD",
            "items": [
                {
                    "apu_id": self.apu.id,
                    "apu_descripcion": "APU Test",
                    "cantidad": "1",
                    "precio_unitario": "100.00",
                }
            ],
        }
        # En el mismo reporte, facturar por APUs ya no aplica (facturado_completo),
        # así que usamos un reporte nuevo para la factura normal.
        reporte2 = Reporte.objects.create(
            cliente=self.cliente,
            n_presupuesto="100",
            estado=EstadoChoices.EJECUTADO,
            total_reporte=Decimal("200.00"),
        )
        apu2 = APU.objects.create(
            reporte=reporte2,
            numero=1,
            descripcion="APU 2",
            unidad="UN",
            cantidad=Decimal("2.00"),
            precio_unitario=Decimal("100.00"),
        )
        payload_normal["reporte"] = reporte2.id
        payload_normal["items"][0]["apu_id"] = apu2.id
        response_normal = self.client.post("/api/facturas/", payload_normal, format="json")
        self.assertEqual(response_normal.status_code, status.HTTP_201_CREATED)
        factura_normal = Factura.objects.get(pk=response_normal.data["id"])
        self.assertFalse(factura_normal.factura_completa)

    def test_factura_completa_con_items_vacio_aceptada(self):
        # REPRODUCCIÓN DEL BUG REPORTADO: la frontend envía factura_completa=true
        # con items=[] en modo descripción completa. El backend NO debe exigir
        # items: debe construir la línea única desde el reporte.
        self.reporte.descripcion = "Servicio de remodelación completo"
        self.reporte.total_reporte = Decimal("1000.00")
        self.reporte.save()

        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "orden_servicio": "",
            "orden_control": "",
            "tasa_bs_usd": None,
            "fecha_tasa": None,
            "porcentaje_descuento": 0,
            "porcentaje_iva": 16,
            "monto_iva": 160.0,
            "factura_completa": True,
            "items": [],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["factura_completa"])

        factura = Factura.objects.get(pk=response.data["id"])
        self.assertTrue(factura.factura_completa)

        items = factura.items.all()
        self.assertEqual(items.count(), 1)
        item = items.first()
        self.assertEqual(item.apu, None)
        self.assertEqual(item.apu_descripcion, "Servicio de remodelación completo")
        self.assertEqual(item.unidad, "global")
        self.assertEqual(item.cantidad, Decimal("1.00"))
        self.assertEqual(item.precio_unitario, Decimal("1000.00"))
        self.assertEqual(item.total_item, Decimal("1000.00"))

        self.assertEqual(factura.porcentaje_descuento, Decimal("0.00"))
        self.assertEqual(factura.subtotal, Decimal("1000.00"))
        self.assertEqual(factura.monto_iva, Decimal("160.00"))
        self.assertEqual(factura.monto_descuento, Decimal("0.00"))
        self.assertEqual(factura.total, Decimal("1160.00"))

    def test_factura_normal_con_items_vacio_rechazada(self):
        # Modo APU (sin factura_completa) con items=[]: la validación de
        # "al menos un item" DEBE seguir aplicando.
        payload = {
            "reporte": self.reporte.id,
            "fecha": "2026-08-19",
            "moneda": "USD",
            "items": [],
        }
        response = self.client.post("/api/facturas/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.data)
        self.assertIn("al menos un item", str(response.data["items"]))
        self.assertEqual(Factura.objects.count(), 0)