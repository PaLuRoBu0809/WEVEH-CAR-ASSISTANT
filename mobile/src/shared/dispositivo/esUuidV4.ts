// Misma regla que backend/src/main/java/co/weveh/shared/domain/DispositivoId.java
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function esUuidV4(texto: string | null | undefined): texto is string {
  return typeof texto === 'string' && UUID_V4.test(texto);
}
