import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { TopVenues } from '@/components/dashboard/TopVenues';

export default function DashboardHomePage() {
  const metrics = [
    {
      label: 'Locales Activos',
      value: '128',
      icon: 'location_on',
      change: '+12.5%',
      changeType: 'positive' as const,
      borderColor: 'emerald' as const,
      iconBgColor: 'emerald' as const,
    },
    {
      label: 'Total Pedidos',
      value: '4,250',
      icon: 'receipt_long',
      change: '+5.2%',
      changeType: 'positive' as const,
      borderColor: 'orange' as const,
      iconBgColor: 'orange' as const,
    },
    {
      label: 'Pedidos de Hoy',
      value: '145',
      icon: 'today',
      change: '-2.4%',
      changeType: 'negative' as const,
      borderColor: 'blue' as const,
      iconBgColor: 'blue' as const,
    },
    {
      label: 'Productos Activos',
      value: '892',
      icon: 'inventory_2',
      change: '+8.1%',
      changeType: 'positive' as const,
      borderColor: 'rose' as const,
      iconBgColor: 'rose' as const,
    },
  ];

  const recentOrders = [
    {
      id: '#ORD-7721',
      venue: 'Pizza Palace',
      customer: 'Juan Pérez',
      amount: '$42.50',
      status: 'Preparando' as const,
    },
    {
      id: '#ORD-7720',
      venue: 'Burger Barn',
      customer: 'María García',
      amount: '$28.00',
      status: 'Nuevo' as const,
    },
    {
      id: '#ORD-7719',
      venue: 'Taco Truck',
      customer: 'Carlos López',
      amount: '$15.75',
      status: 'Preparando' as const,
    },
    {
      id: '#ORD-7718',
      venue: 'Sushi Stop',
      customer: 'Ana Martínez',
      amount: '$64.20',
      status: 'Nuevo' as const,
    },
  ];

  const topVenues = [
    {
      name: 'Pizza Centro',
      orders: '842 pedidos hoy',
      revenue: '$12.4k',
      icon: 'local_pizza',
      iconBg: 'orange' as const,
    },
    {
      name: 'Hamburguesas Puerto',
      orders: '612 pedidos hoy',
      revenue: '$9.8k',
      icon: 'lunch_dining',
      iconBg: 'blue' as const,
    },
    {
      name: 'Sushi Central',
      orders: '520 pedidos hoy',
      revenue: '$11.2k',
      icon: 'ramen_dining',
      iconBg: 'rose' as const,
    },
    {
      name: 'Panadería Artesanal',
      orders: '415 pedidos hoy',
      revenue: '$4.1k',
      icon: 'bakery_dining',
      iconBg: 'emerald' as const,
    },
  ];

  return (
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <RecentOrdersTable orders={recentOrders} />
        <TopVenues venues={topVenues} />
      </div>
    </>
  );
}

