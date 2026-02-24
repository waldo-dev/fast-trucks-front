export const APP_NAME = 'Fast Trucks';

export const SIDEBAR_ITEMS = [
  {
    title: 'Inicio',
    href: '/',
    icon: 'home',
  },
  {
    title: 'Locales',
    href: '/outlets',
    icon: 'storefront',
  },
  {
    title: 'Productos',
    href: '/products',
    icon: 'restaurant',
  },
  {
    title: 'Promociones',
    href: '/promotions',
    icon: 'local_activity',
  },
  {
    title: 'Pedidos',
    href: '/orders',
    icon: 'shopping_bag',
  },
  {
    title: 'Pagos',
    href: '/payments',
    icon: 'payments',
  },
  {
    title: 'Clientes',
    href: '/customers',
    icon: 'group',
  },
  {
    title: 'Eventos',
    href: '/events',
    icon: 'event',
  },
  {
    title: 'Mailing',
    href: '/mailing',
    icon: 'mail',
  },
] as const;

export const ADMIN_SIDEBAR_ITEMS = [
  {
    title: 'Resumen Global',
    href: '/admin',
    icon: 'dashboard',
  },
  {
    title: 'Negocios',
    href: '/admin/negocios',
    icon: 'apartment',
  },
  {
    title: 'Suscripciones y Facturación',
    href: '/admin/suscripciones',
    icon: 'credit_score',
  },
  {
    title: 'Métricas de Uso',
    href: '/admin/metricas',
    icon: 'query_stats',
  },
  {
    title: 'Eventos Globales',
    href: '/admin/eventos',
    icon: 'event_available',
  },
  {
    title: 'Fast Trucks IA',
    href: '/admin/ia',
    icon: 'psychology',
  },
  {
    title: 'Soporte y Actividad',
    href: '/admin/soporte',
    icon: 'support_agent',
  },
  {
    title: 'Configuración',
    href: '/admin/configuracion',
    icon: 'settings',
  },
] as const;

export const OPERATOR_SIDEBAR_ITEMS = [
  {
    title: 'Punto de Venta',
    href: '/pos',
    icon: 'storefront',
  },
  {
    title: 'Pedidos Activos',
    href: '/pos/pedidos-activos',
    icon: 'shopping_bag',
  },
  {
    title: 'Historial del Día',
    href: '/pos/historial',
    icon: 'history',
  },
  {
    title: 'Cierre de Caja',
    href: '/pos/cierre-caja',
    icon: 'lock_open',
  },
  {
    title: 'Cambiar Evento',
    href: '/pos/cambiar-evento',
    icon: 'event_repeat',
  },
] as const;

