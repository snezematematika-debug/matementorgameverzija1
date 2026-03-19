
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { firestore, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { Folder, FileText, Trash2, ExternalLink, Loader2, Search, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface LibraryItem {
  id: string;
  title: string;
  content: string;
  type: string;
  timestamp: any;
}

interface LibraryProps {
  onOpen: (item: LibraryItem) => void;
}

const Library: React.FC<LibraryProps> = ({ onOpen }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Сите');

  const fetchItems = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestore, 'library'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedItems: LibraryItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as LibraryItem);
      });
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching library items:', error);
      // handleFirestoreError(error, OperationType.LIST, 'library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Дали сте сигурни дека сакате да го избришете овој материјал?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'library', id));
      setItems(items.filter(item => item.id !== id));
      toast.success('Материјалот е избришан.');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Грешка при бришење.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Сите' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Непознато';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
            <Folder className="w-8 h-8 text-indigo-600" />
            Моја Библиотека
          </h2>
          <p className="text-slate-500 text-sm">Вашите зачувани наставни материјали на едно место</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Пребарај по наслов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-2 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="Сите">Сите типови</option>
            <option value="Лекција">Лекции</option>
            <option value="Тест">Тестови</option>
            <option value="Сценарио">Сценарија</option>
            <option value="Работен лист">Работни листови</option>
            <option value="Писмена работа">Писмени работи</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Се вчитава библиотеката...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Наслов</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Датум</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Акции</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-700">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpen(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                          title="Отвори"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">Отвори</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                          title="Избриши"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Избриши</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Folder className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-600">Библиотеката е празна</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
            {searchTerm || filterType !== 'Сите' 
              ? 'Нема резултати за вашето пребарување.' 
              : 'Зачувајте некој материјал за да го видите овде.'}
          </p>
          {(searchTerm || filterType !== 'Сите') && (
            <button 
              onClick={() => { setSearchTerm(''); setFilterType('Сите'); }}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              Исчисти филтри
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
