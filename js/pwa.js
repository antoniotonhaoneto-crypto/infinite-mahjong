// Instalação do aplicativo (PWA) e registro do Service Worker.

export function initPWA() {
  let deferredPrompt = null;
  const overlay = document.getElementById('install-overlay');
  const openButton = document.getElementById('install-button');
  const confirmButton = document.getElementById('install-confirm');
  const closeButton = document.getElementById('install-close');
  const help = document.getElementById('install-help');

  if (!overlay || !openButton || !confirmButton || !closeButton || !help) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed = () => window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
  const dismissed = () => sessionStorage.getItem('mahjong-install-dismissed') === '1';

  function openDialog() {
    if (installed()) return;
    overlay.classList.add('visible');
    if (deferredPrompt) {
      help.style.display = 'none';
      confirmButton.hidden = false;
    } else {
      help.style.display = 'block';
      confirmButton.hidden = true;
      help.textContent = isIOS
        ? 'No Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.'
        : 'Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial. A instalação direta depende do navegador.';
    }
  }

  function hideDialog() {
    overlay.classList.remove('visible');
    sessionStorage.setItem('mahjong-install-dismissed', '1');
  }

  openButton.addEventListener('click', openDialog);
  closeButton.addEventListener('click', hideDialog);
  confirmButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    hideDialog();
    await prompt.prompt();
    try {
      await prompt.userChoice;
    } catch (error) {
      console.warn(error);
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    openButton.hidden = false;
    if (!dismissed() && !installed()) openDialog();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    overlay.classList.remove('visible');
    openButton.hidden = true;
  });

  if (!installed()) {
    openButton.hidden = false;
    if (isIOS && !dismissed()) {
      window.addEventListener('load', () => setTimeout(openDialog, 1200), { once: true });
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Offline indisponível: não foi possível registrar o Service Worker.', error);
      });
    });
  }
}

