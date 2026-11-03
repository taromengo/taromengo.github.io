// The section at the reading line lights its parts of the pinned figure; the rest fade.
// Sections name their parts in data-nodes; figure parts carry data-node, and edges carry data-link (lit when both ends are).
const fig = document.querySelector('.fig svg');
const sections = [...document.querySelectorAll('.text [data-nodes]')];
const stacked = matchMedia('(max-width: 900px)');

function light(names) {
  const on = new Set(names);
  fig.querySelectorAll('[data-node]').forEach((g) => {
    g.classList.toggle('lit', on.has(g.dataset.node));
    g.classList.toggle('dim', on.size > 0 && !on.has(g.dataset.node));
  });
  fig.querySelectorAll('[data-link]').forEach((g) => {
    const both = g.dataset.link.split(' ').every((n) => on.has(n));
    g.classList.toggle('lit', both);
    g.classList.toggle('dim', on.size > 0 && !both);
  });
}

let current = [];
function update() {
  // Before the reader scrolls, show the whole figure at full strength; lighting starts with reading.
  if (stacked.matches || scrollY < 24) { current = []; light(current); return; }
  const line = innerHeight * 0.45;
  let active = null;
  for (const s of sections) if (s.getBoundingClientRect().top <= line) active = s;
  current = active && active.dataset.nodes ? active.dataset.nodes.split(' ') : [];
  light(current);
}

let queued = false;
addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; update(); });
}, { passive: true });
// Stacked, a figure wider than the screen scrolls inside its frame: say so, and let the keyboard scroll it.
const frame = document.querySelector('.fig .frame');
const hint = document.createElement('span');
hint.className = 'hint';
hint.textContent = 'Scroll sideways to see the whole figure.';
document.querySelector('.fig figcaption')?.prepend(hint);
function fit() {
  const over = frame.scrollWidth > frame.clientWidth + 1;
  frame.closest('.fig').classList.toggle('scrolls', over);
  if (over) {
    frame.tabIndex = 0;
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', 'Figure, scrolls sideways');
  } else {
    frame.removeAttribute('tabindex');
    frame.removeAttribute('role');
    frame.removeAttribute('aria-label');
  }
}

addEventListener('resize', () => { update(); fit(); });
stacked.addEventListener('change', () => { update(); fit(); });
update();
fit();

// Hovering a term previews its part; leaving returns to the section's parts.
document.querySelectorAll('.term[data-node]').forEach((t) => {
  t.addEventListener('pointerenter', () => { if (!stacked.matches) light(t.dataset.node.split(' ')); });
  t.addEventListener('pointerleave', () => light(current));
});

// A motif inside the text plays once, when it first scrolls into view.
document.querySelectorAll('.motif.on-page').forEach((m) => {
  m.classList.add('wait');
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    m.classList.remove('wait');
    io.disconnect();
  }, { threshold: 0.4 }).observe(m);
});

// Theme follows the system until the visitor flips it. A page with its own fixed scheme leaves the button out.
const themeBtn = document.getElementById('theme');
if (themeBtn) {
const isDark = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
const labelTheme = () => (themeBtn.textContent = isDark() ? 'Light theme' : 'Dark theme');
themeBtn.addEventListener('click', () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; labelTheme(); });
labelTheme();
}
