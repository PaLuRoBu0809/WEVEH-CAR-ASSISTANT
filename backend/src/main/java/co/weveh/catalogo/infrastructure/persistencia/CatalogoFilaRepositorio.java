package co.weveh.catalogo.infrastructure.persistencia;

import org.springframework.data.repository.Repository;

interface CatalogoFilaRepositorio extends Repository<MarcaFila, Long>, BusquedaCatalogo {
}
