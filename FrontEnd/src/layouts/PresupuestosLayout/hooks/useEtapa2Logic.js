import { useState, useEffect } from "react";
import useInventario from "../../../hooks/useInvetario";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export const useEtapa2Logic = () => {
    const [searchStock, setSearchStock] = useState("");
    const [searchCons, setSearchCons] = useState("");
    const [openModal, setOpenModal] = useState(null);


    const {
        data: stockRaw,
        loading: loadingStock,
        error: errorStock,
        refetch: refetchStock,
    } = useInventario("stock", searchStock);

    const {
        data: consRaw,
        loading: loadingCons,
        error: errorCons,
        refetch: refetchCons,
    } = useInventario("consumibles", searchCons);

    const {
        data: herramientasRaw,
        loading: loadingHerramientas,
        refetch: refetchHerramientas,
    } = useInventario("herramientas", "");

    const {
        data: empleadosRaw,
        loading: loadingEmpleados,
        refetch: refetchEmpleados,
    } = useInventario("empleados", "");

    const {
        data: logisticaRaw,
        loading: loadingLogistica,
        refetch: refetchLogistica,
    } = useInventario("logistica", "");



    const { formData, currentAPUIndex, updateAPUSection } = usePresupuesto();
    const apuActual = formData.apus?.[currentAPUIndex] || {};
    const materiales = apuActual.materiales || {
        stock_almacen: [],
        consumibles: [],
    };

    const [stock, setStock] = useState([]);
    const [consumibles, setConsumibles] = useState([]);
    const [herramientas, setHerramientas] = useState([]);
    const [manoObra, setManoObra] = useState([]);
    const [logistica, setLogistica] = useState([]);

    useEffect(() => {
        if (!stockRaw) {
            setStock([]);
            return;
        }

        const merged = stockRaw.map((item) => {
            const saved = materiales.stock_almacen?.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0, desp: saved.desp || 0 }
                : { ...item, cantidad: 0, desp: 0 };
        });

        setStock(merged);
    }, [stockRaw, currentAPUIndex]);

    useEffect(() => {
        if (!consRaw) {
            setConsumibles([]);
            return;
        }

        const merged = consRaw.map((item) => {
            const saved = materiales.consumibles?.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0, desp: saved.desp || 0 }
                : { ...item, cantidad: 0, desp: 0 };
        });

        setConsumibles(merged);
    }, [consRaw, currentAPUIndex]);

    useEffect(() => {
        if (!herramientasRaw) {
            setHerramientas([]);
            return;
        }
        const savedHerramientas = apuActual.herramientas || [];
        const merged = herramientasRaw.map((item) => {
            const saved = savedHerramientas.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0 }
                : { ...item, cantidad: Number(item.cantidad) || 0 };
        });
        setHerramientas(merged);
    }, [herramientasRaw, currentAPUIndex]);

    useEffect(() => {
        if (!empleadosRaw) {
            setManoObra([]);
            return;
        }
        const savedManoObra = apuActual.mano_obra || [];
        const merged = empleadosRaw.map((item) => {
            const saved = savedManoObra.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0 }
                : { ...item, cantidad: Number(item.cantidad) || 0 };
        });
        setManoObra(merged);
    }, [empleadosRaw, currentAPUIndex]);

    useEffect(() => {
        if (!logisticaRaw) {
            setLogistica([]);
            return;
        }
        const savedLogistica = apuActual.logistica || [];
        const merged = logisticaRaw.map((item) => {
            const saved = savedLogistica.find((x) => x.id === item.id);
            return saved
                ? { ...item, cantidad: saved.cantidad || 0 }
                : { ...item, cantidad: Number(item.cantidad) || 0 };
        });
        setLogistica(merged);
    }, [logisticaRaw, currentAPUIndex]);


    return {
        searchStock,
        setSearchStock,
        searchCons,
        setSearchCons,
        openModal,
        setOpenModal,
        stock,
        consumibles,
        herramientas,
        manoObra,
        logistica,
        loadingStock,
        loadingCons,
        loadingHerramientas,
        loadingEmpleados,
        loadingLogistica,
        errorStock,
        errorCons,
        refetchStock,
        refetchCons,
        refetchHerramientas,
        refetchEmpleados,
        refetchLogistica,
    };
};
