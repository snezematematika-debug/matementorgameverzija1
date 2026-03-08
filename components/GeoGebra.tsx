
import React from 'react';

const GeoGebra: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📐 GeoGebra
            <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Интерактивна Геометрија</span>
        </h2>
        <p className="text-slate-500 mt-1">Истражувајте геометрија, алгебра и графикони во живо.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-[600px]">
        <iframe
          src="https://www.geogebra.org/geometry"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="GeoGebra Geometry"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <p className="text-indigo-800 text-sm">
          Можете да користите GeoGebra за да ги визуелизирате математичките концепти што ги учите. Сите промени што ги правите овде се во реално време.
        </p>
      </div>
    </div>
  );
};

export default GeoGebra;
