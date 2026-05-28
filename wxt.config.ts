import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Renoria Picante',
    description: 'Una ciudad que crece con tu foco.',
    // storage: persistir estado | tabs: leer URL de la tab activa
    // idle: pausar al inactivar | alarms: flush periódico con el SW dormido
    permissions: ['storage', 'tabs', 'idle', 'alarms'],
    // Icono "Founding Tower" (concepto B del icon studio, lenguaje Living Map).
    // WXT autodescubre `icons` desde public/icon/; fijamos el icono de la
    // toolbar explícitamente porque B se eligió por su nitidez a 16px.
    action: {
      default_title: 'Renoria',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
    },
  },
});
