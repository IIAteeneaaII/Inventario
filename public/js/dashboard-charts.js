// Variables globales para las gráficas
let skuChart, registrosDiariosChart, estadoFaseChart, skuDetailChart;
let allData = null;
let selectedSku = 'todos';

// Función para actualizar el contador total
function actualizarContadorTotal(total) {
    const contador = document.getElementById('total-modems-count');
    if (contador) {
        contador.textContent = total.toLocaleString();
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando dashboard de gráficas...');
    
    // Registrar evento para el botón REGRESAR
    document.getElementById('REGRESAR')?.addEventListener('click', function() {
        window.location.href = '/adminventario';
    });
    
    // Registrar evento para el botón Actualizar datos
    document.getElementById('actualizarDatos')?.addEventListener('click', cargarDatosGraficas);
    
    // Registrar eventos para los selects
    document.getElementById('rangoDias')?.addEventListener('change', cargarDatosGraficas);
    
    // Registrar evento para el selector de SKU
    document.getElementById('skuSelector')?.addEventListener('change', function() {
        selectedSku = this.value;
        cargarDatosGraficas(); // Actualiza automáticamente al cambiar el SKU
    });
    
    // Carga inicial de datos
    cargarDatosGraficas();
});

// Función para cargar datos
function cargarDatosGraficas() {
    console.log('Cargando datos de gráficas...');
    // Indicador visual en el botón
    const btnActualizar = document.getElementById('actualizarDatos');
    if (btnActualizar) {
        const textoOriginal = btnActualizar.innerHTML;
        btnActualizar.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
        btnActualizar.disabled = true;
        // Restaurar el botón después de completar la carga
        setTimeout(() => {
            btnActualizar.innerHTML = textoOriginal;
            btnActualizar.disabled = false;
        }, 1000);
    }
    mostrarCargando();
    
    const dias = document.getElementById('rangoDias')?.value || 30;
    const skuSeleccionado = selectedSku;
    let url = skuSeleccionado === 'todos' 
        ? `/api/stats/resumen?dias=${dias}` 
        : `/api/stats/dashboard-filtered?dias=${dias}&skuNombre=${encodeURIComponent(skuSeleccionado)}`;
    fetch(url)
        .then(response => {
            console.log('Estado de la respuesta:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos');
            actualizarContadorTotal(data.totalModems || 
                (data.distribucionSKU && data.distribucionSKU.length 
                    ? data.distribucionSKU.reduce((sum, item) => sum + item.cantidad, 0) 
                    : 0));
            allData = data;
            actualizarSelectorSku(data);
            crearGraficaSKU(data.distribucionSKU || []);
            crearGraficaRegistrosDiarios(data.modemsRegistradosPorDia || []);
            crearGraficaEstadoFase(data.estadoPorFase || []);
            actualizarDetallesSku();
        })
        .catch(error => {
            console.error('Error al cargar datos:', error);
            mostrarError(error.message);
        });
}

// Función para actualizar el selector de SKU
function actualizarSelectorSku(data) {
    const skuSelector = document.getElementById('skuSelector');
    if (!skuSelector) return;
    
    // Guardar SKU actual
    const currentSku = selectedSku;
    
    // Si estamos filtrando por un SKU específico, necesitamos obtener la lista completa de SKUs
    if (currentSku !== 'todos' || (data.distribucionSKU && data.distribucionSKU.length <= 1)) {
        // Hacer una petición separada para obtener todos los SKUs disponibles
        fetch('/api/stats/resumen')
            .then(res => {
                if (!res.ok) throw new Error('Error al cargar los SKUs');
                return res.json();
            })
            .then(fullData => {
                // Limpiar opciones actuales excepto la primera (Todos)
                while (skuSelector.options.length > 1) {
                    skuSelector.remove(1);
                }
                
                // Agregar todas las opciones de SKU
                if (fullData.distribucionSKU && fullData.distribucionSKU.length) {
                    fullData.distribucionSKU.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.nombre;
                        option.textContent = `${item.nombre} (${item.cantidad})`;
                        skuSelector.appendChild(option);
                    });
                    
                    // Restaurar selección
                    if (currentSku !== 'todos') {
                        for (let i = 0; i < skuSelector.options.length; i++) {
                            if (skuSelector.options[i].value === currentSku) {
                                skuSelector.selectedIndex = i;
                                break;
                            }
                        }
                    }
                }
            })
            .catch(err => {
                console.error('Error al cargar todos los SKUs:', err);
            });
    } else {
        // Si estamos viendo todos los SKUs, simplemente actualizamos las opciones con los datos actuales
        while (skuSelector.options.length > 1) {
            skuSelector.remove(1);
        }
        
        // Agregar nuevas opciones si hay datos
        if (data.distribucionSKU && data.distribucionSKU.length) {
            data.distribucionSKU.forEach(item => {
                const option = document.createElement('option');
                option.value = item.nombre;
                option.textContent = `${item.nombre} (${item.cantidad})`;
                skuSelector.appendChild(option);
            });
            
            // Restaurar selección si es posible
            if (currentSku !== 'todos') {
                const existe = Array.from(skuSelector.options).some(opt => opt.value === currentSku);
                if (existe) {
                    skuSelector.value = currentSku;
                    selectedSku = currentSku;
                } else {
                    skuSelector.value = 'todos';
                    selectedSku = 'todos';
                }
            }
        }
    }
}

