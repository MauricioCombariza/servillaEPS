// frontend-admin/src/pages/Logistica/PickingPage.tsx
import React from 'react';
import GestionPicking from '../../features/logistica/GestionPicking';

const PickingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Olas de Picking</h1>
      </header>
      <main>
        <GestionPicking />
      </main>
    </div>
  );
};

export default PickingPage;