export const formatearMoneda = (valor) => {
    if (valor === null || valor === undefined) return '$0';

    // Convierte a número en caso de que venga como texto desde el backend
    const numero = Number(valor);

    if (isNaN(numero)) return '$0';

    // Formato Colombia (es-CO) usa puntos para miles y coma para decimales.
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numero);
};
