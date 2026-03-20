
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from '../services/firebase';
import { FileText, ArrowLeft, Loader2, Calendar, Tag, Download, Printer } from 'lucide-react';
import FormattedText from './FormattedText';
import { Timestamp } from 'firebase/firestore';

const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      setLoading(true);
      try {
        console.log(`Fetching document with ID: ${id}`);
        const docRef = doc(firestore, 'library', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocument({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Документот не е пронајден.');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Грешка при вчитување на документот.');
        handleFirestoreError(err, OperationType.GET, `library/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const formatDate = (doc: any) => {
    const ts = doc.createdAt || doc.timestamp;
    if (!ts) return 'Непознато';
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('mk-MK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Лекција': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Тест': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Сценарио': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Работен лист': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Писмена работа': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Се вчитува документот...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-red-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{error || 'Документот не е пронајден'}</h3>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 text-indigo-600 font-bold hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
      </div>
    );
  }

  // Handle content which might be JSON
  let displayContent = document.content;
  try {
    if (typeof document.content === 'string' && document.content.trim().startsWith('{')) {
      const parsed = JSON.parse(document.content);
      
      if (document.type === 'Сценарио') {
        displayContent = `
# Сценарио за час: ${parsed.topic || parsed.title || 'Без наслов'}

## 1. Содржина и поими
${parsed.content}

## 2. Стандарди за оценување
${parsed.standards}

## 3. Воведна активност (10 мин)
${parsed.introActivity}

## 4. Главни активности (20-25 мин)
${parsed.mainActivity}

## 5. Завршна активност (10 мин)
${parsed.finalActivity}

## 6. Потребни средства
${parsed.resources}

## 7. Следење на напредокот
${parsed.assessment}
        `.trim();
      } else if (document.type === 'Лекција') {
        displayContent = `
# ${parsed.title}

## Цели на часот:
${parsed.objectives?.map((o: string) => `- ${o}`).join('\n')}

---

${parsed.content}
        `.trim();
      } else if (document.type === 'Тест') {
        let md = `# Тест: ${document.title}\n\n`;
        if (parsed.questions && Array.isArray(parsed.questions)) {
          parsed.questions.forEach((q: any, idx: number) => {
            md += `### ${idx + 1}. ${q.question} (${q.difficulty})\n`;
            q.options.forEach((opt: string, optIdx: number) => {
              md += `${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
            });
            md += `\n`;
          });
        }
        if (parsed.rubric) {
          md += `\n---\n\n## Клуч за одговори и Рубрика за оценување\n\n${parsed.rubric}`;
        }
        displayContent = md;
      }
    }
  } catch (e) {
    console.warn("Failed to parse document JSON, showing raw content", e);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Назад"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
              {document.title}
            </h2>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(document.type)}`}>
                {document.type}
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                {document.grade ? `${document.grade} одд.` : 'Непознато одделение'}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDate(document)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm"
          >
            <Printer className="w-4 h-4" />
            Печати
          </button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm min-h-[600px]">
        <FormattedText text={displayContent} />
      </div>
    </div>
  );
};

export default DocumentView;
