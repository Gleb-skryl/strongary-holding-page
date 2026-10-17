(() => {
  // Keep local previews and other copies out of the production counter.
  if (!['strongary.com', 'www.strongary.com'].includes(window.location.hostname)) return;

  // Yandex Metrica asynchronous loader.
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=112412512', 'ym');

  window.ym(112412512, 'init', {
    accurateTrackBounce: true,
    trackLinks: true,
    trackHash: false,
    clickmap: false,
    webvisor: false,
    ecommerce: false
  });
})();
