import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed in this session
      if (!sessionStorage.getItem('dacha_install_dismissed')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Щоб встановити додаток Дача на iPhone або iPad:\n1. Натисніть кнопку "Поділитися" (Share)\n2. Виберіть "На початковий екран" (Add to Home Screen)');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('dacha_install_dismissed', 'true');
  };

  if (!showBanner || installed) return null;

  return (
    <div className="bg-[#1C3B2B] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs border-b border-[#2A523D]">
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="truncate">
          <p className="font-bold text-white truncate">Встановити нативний додаток «Дача»</p>
          <p className="text-[11px] text-emerald-200/80 truncate">
            Швидкий запуск з головного екрана та офлайн доступ
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-lg bg-white text-[#1C3B2B] font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5 text-[#36674D]" />
          <span>Встановити</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-white/60 hover:text-white transition-colors"
          title="Сховати"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
