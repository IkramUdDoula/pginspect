// Service Worker registration

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('New service worker available');
                  // You could show a notification to the user here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    });
  }
}

// Check if app is installed
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Install prompt handling
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log('Install prompt available');
});

export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!deferredPrompt) {
      resolve(false);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        resolve(true);
      } else {
        console.log('User dismissed the install prompt');
        resolve(false);
      }
      deferredPrompt = null;
    });
  });
}

export function canShowInstallPrompt(): boolean {
  return deferredPrompt !== null;
}
