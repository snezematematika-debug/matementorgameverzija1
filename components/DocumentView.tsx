
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from '../services/firebase';
import { FileText, ArrowLeft, Loader2, Calendar, Tag, Download, Printer, FileDown, Copy, Check, ChevronDown } from 'lucide-react';
import FormattedText from './FormattedText';
import { Timestamp } from 'firebase/firestore';
import { parse } from 'marked';
import toast from 'react-hot-toast';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      setLoading(true);
      try {
        console.log(`Fetching document with ID: ${id}`);
        const docRef = doc(firestore, 'library', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocData({ id: docSnap.id, ...docSnap.data() });
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

  const formatDate = (data: any) => {
    const ts = data.createdAt || data.timestamp;
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
      case 'Работен лист': return 'bg-sky-100 text-sky-700 border-sky-200';
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

  if (error || !docData) {
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

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  // Handle content which might be JSON
  let displayContent = docData.content;
  let parsedJson: any = null;
  
  try {
    if (typeof docData.content === 'string' && docData.content.trim().startsWith('{')) {
      parsedJson = JSON.parse(docData.content);
      
      if (docData.type === 'Сценарио') {
        displayContent = `
# Сценарио за час: ${parsedJson.topic || parsedJson.title || 'Без наслов'}

## 1. Содржина и поими
${parsedJson.content}

## 2. Стандарди за оценување
${parsedJson.standards}

## 3. Воведна активност (10 мин)
${parsedJson.introActivity}

## 4. Главни активности (20-25 мин)
${parsedJson.mainActivity}

## 5. Завршна активност (10 мин)
${parsedJson.finalActivity}

## 6. Потребни средства
${parsedJson.resources}

## 7. Следење на напредокот
${parsedJson.assessment}
        `.trim();
      } else if (docData.type === 'Лекција') {
        displayContent = `
# ${parsedJson.title}

## Цели на часот:
${parsedJson.objectives?.map((o: string) => `- ${o}`).join('\n')}

---

${parsedJson.content}
        `.trim();
      } else if (docData.type === 'Тест' || docData.type === 'Писмена работа') {
        let md = `# ${docData.type}: ${docData.title}\n\n`;
        if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
          parsedJson.questions.forEach((q: any, idx: number) => {
            md += `### ${idx + 1}. ${q.question} (${q.difficulty || ''})\n`;
            if (q.options && Array.isArray(q.options)) {
              q.options.forEach((opt: string, optIdx: number) => {
                md += `${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
              });
            }
            md += `\n`;
          });
        }
        if (parsedJson.rubric) {
          md += `\n---\n\n## Клуч за одговори и Рубрика за оценување\n\n${parsedJson.rubric}`;
        }
        displayContent = md;
      } else if (docData.type === 'Работен лист') {
        displayContent = `
# Работен лист: ${parsedJson.topic || docData.title}

## Цели:
${parsedJson.objectives}

---

## Активности:
${parsedJson.activities}

---

## Заклучок:
${parsedJson.conclusion}
        `.trim();
      }
    }
  } catch (e) {
    console.warn("Failed to parse document JSON, showing raw content", e);
  }

  const handleDownloadMarkdown = () => {
    const blob = new Blob([displayContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docData.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Преземено како Markdown');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    toast.success('Копирано во меморија');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = () => {
    let htmlBody = '';
    let style = `
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      td, th { border: 1px solid black; padding: 8px; vertical-align: top; }
      .header-cell { background-color: #f3f4f6; font-weight: bold; width: 30%; }
      h1 { font-size: 16pt; color: #2E4053; margin-top: 20px; text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
      h2 { font-size: 14pt; color: #2E86C1; margin-top: 15px; }
      p { margin-bottom: 10px; }
      ul, ol { margin-bottom: 10px; }
    `;

    if (docData.type === 'Сценарио' && parsedJson) {
      // Specialized landscape layout for scenarios
      style = `
        @page Section1 {
          size: 29.7cm 21.0cm;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          mso-page-orientation: landscape;
        }
        div.Section1 { page: Section1; }
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
        td, th { border: 1px solid black; padding: 5px; vertical-align: top; word-wrap: break-word; }
        .header-cell { background-color: #f3f4f6; font-weight: bold; width: 20%; }
        .section-header { background-color: #e5e7eb; font-weight: bold; text-align: center; }
        h1, h2, h3 { margin: 5px 0; }
      `;

      htmlBody = `
        <div class="Section1">
          <p style="text-align: right; font-size: 9pt; color: #666; border-bottom: 1px solid #ccc;">Мате-Ментор - Платформа за дигитално образование</p>
          <table>
            <tr><td class="header-cell">Предмет:</td><td>Математика за ${docData.grade || '___'} одделение</td></tr>
            <tr><td class="header-cell">Наставна Единица:</td><td style="font-weight: bold;">${parsedJson.topic || docData.title}</td></tr>
            <tr><td class="header-cell">Тип:</td><td>Сценарио за час</td></tr>
          </table>
          <table>
            <thead>
              <tr>
                <th class="section-header" style="width: 15%;">Содржина</th>
                <th class="section-header" style="width: 20%;">Стандарди</th>
                <th class="section-header" style="width: 35%;">Сценарио</th>
                <th class="section-header" style="width: 15%;">Средства</th>
                <th class="section-header" style="width: 15%;">Следење</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${parse(parsedJson.content || '')}</td>
                <td>${parse(parsedJson.standards || '')}</td>
                <td>
                  <p><b>Воведна:</b></p>${parse(parsedJson.introActivity || '')}
                  <hr/>
                  <p><b>Главна:</b></p>${parse(parsedJson.mainActivity || '')}
                  <hr/>
                  <p><b>Завршна:</b></p>${parse(parsedJson.finalActivity || '')}
                </td>
                <td>${parse(parsedJson.resources || '')}</td>
                <td>${parse(parsedJson.assessment || '')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else {
      const htmlContent = parse(displayContent);
      htmlBody = `
        <p style="text-align: right; font-size: 9pt; color: #666; border-bottom: 1px solid #ccc;">Мате-Ментор - Платформа за дигитално образование</p>
        <table>
          <tr><td class="header-cell">Предмет:</td><td>Математика за ${docData.grade || '___'} одделение</td></tr>
          <tr><td class="header-cell">Тип:</td><td style="text-transform: uppercase; font-weight: bold;">${docData.type}</td></tr>
          <tr><td class="header-cell">Наслов:</td><td style="font-weight: bold;">${docData.title}</td></tr>
          <tr><td class="header-cell">Датум:</td><td>${formatDate(docData)}</td></tr>
        </table>
        <h1>${docData.title}</h1>
        <div>${htmlContent}</div>
        <br/><br/>
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; border-top: 1px solid black; padding-top: 10px;">Датум: ________________</td>
            <td style="border: none; border-top: 1px solid black; padding-top: 10px; text-align: right;">Потпис: ________________</td>
          </tr>
        </table>
      `;
    }
    
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docData.title}</title>
        <style>${style}</style>
      </head>
      <body>${htmlBody}</body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docData.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Преземено како Word');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 20mm;
          }
          body {
            background: white !important;
          }
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .document-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 no-print">
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
              {docData.title}
            </h2>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${getTypeColor(docData.type)}`}>
                {docData.type}
              </span>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap bg-slate-100 text-slate-700 border-slate-200">
                {docData.grade ? `${docData.grade} одд.` : 'Непознато одделение'}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDate(docData)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm outline-none">
                Зачувај како
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[160px] bg-white rounded-xl p-1 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200 z-50"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
                  onSelect={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  Копирај во меморија
                </DropdownMenu.Item>
                
                <DropdownMenu.Item 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
                  onSelect={handleDownloadMarkdown}
                >
                  <Download className="w-4 h-4" />
                  Markdown (.md)
                </DropdownMenu.Item>
                
                <DropdownMenu.Item 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
                  onSelect={handleDownloadWord}
                >
                  <FileDown className="w-4 h-4" />
                  Word (.doc)
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 text-sm"
          >
            <Printer className="w-4 h-4" />
            Печати
          </button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm min-h-[600px] document-card print-container">
        <FormattedText text={displayContent} />
      </div>
    </div>
  );
};

export default DocumentView;
