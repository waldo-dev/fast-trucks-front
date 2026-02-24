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

