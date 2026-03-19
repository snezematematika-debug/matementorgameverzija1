import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FileText, Printer, Save, Database, Download, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveToLibrary } from '../services/libraryService';
import { useAuth } from '../services/firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SaveOptionsDropdownProps {
  title: string;
  content: string;
  type: string;
  onDownloadWord: () => void;
  onDownloadMarkdown: () => void;
  onPrint: () => void;
}

const SaveOptionsDropdown: React.FC<SaveOptionsDropdownProps> = ({
  title,
  content,
  type,
  onDownloadWord,
  onDownloadMarkdown,
  onPrint,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveToLibrary = async () => {
    if (!user) {
      toast.error('Мора да сте најавени за да зачувате во библиотека');
      return;
    }

    setIsSaving(true);
    try {
      await saveToLibrary({
        title,
        content,
        type,
        userId: user.uid,
      });
      toast.success('Успешно зачувано во "Моја Библиотека"!', {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        duration: 4000,
      });
    } catch (error) {
      toast.error('Грешка при зачувување во библиотека');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all outline-none">
          <Save className="w-4 h-4" />
          Опции за зачувување
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-xl p-1 shadow-2xl border border-indigo-50 animate-in fade-in zoom-in duration-200 z-50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
            onClick={onDownloadWord}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Word (.docx)
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
            onClick={onPrint}
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            PDF формат (Печатење)
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer outline-none transition-colors"
            onClick={onDownloadMarkdown}
          >
            <Download className="w-4 h-4 text-slate-600" />
            Markdown (.md)
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-indigo-50 my-1" />

          <DropdownMenu.Item
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer outline-none transition-colors",
              isSaving && "opacity-50 cursor-wait"
            )}
            onClick={handleSaveToLibrary}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Зачувај во 'Моја Библиотека'
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default SaveOptionsDropdown;
