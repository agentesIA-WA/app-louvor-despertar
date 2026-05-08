import { AlertTriangle } from 'lucide-react';

export default function ModalConfirmacao({ isOpen, titulo, mensagem, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{titulo}</h3>
          <p className="text-sm text-slate-500 mb-6">{mensagem}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition shadow-lg shadow-red-200"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}