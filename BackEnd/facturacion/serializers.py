from rest_framework import serializers

from reportes.models import Reporte
from .models import Factura, FacturaItem, FacturaConfig, FacturaReporte
from .services import (
    validar_reporte_facturable,
    validar_items_factura,
    calcular_totales,
    crear_items_factura,
    reemplazar_items_factura,
)


# ============================================================
# 🧾 ITEM DE FACTURA
# ============================================================


class FacturaItemSerializer(serializers.ModelSerializer):
    apu_id = serializers.IntegerField(source="apu.id", read_only=True, allow_null=True)

    class Meta:
        model = FacturaItem
        fields = [
            "id",
            "apu_id",
            "apu_descripcion",
            "unidad",
            "cantidad",
            "precio_unitario",
            "total_item",
        ]
        read_only_fields = ["total_item"]


# ============================================================
# 🧾 FACTURA
# ============================================================


class FacturaSerializer(serializers.ModelSerializer):
    items = FacturaItemSerializer(many=True, read_only=True)

    # Escritura: presupuesto principal + lista completa de presupuestos
    reporte = serializers.IntegerField(write_only=True)
    reportes = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    # Lectura: info derivada
    n_presupuesto = serializers.CharField(source="reporte.n_presupuesto", read_only=True)
    n_presupuestos = serializers.SerializerMethodField(read_only=True)
    cliente_id = serializers.IntegerField(source="reporte.cliente.id", read_only=True)
    total_reporte = serializers.DecimalField(
        source="reporte.total_reporte", max_digits=14, decimal_places=2, read_only=True
    )
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    moneda_display = serializers.CharField(source="get_moneda_display", read_only=True)

    def get_n_presupuestos(self, obj):
        """Lista de n_presupuesto de todos los presupuestos de la factura."""
        ids = [
            fr.reporte.n_presupuesto
            for fr in obj.reportes_vinculados.select_related("reporte").all()
        ]
        return ids or [obj.reporte.n_presupuesto]

    class Meta:
        model = Factura
        fields = [
            "id",
            "reporte",
            "reportes",
            "n_presupuesto",
            "n_presupuestos",
            "cliente_id",
            "total_reporte",
            "serie",
            "numero",
            "n_factura",
            "orden_servicio",
            "orden_control",
            "factura_completa",
            "fecha",
            "moneda",
            "moneda_display",
            "tasa_bs_usd",
            "fecha_tasa",
            # Snapshot del cliente
            "cliente_nombre",
            "cliente_rif",
            "cliente_encargado",
            "cliente_telefono",
            "cliente_direccion",
            "cliente_correo",
            # Estado
            "estado",
            "estado_display",
            # Montos
            "porcentaje_descuento",
            "porcentaje_iva",
            "monto_iva",
            "subtotal",
            "monto_descuento",
            "total",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "serie",
            "numero",
            "cliente_nombre",
            "cliente_rif",
            "cliente_encargado",
            "cliente_telefono",
            "cliente_direccion",
            "cliente_correo",
            "estado",
            "subtotal",
            "monto_descuento",
            "total",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        from django.shortcuts import get_object_or_404

        # La fecha es obligatoria
        if not attrs.get("fecha"):
            raise serializers.ValidationError({"fecha": "La fecha es obligatoria."})

        # Si la moneda es BS, la tasa es obligatoria
        moneda = attrs.get("moneda", "USD")
        if moneda == "BS":
            if not attrs.get("tasa_bs_usd"):
                raise serializers.ValidationError(
                    {"tasa_bs_usd": "La tasa Bs/USD es obligatoria al facturar en Bolívares."}
                )

        # Normalizar la lista de presupuestos: si viene `reportes`, usarla;
        # si no, usar `reporte` como lista de un solo elemento.
        reportes_ids = attrs.pop("reportes", None)
        reporte_id = attrs.get("reporte")
        if reportes_ids:
            reportes_ids = list(dict.fromkeys([int(i) for i in reportes_ids]))
            if reporte_id not in reportes_ids:
                reportes_ids.insert(0, int(reporte_id))
        else:
            reportes_ids = [int(reporte_id)]

        if not reportes_ids:
            raise serializers.ValidationError(
                {"reporte": "Debe seleccionar al menos un presupuesto para facturar."}
            )

        reportes = []
        cliente_id = None
        for rid in reportes_ids:
            rep = get_object_or_404(Reporte, pk=rid)
            validar_reporte_facturable(rep)
            if cliente_id is None:
                cliente_id = rep.cliente_id
            elif rep.cliente_id != cliente_id:
                raise serializers.ValidationError(
                    {
                        "reportes": (
                            "Todos los presupuestos de una factura deben pertenecer "
                            "al mismo cliente."
                        )
                    }
                )
            reportes.append(rep)

        attrs["_reportes"] = reportes
        attrs["reporte"] = reportes[0]
        return attrs

    def create(self, validated_data):
        from decimal import Decimal as _Dec
        from .services import (
            validar_items_factura,
            restante_facturacion,
            crear_items_factura,
        )

        reportes = validated_data.pop("_reportes")
        validated_data.pop("reporte", None)
        items_data = self.context.get("items_data", [])
        factura_completa = self.context.get("factura_completa", False)

        # El presupuesto principal es el primero de la lista
        reporte = reportes[0]
        factura = Factura(reporte=reporte, **validated_data)

        def _a_moneda(usd):
            """Convierte un monto en USD a la moneda de la factura (Bs → multiplica por tasa)."""
            if factura.moneda == "BS":
                tasa = factura.tasa_bs_usd or _Dec("0.00")
                if tasa > 0:
                    return (usd * tasa).quantize(_Dec("0.01"))
            return usd

        if factura_completa:
            # Modo descripción completa (Opción B): un ítem por presupuesto,
            # cada uno con su descripción y su total_reporte.
            factura.factura_completa = True
            factura.porcentaje_descuento = _Dec("0.00")

            total_factura = _Dec("0.00")
            for rep in reportes:
                total_rep = rep.total_reporte or _Dec("0.00")
                # Validación por MONTO: no se puede facturar el total si ya se
                # facturó una parte (línea manual) de ese presupuesto.
                restante = restante_facturacion(rep)
                if total_rep > restante:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"El presupuesto #{rep.n_presupuesto} ya fue facturado "
                                f"parcialmente. Su total ({total_rep} USD) supera el "
                                f"restante ({restante.quantize(_Dec('0.01'))} USD). "
                                f"Usá el modo 'Facturar por APUs' para facturar el saldo."
                            )
                        }
                    )
                total_factura += _a_moneda(total_rep)

            factura.monto_iva = (total_factura * _Dec("16.00") / _Dec("100.00")).quantize(
                _Dec("0.01")
            )
            factura.save()
            FacturaReporte.objects.bulk_create(
                [
                    FacturaReporte(factura=factura, reporte=rep, orden=i)
                    for i, rep in enumerate(reportes)
                ]
            )
            for rep in reportes:
                total_rep = _a_moneda(rep.total_reporte or _Dec("0.00"))
                FacturaItem.objects.create(
                    factura=factura,
                    apu=None,
                    apu_descripcion=(rep.descripcion or "").strip(),
                    unidad="global",
                    cantidad=_Dec("1.00"),
                    precio_unitario=total_rep,
                )
        else:
            if not items_data:
                raise serializers.ValidationError(
                    {"items": "La factura debe tener al menos un item."}
                )
            # Validar los items contra el set completo de presupuestos:
            # valida cada APU contra su pendiente y el subtotal contra la
            # suma de restantes de todos los presupuestos.
            validar_items_factura(
                reportes,
                items_data,
                moneda=validated_data.get("moneda", "USD"),
                tasa_bs_usd=validated_data.get("tasa_bs_usd"),
            )
            factura.save()
            FacturaReporte.objects.bulk_create(
                [
                    FacturaReporte(factura=factura, reporte=rep, orden=i)
                    for i, rep in enumerate(reportes)
                ]
            )
            crear_items_factura(factura, items_data)

        calcular_totales(factura)
        return factura

    def update(self, instance, validated_data):
        # El presupuesto no se puede cambiar en una factura existente
        validated_data.pop("reporte", None)
        validated_data.pop("reportes", None)

        items_data = self.context.get("items_data", [])
        if items_data:
            # Validar contra todos los presupuestos vinculados a la factura.
            # Fallback: si la factura es antigua (sin vinculados), usar el
            # reporte principal.
            reportes_ids = list(
                instance.reportes_vinculados.values_list("reporte", flat=True)
            )
            if not reportes_ids:
                reportes_ids = [instance.reporte_id]
            reportes_objs = Reporte.objects.filter(pk__in=reportes_ids)
            validar_items_factura(
                list(reportes_objs),
                items_data,
                excluir_factura_id=instance.id,
                moneda=validated_data.get("moneda", instance.moneda or "USD"),
                tasa_bs_usd=validated_data.get("tasa_bs_usd", instance.tasa_bs_usd),
            )
            reemplazar_items_factura(instance, items_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        calcular_totales(instance)
        return instance


# ============================================================
# ⚙️ CONFIGURACIÓN DE FACTURAS
# ============================================================


class FacturaConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacturaConfig
        fields = "__all__"