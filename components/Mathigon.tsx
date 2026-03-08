
import React from 'react';

const Mathigon: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🎨 Mathigon Polypad
            <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Виртуелен Прибор</span>
        </h2>
        <p className="text-slate-500 mt-1">Користете шестар, линијар, агломер и други математички алатки за рачни конструкции.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[500px] md:h-[700px]">
        <iframe
          src="https://mathigon.org/polypad/embed"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Mathigon Polypad"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <span className="text-xl">📏</span>
        <p className="text-amber-800 text-sm">
          <strong>Совет:</strong> Во менито лево во Polypad, изберете <strong>"Geometry"</strong> за да ги најдете шестарот, линијарот и агломерот. Оваа алатка е совршена за вежбање на конструкции кои инаку би ги правеле на хартија.
        </p>
      </div>
    </div>
  );
};

export default Mathigon;
