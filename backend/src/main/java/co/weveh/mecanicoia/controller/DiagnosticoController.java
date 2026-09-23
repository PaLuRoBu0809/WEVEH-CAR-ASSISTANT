package co.weveh.mecanicoia.controller;

import co.weveh.mecanicoia.dto.DiagnosticoResponseDto;
import co.weveh.mecanicoia.dto.SolicitudDiagnosticoDto;
import co.weveh.mecanicoia.service.AgenteMecanicoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unico punto de entrada HTTP del Mecanico IA. Solo traduce request/response:
 * toda la logica de negocio vive en AgenteMecanicoService y
 * ValidadorSeguridadDiagnostico. No maneja excepciones aqui: eso lo centraliza
 * ManejadorGlobalExcepciones.
 */
@RestController
@RequestMapping("/api/diagnosticos")
public class DiagnosticoController {

    private final AgenteMecanicoService agenteMecanicoService;

    public DiagnosticoController(AgenteMecanicoService agenteMecanicoService) {
        this.agenteMecanicoService = agenteMecanicoService;
    }

    @PostMapping
    public ResponseEntity<DiagnosticoResponseDto> generarDiagnostico(
            @Valid @RequestBody SolicitudDiagnosticoDto solicitud) {
        DiagnosticoResponseDto diagnostico = agenteMecanicoService.generarDiagnostico(solicitud);
        return ResponseEntity.ok(diagnostico);
    }
}
