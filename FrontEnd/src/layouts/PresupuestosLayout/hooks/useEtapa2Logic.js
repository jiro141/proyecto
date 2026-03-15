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



    const { formData, currentAPUIndex, updateAPUSection } = usePresupuesto();
    const apuActual = formData.apus?.[currentAPUIndex] || {};
    const materiales = apuActual.materiales || {
        stock_almacen: [],
        consumibles: [],
    };

    const [stock, setStock] = useState([]);
    const [consumibles, setConsumibles] = useState([]);

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


    return {
        searchStock,
        setSearchStock,
        searchCons,
        setSearchCons,
        openModal,
        setOpenModal,
        stock,
        consumibles,
        loadingStock,
        loadingCons,
        errorStock,
        errorCons,
        refetchStock,
        refetchCons,
    };
};