// Función para crear gráfica de SKU
function crearGraficaSKU(datos) {
    console.log('Creando gráfica de SKU');
    
    // Si no hay datos, mostrar mensaje
    if (!datos || datos.length === 0) {
        const contenedor = document.getElementById('chartSKU');
        if (contenedor) {
            contenedor.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    // Buscar el contenedor y limpiar
    const contenedor = document.getElementById('chartSKU');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Crear canvas para la gráfica
    const canvas = document.createElement('canvas');
    canvas.id = 'skuChart';
    contenedor.appendChild(canvas);
    
    // Preparar datos para Chart.js
    const labels = datos.map(item => item.nombre);
    const values = datos.map(item => Number(item.cantidad));
    const colors = generarColores(datos.length);
    
    // Destruir gráfica previa si existe
    if (skuChart) skuChart.destroy();
    
    // Crear gráfica circular
    skuChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para crear gráfica de registros diarios
function crearGraficaRegistrosDiarios(datos) {
    console.log('Creando gráfica de registros diarios');
    
    // Si no hay datos, mostrar mensaje
    if (!datos || datos.length === 0) {
        const contenedor = document.getElementById('chartDiario');
        if (contenedor) {
            contenedor.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    // Buscar el contenedor y limpiar
    const contenedor = document.getElementById('chartDiario');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Crear canvas para la gráfica
    const canvas = document.createElement('canvas');
    canvas.id = 'registrosDiariosChart';
    contenedor.appendChild(canvas);
    
    // Ordenar datos por fecha
    datos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Preparar datos para Chart.js
    const labels = datos.map(item => formatearFecha(item.fecha));
    const values = datos.map(item => Number(item.cantidad));
    
    // Destruir gráfica previa si existe
    if (registrosDiariosChart) registrosDiariosChart.destroy();
    
    // Crear gráfica de línea
    registrosDiariosChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Modems registrados',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para crear gráfica de estado por fase
function crearGraficaEstadoFase(datos) {
    console.log('Creando gráfica de estado por fase');
    
    // Si no hay datos, mostrar mensaje
    if (!datos || datos.length === 0) {
        const contenedor = document.getElementById('chartFase');
        if (contenedor) {
            contenedor.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    // Buscar el contenedor y limpiar
    const contenedor = document.getElementById('chartFase');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Crear canvas para la gráfica
    const canvas = document.createElement('canvas');
    canvas.id = 'estadoFaseChart';
    contenedor.appendChild(canvas);
    
    // Obtener fases y estados únicos
    const fases = [...new Set(datos.map(item => item.faseActual))];
    const estados = [...new Set(datos.map(item => item.estado))];
    
    // Preparar datos agrupados
    const dataPorFase = {};
    fases.forEach(fase => {
        dataPorFase[fase] = {};
        estados.forEach(estado => {
            dataPorFase[fase][estado] = 0;
        });
    });
    
    // Llenar datos
    datos.forEach(item => {
        if (item.faseActual && item.estado) {
            dataPorFase[item.faseActual][item.estado] = Number(item.cantidad);
        }
    });
    
    // Colores para cada estado
    const colores = {
        'REGISTRO': 'rgba(255, 99, 132, 0.7)',
        'TEST_INICIAL': 'rgba(54, 162, 235, 0.7)',
        'COSMETICA': 'rgba(255, 206, 86, 0.7)',
        'LIBERACION_LIMPIEZA': 'rgba(75, 192, 192, 0.7)',
        'RETEST': 'rgba(153, 102, 255, 0.7)',
        'EMPAQUE': 'rgba(255, 159, 64, 0.7)'
    };
    
    // Crear datasets
    const datasets = estados.map(estado => {
        return {
            label: estado,
            data: fases.map(fase => dataPorFase[fase][estado] || 0),
            backgroundColor: colores[estado] || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`
        };
    });
    
    // Destruir gráfica previa si existe
    if (estadoFaseChart) estadoFaseChart.destroy();
    
    // Crear gráfica de barras
    estadoFaseChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: fases,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true
                },
                x: {
                    stacked: true
                }
            }
        }
    });
}

// Función para actualizar la gráfica de detalles del SKU seleccionado
function actualizarDetallesSku() {
    console.log('Actualizando detalles del SKU:', selectedSku);
    
    // Actualizar el nombre del SKU seleccionado
    const skuNameElement = document.getElementById('selectedSkuName');
    if (skuNameElement) {
        skuNameElement.textContent = selectedSku === 'todos' ? 'Todos' : selectedSku;
    }
    
    // Mostrar indicador de carga
    const detailContainer = document.getElementById('chartSkuDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</div>';
    
    // Si es "todos", mostrar distribución general por fases
    if (selectedSku === 'todos') {
        mostrarDistribucionGeneral();
    } else {
        // Si es un SKU específico, cargar sus detalles
        cargarDetallesPorSku();
    }
}

// Función para mostrar distribución general por fases cuando no hay SKU específico seleccionado
function mostrarDistribucionGeneral() {
    if (!allData || !allData.estadoPorFase || allData.estadoPorFase.length === 0) {
        const detailContainer = document.getElementById('chartSkuDetail');
        if (detailContainer) {
            detailContainer.innerHTML = '<div class="no-data">No hay datos disponibles</div>';
        }
        return;
    }
    
    // Agrupar por fases para el total
    const fases = [...new Set(allData.estadoPorFase.map(item => item.faseActual))];
    const datosPorFase = {};
    
    fases.forEach(fase => {
        datosPorFase[fase] = allData.estadoPorFase
            .filter(item => item.faseActual === fase)
            .reduce((sum, item) => sum + Number(item.cantidad), 0);
    });
    
    // Crear gráfica circular de distribución por fases
    const detailContainer = document.getElementById('chartSkuDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'skuDetailChart';
    detailContainer.appendChild(canvas);
    
    // Preparar datos para Chart.js
    const labels = Object.keys(datosPorFase);
    const values = Object.values(datosPorFase);
    const colors = generarColores(labels.length);
    
    // Destruir gráfica previa si existe
    if (skuDetailChart) skuDetailChart.destroy();
    
    // Crear nueva gráfica circular
    skuDetailChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Fase de Proceso'
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Función para cargar y mostrar detalles específicos de un SKU
function cargarDetallesPorSku() {
    console.log('Cargando detalles para SKU:', selectedSku);
    
    // Hacer solicitud a API para datos específicos del SKU
    fetch(`/api/stats/sku-detalle?sku=${encodeURIComponent(selectedSku)}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                throw new Error('No hay datos disponibles para este SKU');
            }
            
            // Crear gráfica con los datos específicos
            const detailContainer = document.getElementById('chartSkuDetail');
            if (!detailContainer) return;
            
            detailContainer.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.id = 'skuDetailChart';
            detailContainer.appendChild(canvas);
            
            // Preparar datos para Chart.js
            const labels = data.map(item => item.categoria);
            const values = data.map(item => Number(item.cantidad));
            const colors = generarColores(data.length);
            
            // Destruir gráfica previa si existe
            if (skuDetailChart) skuDetailChart.destroy();
            
            // Crear nueva gráfica circular
            skuDetailChart = new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Detalles de ${selectedSku}`
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw;
                                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar detalles del SKU:', error);
            
            // Mostrar mensaje de error en la gráfica
            const detailContainer = document.getElementById('chartSkuDetail');
            if (detailContainer) {
                detailContainer.innerHTML = `<div class="error-message">
                    <i class="fas fa-exclamation-circle"></i> 
                    Error al cargar datos del SKU: ${error.message}
                </div>`;
            }
        });
}

// Funciones auxiliares
function mostrarCargando() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</div>';
    });
}

function mostrarError(mensaje) {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> Error: ${mensaje}</div>`;
    });
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function generarColores(cantidad) {
    const colores = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(201, 203, 207, 0.7)',
        'rgba(255, 145, 0, 0.7)',
        'rgba(0, 200, 83, 0.7)',
        'rgba(139, 0, 139, 0.7)'
    ];
    
    return Array(cantidad).fill().map((_, i) => colores[i % colores.length]);
}