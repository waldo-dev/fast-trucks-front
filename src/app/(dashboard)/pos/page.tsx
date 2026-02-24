'use client';

const categories = ['Todos', 'Comida', 'Bebidas', 'Postres'];

const productos = [
  {
    nombre: 'Hamburguesa Clásica',
    precio: '$12.00',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjYU4iB4Y8cutDkJYFGNu3DhDduEulJVwL_BS33QLf2nX9Z7f6vdMVle9AYefy5gAaDuqe_DYbR6tJQ3oGGMbX-1dR5eV0Nm9Bd4NFUWSY17WnRhzxP4vfwia3BA-bE1AZx1Jh9kBjLAK_Zk64KGlD8Ro17m0LFiss0UYGlO7gpWOiwu7sYVLkP5_3Tsq-32ub5GeGSOSe-MgzzJ3flJblarLy3vyQUo4aZqqkKcxpwxV5M86m0n8JUWhvCKOaYDEVJ1sJKMplxNE')",
  },
  {
    nombre: 'Papas Fritas XL',
    precio: '$5.50',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBKtReTQpSrPh92OAsDH1WciZHg4MOnW8buvAZp5ce5c9DEsqVDKPkVwYlDM07Hhooowl86UK-ZwwJsxi3RlFNp7-TkFYZvFQ8ASW7h_Bt8_U8zfMbHVkrFxKUK43JiS45iPr9HS9mLcsT8gro83SrYM3s_gJaIIXeSE1U-RNxshoCmaQufsKVsKs3PXmdoG1n_uvnQqlZ6A965QM0zPcP2uQ-1MsSthvo1gJDwcTysKucQNADD6UGuEI4c0HSvBdw3TN9Q-1tIsUY')",
  },
  {
    nombre: 'Hot Dog Especial',
    precio: '$8.00',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAWl5WD4lSDV_91PCX42s6sVu_9fZolbg77PaHCZmvVYOac1eK8MPYiQKb19OsMx_vO1nAXPRhVupcyypbUZLF-yYDQEAoJvzT_r5VfAnIF9LC36VISn2c6QTMs9yrefdWSaHJex23QrASXBBLeSSBfcp2wgkaX3rGHxKTXKPJoY9rpOaAxxjI1W4sgjcrNAEaRs-itkp00WPFpDAGolLKV-b1p1XMJvb6RPKm8Pj2ibHtCb5VW2_kIVz12cebOiV1MYxaUZN-4uxU')",
  },
  {
    nombre: 'Refresco 500ml',
    precio: '$3.00',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCgPGy1ehb2aniqqer7BUirX-oVFj0Biq84BcYVNllARlN4zRDY7mLBdputauJxG6DymkBziTny0ccZuJEO3tnIVCPYwkhMaWCfutwI3cJGeqpsEvSuuOp4iOL4JSxoQynY9W3Y7QlkeFamhP9k4Y1Xj4RYDI0fDUAseFyHuRF_Qop3-ocx4ipUHevDVQ-tbB_yKV69o6hhlYOb6LSgTIU3pTNphD2QakQfZvocSNHQ_JC55DFMT7OGwDTkp2NkzL8jn6AUwntS3Nk')",
  },
  {
    nombre: 'Tacos al Pastor (3)',
    precio: '$9.50',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCE-rcCaO4d9UUOrnXdAPXOWh8mYCdwWvTOMSDAjskQ6pmlimzib05dise_4W_dVJjha-r-_6_YDRLBu_hin1kM2m9lvMyFftBXtjaTL4aWasFKa9YxAV3yod9M2PrjyyPyZKscpL3ad4_3W_r1EAy7lLMGyCWOt83fuVvQhx1leEa_nZUfUDbTg4jjJXAx6NA_X4PdMnS4m65pQdBZaxOKZl9mY003Sz7eI_UZOtSRGTMuOfOKFc7s76UQgRbVz8WMEPx4ADA47WI')",
  },
  {
    nombre: 'Cerveza Artesanal',
    precio: '$7.00',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCt8_TYApRSkFBubSYMs8VsOUpUypXqNPjC-o8Fj3dCxx7PASR3t631uPV1NhFLhGqqOeu8jTkOsRwrN8O0AUYx1JrHeW_Yvg-MD1T930ETPWHCJRTxDY9HbjmgUhJbA-iL4RQdsfbobyuHPG2lF3GYUtYs_yNWKdYPLCKuB1sAq_ExV5EVwcO-9ueZWDDlWV6Ev4sVz9cdu2yaFdMdhz4geaKgIpXArwNviU-S632Ka0Ua0kspozfb0shG6gs1j-HlPE71pGpZw8c')",
  },
  {
    nombre: 'Combo Familiar',
    precio: '$25.00',
    imagen:
      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDGOs-8x80sCwxSY-pKPF4gmaeDiZX3BLPI-dObEGR36XxgzEeGl-wosmq3B742CZ62ebnxwnuRDpIQdgUKBbjMBSQKHDVQZgveRh29IVBCrnjAqY8Z0pdw7tvXSdG-jWFz6zPvhK2zMVXRlCkMlm9inyQs-oJuHVO8eXFDPYiMcx6JAwep9u1YLlB9sAQdDinNoqoPJjMbdiD6mobbwAtT_ln0EllRr3SR_EVCHnzk6J6N6WpW7-QfJ-bF_R19yRmxabQJdHf3ORY')",
  },
];

export default function PosPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <header className="bg-[#2a1e1a] text-slate-100 rounded-2xl p-5 border border-[#3d2a24]/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="bg-[#ec4913]/20 p-2 rounded-lg">
            <span className="material-symbols-outlined text-[#ec4913]">confirmation_number</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#ec4913] font-semibold">Evento activo</p>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">Festival Gastronómico 2024</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              search
            </span>
            <input
              className="w-full bg-[#3d2a24]/70 border-none rounded-xl pl-10 pr-4 py-2 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#ec4913]"
              placeholder="Buscar producto..."
              type="text"
            />
          </div>
          <button className="bg-[#3d2a24] text-slate-100 p-2 rounded-lg">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="bg-[#3d2a24] text-slate-100 p-2 rounded-lg">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Categorías */}
      <div className="flex gap-3 flex-wrap">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`px-5 py-2 rounded-xl font-bold text-sm ${
              idx === 0
                ? 'bg-[#ec4913] text-white'
                : 'bg-[#3d2a24] text-slate-200 hover:bg-[#3d2a24]/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {productos.map((prod) => (
          <div
            key={prod.nombre}
            className="bg-[#2a1e1a] rounded-xl overflow-hidden flex flex-col border border-[#3d2a24]/60 hover:border-[#ec4913]/60 transition-colors group cursor-pointer shadow-md shadow-black/10"
          >
            <div
              className="aspect-square w-full bg-cover bg-center"
              style={{ backgroundImage: prod.imagen }}
              aria-hidden
            />
            <div className="p-4 flex flex-col gap-2 relative">
              <h3 className="font-bold text-lg text-slate-100 leading-tight">{prod.nombre}</h3>
              <p className="text-[#ec4913] font-bold text-xl">{prod.precio}</p>
              <button className="absolute bottom-4 right-4 bg-[#ec4913] text-white size-11 rounded-full flex items-center justify-center shadow-lg shadow-[#ec4913]/30 group-active:scale-95 transition-transform">
                <span className="material-symbols-outlined font-bold">add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
