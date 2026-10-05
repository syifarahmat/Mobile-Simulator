// Injecté via le manifest à document_start en world MAIN.
// S'exécute avant tout script de la page, uniquement dans l'iframe du simulateur.
// Idempotent : Chrome ré-exécute le script à chaque navigation de l'iframe, et le Window
// est recyclé en same-origin → on évite l'erreur "Cannot redefine property: frameElement".
if (window.name === 'mobile-first-simulator') {
    try {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'frameElement');
        // Déjà spoofé (getter own, non-configurable) → on ne refait rien.
        const alreadySpoofed = descriptor && descriptor.configurable === false && typeof descriptor.get === 'function';
        if (!alreadySpoofed) {
            Object.defineProperty(window, 'frameElement', {
                get: function () { return null; },
                configurable: false
            });
        }
    } catch (e) { /* property déjà figée par une précédente injection : on l'ignore */ }
}

// Pont de test des modales.
// Le content script (monde isolé) ne peut pas exposer de fonction au monde MAIN de la page.
// On définit donc ici window.displayModale() dans le monde MAIN, mais UNIQUEMENT à la demande
// explicite du simulateur (event 'mf:enable-modale-helper'), pour ne pas polluer le namespace
// global des sites web visités. L'appel relaie la clé au content script via un CustomEvent.
window.addEventListener('mf:enable-modale-helper', function () {
    window.displayModale = function (key) {
        window.dispatchEvent(new CustomEvent('mf:display-modale', { detail: key }));
    };
}, { once: true });