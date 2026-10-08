package co.weveh;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Falla si un módulo usa clases internas de otro (docs/adr/0003-monolito-modular.md).
 */
class ModularidadTest {

    static final ApplicationModules MODULOS = ApplicationModules.of(WevehApplication.class);

    @Test
    void losModulosRespetanSusFronteras() {
        MODULOS.verify();
    }

    @Test
    void documentaLosModulos() {
        new Documenter(MODULOS).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}
