export const APP_NAME = 'Admin Global';

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
] as const;

