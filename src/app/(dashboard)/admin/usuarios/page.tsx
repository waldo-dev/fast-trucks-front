'use client';

import { UsersView } from '@/components/users/UsersView';

export default function AdminUsuariosPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UsersView scope="admin" />
    </div>
  );
}

