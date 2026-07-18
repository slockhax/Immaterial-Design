/* Shared docs-site behaviour — NOT part of the design system */

function setNavActive() {
  var path = location.pathname.split('/').pop() || 'index.html';
  var hash = location.hash;
  var best = null, bestScore = 0;

  document.querySelectorAll('.docs-sidebar .nav-item').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var parts = href.split('#');
    var hrefPath = parts[0];
    var hrefHash = parts[1] ? '#' + parts[1] : '';
    var score = 0;

    if (hrefPath === path) {
      if (hrefHash) {
        // nav item targets a specific section — only win on exact hash match
        score = (hrefHash === hash) ? 2 : 0;
      } else {
        // nav item targets the page itself — fallback when no hash matches
        score = hash ? 1 : 2;
      }
    }

    if (score > bestScore) { bestScore = score; best = a; }
  });

  if (best) best.classList.add('is-active');
}
