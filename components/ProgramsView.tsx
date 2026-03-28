import React from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { motion } from 'motion/react';

const programs = [
  {
    grade: "VI одделение",
    title: "Наставна програма за VI одделение",
    description: "Официјална наставна програма по Математика од Бирото за развој на образованието (БРО).",
    link: "/programa_6odd.pdf",
    color: "border-blue-100 hover:border-blue-300",
    iconColor: "bg-blue-600",
    hoverColor: "group-hover:text-blue-600",
    btnHover: "group-hover:bg-blue-600"
  },
  {
    grade: "VII одделение",
    title: "Наставна програма за VII одделение",
    description: "Официјална наставна програма по Математика од Бирото за развој на образованието (БРО).",
    link: "/programa_7odd.pdf",
    color: "border-amber-100 hover:border-amber-300",
    iconColor: "bg-amber-500",
    hoverColor: "group-hover:text-amber-600",
    btnHover: "group-hover:bg-amber-600"
  },
  {
    grade: "VIII одделение",
    title: "Наставна програма за VIII одделение",
    description: "Официјална наставна програма по Математика од Бирото за развој на образованието (БРО).",
    link: "/programa_8odd.pdf",
    color: "border-purple-100 hover:border-purple-300",
    iconColor: "bg-purple-600",
    hoverColor: "group-hover:text-purple-600",
    btnHover: "group-hover:bg-purple-600"
  },
  {
    grade: "IX одделение",
    title: "Наставна програма за IX одделение",
    description: "Официјална наставна програма по Математика од Бирото за развој на образованието (БРО).",
    link: "/programa_9odd.pdf",
    color: "border-rose-100 hover:border-rose-300",
    iconColor: "bg-rose-600",
    hoverColor: "group-hover:text-rose-600",
    btnHover: "group-hover:bg-rose-600"
  }
];

const ProgramsView: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Наставни програми</h1>
        <p className="text-slate-500 text-lg">
          Преземете ги официјалните наставни програми по Математика за основно образование одобрени од Министерството за образование и наука.
        </p>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {programs.map((program, index) => (
          <a
            key={index}
            href={program.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${program.color} bg-white`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl ${program.iconColor} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <FileText className="w-8 h-8" />
              </div>
              <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:text-slate-600 group-hover:bg-white transition-colors">
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-70 text-slate-500">
                {program.grade}
              </span>
              <h3 className={`text-2xl font-bold text-slate-900 ${program.hoverColor} transition-colors`}>
                {program.title}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {program.description}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-bold">
              <span className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white ${program.btnHover} transition-colors`}>
                <Download className="w-4 h-4" />
                Отвори PDF
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Info Box */}
      <div className="max-w-5xl mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-slate-500">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm italic">
          Забелешка: Документите се во PDF формат и се преземени од официјалната веб-страница на Бирото за развој на образованието.
        </p>
      </div>
    </div>
  );
};

export default ProgramsView;
