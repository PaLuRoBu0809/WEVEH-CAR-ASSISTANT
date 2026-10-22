import { router } from 'expo-router';

import { PantallaPolitica } from '@/features/cuentas';

/** En la demo web se puede abrir directo: sin historial no hay flecha. */
export default function Politica() {
  return <PantallaPolitica onVolver={router.canGoBack() ? () => router.back() : undefined} />;
}
