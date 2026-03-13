import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { canShowInstallPrompt, showInstallPrompt, isAppInstalled } from '@/lib/registerSW';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if user has dismissed before
    const dismissedBefore = localStorage.getItem('pwa-install-dismissed');
    if (dismissedBefore) {
      setDismissed(true);
      return;
    }

    // Check if install prompt is available
    const checkPrompt = setInterval(() => {
      if (canShowInstallPrompt()) {
        setShow(true);
        clearInterval(checkPrompt);
      }
    }, 1000);

    return () => clearInterval(checkPrompt);
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!show || dismissed || isAppInstalled()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">Install pgInspect</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install the app for quick access and offline support
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="text-xs"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-surface-hover text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
