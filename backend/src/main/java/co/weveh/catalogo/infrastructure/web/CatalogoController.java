package co.weveh.catalogo.infrastructure.web;

import co.weveh.catalogo.application.BuscarEnCatalogo;
import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalogo/marcas")
class CatalogoController {

    private final BuscarEnCatalogo buscar;

    CatalogoController(BuscarEnCatalogo buscar) {
        this.buscar = buscar;
    }

    @GetMapping
    List<MarcaCatalogo> marcas(@RequestParam(required = false) TipoVehiculo tipo,
                               @RequestParam(required = false) String q) {
        return buscar.marcas(tipo, q);
    }

    @GetMapping("/{marcaId}/lineas")
    List<LineaCatalogo> lineas(@PathVariable long marcaId,
                               @RequestParam(required = false) TipoVehiculo tipo,
                               @RequestParam(required = false) String q) {
        return buscar.lineas(marcaId, tipo, q);
    }
}
