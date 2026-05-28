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
  },
});
