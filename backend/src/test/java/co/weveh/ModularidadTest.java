package co.weveh;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
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

    /**
     * RNF-08 y CLAUDE.md §8.7: al modelo nunca llega el nombre ni el correo de la persona. El Mecánico IA no puede ni
     * leerlos: no depende de las cuentas (el correo además vive solo en Supabase Auth).
     */
    @Test
    void elMecanicoIaNoConoceLasCuentas() {
        ArchRuleDefinition.noClasses()
                .that().resideInAPackage("co.weveh.mecanicoia..")
                .should().dependOnClassesThat().resideInAPackage("co.weveh.cuentas..")
                .because("al modelo solo va el contexto del vehículo y lo que escribe la persona (RNF-08)")
                .check(new ClassFileImporter().importPackages("co.weveh"));
    }

    @Test
    void documentaLosModulos() {
        new Documenter(MODULOS).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}
