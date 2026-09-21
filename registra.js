/* ==========================================================================
   SECCIÓN 1: CONSTANTES Y REFERENCIAS AL DOM
   ========================================================================== */
const STORAGE_KEY = 'taller_mecanico_registros';

const form = document.getElementById('formRegistro');
const tablaCuerpo = document.getElementById('tablaCuerpo');
const sinRegistros = document.getElementById('sinRegistros');
const contadorVehiculos = document.getElementById('contadorVehiculos');

/* ==========================================================================
   SECCIÓN 2: INICIALIZACIÓN Y EVENTOS PRINCIPALES
   ========================================================================== */
document.addEventListener('DOMContentLoaded', renderizarTabla);

// Captura y validación del formulario de registro
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Verificación de campos obligatorios mediante Bootstrap
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    // CAMBIO: Construcción del nuevo registro con estado inicial por defecto
    const nuevoIngreso = {
        id: Date.now(),
        fecha: new Date().toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        cliente: document.getElementById('cliente').value.trim(),
        telefono: document.getElementById('telefono').value.trim() || 'N/A',
        vehiculo: document.getElementById('vehiculo').value.trim(),
        anio: document.getElementById('anio').value.trim() || 'N/A',
        placas: document.getElementById('placas').value.trim().toUpperCase(),
        kilometraje: document.getElementById('kilometraje').value.trim() 
            ? `${document.getElementById('kilometraje').value} km` 
            : 'N/A',
        problema: document.getElementById('problema').value.trim(),
        estado: 'En revisión' // NUEVO: Todo vehículo inicia 'En revisión'
    };

    guardarRegistro(nuevoIngreso);
    form.reset();
    form.classList.remove('was-validated');
    renderizarTabla();
});

/* ==========================================================================
   SECCIÓN 3: GESTIÓN DE ALMACENAMIENTO (LOCALSTORAGE)
   ========================================================================== */

// Lee el arreglo de autos guardados
function obtenerRegistros() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Guarda un nuevo auto al inicio de la lista
function guardarRegistro(item) {
    const lista = obtenerRegistros();
    lista.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// CAMBIO / NUEVA FUNCIÓN: Permite al mecánico cambiar el estado en tiempo real
function cambiarEstado(id, nuevoEstado) {
    let lista = obtenerRegistros();
    
    // Se actualiza únicamente el registro cuyo ID coincida
    lista = lista.map(item => {
        if (item.id === id) {
            return { ...item, estado: nuevoEstado };
        }
        return item;
    });

    // Guardado y re-renderizado para actualizar colores y clases visuales
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    renderizarTabla();
}

// Elimina una orden de trabajo de la base de datos local
function eliminarRegistro(id) {
    if (confirm('¿Deseas dar salida o eliminar este registro de recepción?')) {
        let lista = obtenerRegistros();
        lista = lista.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
        renderizarTabla();
    }
}

/* ==========================================================================
   SECCIÓN 4: HELPERS VISUALES Y RENDERIZADO
   ========================================================================== */

// CAMBIO / NUEVA FUNCIÓN: Retorna la clase CSS correspondiente según el avance real
function obtenerClaseEstado(estado) {
    switch (estado) {
        case 'En reparación':
            return 'estado-reparacion';
        case 'Listo':
            return 'estado-listo';
        case 'En revisión':
        default:
            return 'estado-revision';
    }
}

// Dibuja la tabla completa en pantalla
function renderizarTabla() {
    const registros = obtenerRegistros();
    tablaCuerpo.innerHTML = '';

    // Actualiza contador de vehículos
    contadorVehiculos.textContent = `${registros.length} vehículo${registros.length === 1 ? '' : 's'}`;

    if (registros.length === 0) {
        sinRegistros.classList.remove('d-none');
        return;
    }

    sinRegistros.classList.add('d-none');

    registros.forEach(item => {
        // Fallback: si el registro no tenía campo 'estado' (datos antiguos), asume 'En revisión'
        const estadoActual = item.estado || 'En revisión';
        const claseColorEstado = obtenerClaseEstado(estadoActual);

        const tr = document.createElement('tr');
        
        // CAMBIO: Se inserta el <select> interactivo con eventos onchange y opciones preseleccionadas
        tr.innerHTML = `
            <td>
                <div class="fw-bold text-primary">#${item.id.toString().slice(-4)}</div>
                <small class="text-muted">${item.fecha}</small>
            </td>
            <td>
                <div class="fw-semibold">${item.vehiculo} <span class="badge bg-light text-dark border">${item.anio}</span></div>
                <small class="text-secondary"><i class="bi bi-card-text"></i> ${item.placas} | ${item.kilometraje}</small>
            </td>
            <td>
                <div>${item.cliente}</div>
                <small class="text-muted"><i class="bi bi-telephone"></i> ${item.telefono}</small>
            </td>
            <td>
                <span class="d-inline-block text-truncate" style="max-width: 170px;" title="${item.problema}">
                    ${item.problema}
                </span>
            </td>
            <td>
                <select class="form-select form-select-sm select-estado ${claseColorEstado}" 
                        onchange="cambiarEstado(${item.id}, this.value)"
                        title="Cambiar estado del trabajo">
                    <option value="En revisión" ${estadoActual === 'En revisión' ? 'selected' : ''}>🟡 En revisión</option>
                    <option value="En reparación" ${estadoActual === 'En reparación' ? 'selected' : ''}>🔵 En reparación</option>
                    <option value="Listo" ${estadoActual === 'Listo' ? 'selected' : ''}>🟢 Listo</option>
                </select>
            </td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarRegistro(${item.id})" title="Dar salida / Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tablaCuerpo.appendChild(tr);
    });
}