
import * as THREE from "three";

/* camOu – EXPLORE GLOBE
   Five freely positioned environments
   Navigation / Video / Visuals / Compass / Modals
*/

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.86,
  visualScale: 0.78
};

// Farbwelt des camOu-Covers (Hauptglobus und Weltraum).
// Die dunkleren Türkisabstufungen dienen nur Tiefe und Lesbarkeit.
const CAMOU_THEME = Object.freeze({
  aqua: "#88C8C8",
  yellow: "#C0C47A",
  pink: "#E9C3CE",
  paper: "#FCFCFC",
  ink: "#26565D"
});

const ASSETS = {
  home: new URL("./assets/hero.jpg", import.meta.url).href,
  homeVideo: new URL("./assets/test.mp4", import.meta.url).href,
  music: new URL("./assets/release.jpg", import.meta.url).href,
  visuals: new URL("./assets/visuals.jpg", import.meta.url).href,
  // Die Bildfolge im ??-Player entspricht genau den vier Assets.
  visualSlides: [
    new URL("./assets/visuals.jpg", import.meta.url).href,
    new URL("./assets/visuals-01.jpg", import.meta.url).href,
    new URL("./assets/visuals-03.jpg", import.meta.url).href,
    new URL("./assets/visuals-04.jpg", import.meta.url).href
  ],
  archive: new URL("./assets/archive.jpg", import.meta.url).href
};

const sections = [
  {
    name: "zuhause",
    eyebrow: "01 — NEW PROJECT",
    title: ["c a m O u"],
    body: ["camoufleur, camoufleuse & camouflage"],
    image: ASSETS.home
  },
  {
    name: "musik",
    eyebrow: "02 — RELEASES",
    title: ["f r a g m e n t e"],
    body: [
      "wer weist den weg?",
      "du bist der wind, er ist der wind, sie ist der wind.",
      "welche farbe trägt wohl der nächste schmetterling?",
      "federn wachsen, jeder seine eigenen. harmonieren sie?",
      "am ende bleibst nur du, noch bevor der fittich verdirbt, bevor selbst der wind ungreifbar wird.",
      "ein junge, und der wind."
    ],
    image: ASSETS.music
  },
  {
    name: "??",
    eyebrow: "03 — VISUAL WORKS",
    title: ["??"],
    body: ["???????, ???. ??!"],
    image: ASSETS.visuals
  },
  {
    name: "echo",
    eyebrow: "04 — HALL",
    title: ["echo"],
    body: [
      "du entscheidest wo mein",
      "echo zu hoeren ist"
    ],
    image: ASSETS.archive
  },
  {
    name: "kontakt",
    eyebrow: "05 — GET IN TOUCH",
    title: ["kontakt"],
    body: [
      "für anfragen oder einfach so,",
      "gib mir bisschen zeit zu antworten tho^^"
    ]
  }
];

/* =========================================
   HELPERS
========================================= */

const $ = id => document.getElementById(id);

const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, v));

const lerp = (a, b, t) =>
  a + (b - a) * t;

const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const wrapAngle = a =>
  Math.atan2(Math.sin(a), Math.cos(a));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/* =========================================
   DOM UND THREE.JS
========================================= */

const container = $("globe");
const stage = document.querySelector(".globe-stage");
const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

// Sichtbare Namen im HTML-Menue aktualisieren, ohne dessen Elemente,
// Formatierung oder die bestehenden data-section-Klickziele auszutauschen.
const CAMOU_MENU_LABELS = ["zuhause", "musik", "??", "echo", "kontakt"];
const CAMOU_OLD_MENU_LABELS = ["HOME", "MUSIC", "VISUALS", "ECHOES", "CONTACT"];

function camouRenameNavigation() {
  navButtons.forEach((button, position) => {
    const sectionIndex = Number(button.dataset.section);
    const index = Number.isInteger(sectionIndex) &&
      sectionIndex >= 0 && sectionIndex < CAMOU_MENU_LABELS.length
      ? sectionIndex : position;
    const newName = CAMOU_MENU_LABELS[index];
    if (!newName) return;

    // Nur den Beschriftungstext ersetzen. Verschachtelte Markup-Elemente
    // (z. B. Unterstreichungen) und Event-Listener bleiben unangetastet.
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    let labelNode = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue.trim();
      if (value === CAMOU_OLD_MENU_LABELS[index] || value === newName) {
        labelNode = node;
        break;
      }
    }

    if (labelNode) {
      const raw = labelNode.nodeValue;
      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      labelNode.nodeValue = leading + newName + trailing;
    } else {
      const label = button.querySelector("[data-nav-label], .nav-label, .nav-link-text");
      if (label) label.textContent = newName;
      else button.textContent = newName;
    }
    button.setAttribute("aria-label", newName);
  });
}

camouRenameNavigation();

/* =========================================
   MENUE-OVERLAYS / MITTIGE NAVIGATION
   Das bestehende HTML bleibt unveraendert.
========================================= */
const CAMOU_MENU_BACKGROUND = [
  // Silber-Grau mit papierweissen, organischen Aufhellungen.
  "radial-gradient(ellipse 35% 200% at 8% -10%, rgba(255,255,255,.31) 0%, rgba(255,255,255,.08) 52%, transparent 95%)",
  "radial-gradient(ellipse 37% 210% at 53% 115%, rgba(255,255,255,.25) 0%, rgba(255,255,255,.05) 52%, transparent 98%)",
  "radial-gradient(ellipse 30% 185% at 97% 7%, rgba(255,255,255,.22) 0%, transparent 88%)",
  "linear-gradient(110deg, #92999E 0%, #AEB3B7 28%, #969DA2 60%, #B1B7BA 84%, #92999E 100%)"
].join(", ");

// Nur die beiden Menueleisten und deren Navigationslinks formatieren.
// Andere Schriften, Videos oder die Textur der Kugel bleiben unberuehrt.
function camouInjectMenuStyles() {
  if (document.getElementById("camou-menu-style")) return;
  const style = document.createElement("style");
  style.id = "camou-menu-style";
  style.textContent = `
    .camou-menu-shell,
    .camou-menu-shell a,
    .camou-menu-shell button,
    .camou-menu-shell span {
      color: #FCFCFC !important;
    }
    /* Sichtbare Menuepunkte stets in Kleinschreibung zeigen,
       selbst wenn die vorhandene Seiten-CSS uppercase erzwingt. */
    .camou-menu-shell .nav-link,
    .camou-menu-shell .nav-link *,
    #current-section {
      text-transform: none !important;
    }
    .camou-menu-shell .nav-link,
    .camou-menu-shell .nav-link:link,
    .camou-menu-shell .nav-link:visited {
      color: #FCFCFC !important;
      transition: color .2s ease;
    }
    .camou-menu-shell .nav-link.active,
    .camou-menu-shell .nav-link:hover,
    .camou-menu-shell .nav-link:focus-visible {
      color: #88C8C8 !important;
      border-bottom-color: #88C8C8 !important;
    }
    .camou-menu-shell .nav-link.active::after,
    .camou-menu-shell .nav-link:hover::after,
    .camou-menu-shell .nav-link:focus-visible::after {
      background-color: #88C8C8 !important;
      border-color: #88C8C8 !important;
    }
    @media (min-width: 901px) {
      .camou-nav-centered {
        position: fixed !important;
        left: 50vw !important;
        top: var(--camou-nav-center-y, 40px) !important;
        transform: translate(-50%, -50%) !important;
        width: max-content !important;
        max-width: calc(100vw - 230px);
        margin: 0 !important;
        z-index: 50 !important;
        white-space: nowrap !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function camouSetMenuBackground(bar) {
  if (!bar || bar === document.body || bar === stage) return;
  bar.classList.add("camou-menu-shell");
  bar.style.setProperty("background", CAMOU_MENU_BACKGROUND, "important");
}

function camouFindBarFrom(element, atTop) {
  // Fallback fuer Menueleisten ohne header- / footer-Tags.
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const box = node.getBoundingClientRect();
    const view = window.innerWidth;
    if (box.width < view * .76 || box.height < 35 || box.height > 150) continue;
    if (atTop && box.top >= -10 && box.top < 130) return node;
    if (!atTop && box.bottom >= window.innerHeight - 160) return node;
  }
  return null;
}

function camouRemoveTopProjectLabel(header) {
  const bar = header || camouFindBarFrom($("logo"), true);
  if (!bar) return;
  for (const node of bar.querySelectorAll("a, button, span, small, p, div")) {
    if (node.children.length && !node.matches("a, button")) continue;
    if (node.textContent.trim().toLowerCase() !== "project") continue;
    const rect = node.getBoundingClientRect();
    if (rect.top < -5 || rect.top > 175 || rect.left < window.innerWidth * .65) continue;
    (node.closest("a, button") || node).remove();
  }
}

// Das Logo wird als vorhandenes DOM-Element weiterverwendet, damit
// seine Typografie, Verlinkung und die bisherigen Klicks erhalten bleiben.
function camouRemoveLogoPeriod() {
  const logo = $("logo");
  if (!logo || !/camou\.\s*$/i.test(logo.textContent)) return;
  const walker = document.createTreeWalker(logo, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (!nodes[i].nodeValue.trim()) continue;
    nodes[i].nodeValue = nodes[i].nodeValue.replace(/\.([\s]*)$/, "$1");
    break;
  }
}

function camouShortenFooterCredit(footer) {
  if (!footer || !/b3nn3t/i.test(footer.textContent) ||
      !/independent artist/i.test(footer.textContent)) return;
  const walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (let i = 0; i < nodes.length; i++) {
    const before = nodes[i].nodeValue;
    if (!/independent artist/i.test(before)) continue;
    nodes[i].nodeValue = before.replace(/\s*[-–—]?\s*independent artist\b/gi, "");
    // Auch bei getrennten HTML-Spans den alleinstehenden Bindestrich entfernen.
    for (let j = i - 1; j >= 0; j--) {
      if (!nodes[j].nodeValue.trim()) continue;
      nodes[j].nodeValue = nodes[j].nodeValue.replace(/\s*[-–—]\s*$/, "");
      break;
    }
  }
}

function camouFindNavGroup(header) {
  if (!header || navButtons.length < 2) return null;
  let node = navButtons[0].parentElement;
  while (node && node !== header) {
    if (navButtons.every(button => node.contains(button)) &&
        !node.contains($("logo"))) return node;
    node = node.parentElement;
  }
  return null;
}

function camouCenterNav(header) {
  const nav = camouFindNavGroup(header);
  if (!nav) return;
  nav.classList.add("camou-nav-centered");
  // Die feste Position ist unabhaengig von der Spalten-/Flexverteilung
  // des Headers. Die Hoehe folgt bei Resize/Scroll dem realen Balken.
  const rect = header.getBoundingClientRect();
  const mid = rect.top + rect.height / 2;
  document.documentElement.style.setProperty("--camou-nav-center-y", `${mid}px`);
}

function camouApplyMenuBackgrounds() {
  const header = document.querySelector(
    "body > header, header.site-header, .site-header, .topbar, .top-bar, .header-bar, #site-header"
  ) || camouFindBarFrom($("logo"), true);

  const footer = document.querySelector(
    "body > footer, footer.site-footer, .site-footer, .bottombar, .bottom-bar, .footer-bar, #site-footer"
  ) || camouFindBarFrom(
    [...document.querySelectorAll("a, span, p, div")]
      .find(el => el.children.length === 0 && el.textContent.trim().toLowerCase() === "impressum"),
    false
  );

  camouInjectMenuStyles();
  camouSetMenuBackground(header);
  camouSetMenuBackground(footer);
  camouRemoveTopProjectLabel(header);
  camouRemoveLogoPeriod();
  camouShortenFooterCredit(footer);
  camouCenterNav(header);
}

camouApplyMenuBackgrounds();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", camouApplyMenuBackgrounds, { once: true });
}
window.addEventListener("resize", camouApplyMenuBackgrounds, { passive: true });
window.addEventListener("scroll", camouApplyMenuBackgrounds, { passive: true });

const mobile = window.matchMedia(
  "(hover: none) and (pointer: coarse)"
).matches;

const defaultZoom = mobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

for (const id of [
  "camou-motion-control",
  "compass-permission"
]) {
  document.getElementById(id)?.remove();
}

// Papieroberflaeche des Universums: farbige Abriebspuren, leichte
// Gebrauchsflecken und feines Korn. Bleibt statisch beim Drehen.
function camouCreateUsedPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = CAMOU_THEME.paper;
  ctx.fillRect(0, 0, w, h);

  const smear = (x, y, rx, ry, rgb, strength, angle = 0) => {
    ctx.save();
    ctx.translate(x * w, y * h);
    ctx.rotate(angle);
    ctx.scale(rx * w, ry * h);
    const gradient = ctx.createRadialGradient(-0.10, -0.06, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(${rgb},${strength})`);
    gradient.addColorStop(0.38, `rgba(${rgb},${strength * 0.55})`);
    gradient.addColorStop(0.78, `rgba(${rgb},${strength * 0.13})`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  };

  // Matte, unterschiedlich geformte Papierverfaerbungen.
  smear(.07, .22, .32, .34, "237,237,222", .43, -.24); // #ededde
  smear(.91, .76, .38, .29, "237,237,222", .38,  .35);
  smear(.56, .17, .33, .20, "247,247,215", .36, -.18); // #f7f7d7
  smear(.19, .79, .34, .25, "247,247,215", .26,  .22);
  smear(.71, .46, .23, .34, "168,205,244", .22,  .42); // #a8cdf4
  smear(.32, .51, .25, .25, "168,205,244", .16, -.43);
  smear(.95, .17, .24, .27, "214,220,226", .46, -.20); // #d6dce2
  smear(.12, .54, .25, .32, "214,220,226", .35,  .35);
  smear(.53, .93, .41, .17, "237,237,222", .22, -.08);

  // Sanfte hellgraue Zeichen- und Abriebspuren neben den blauen Pigmenten.
  smear(.23, .21, .19, .13, "164,171,176", .23, -.30);
  smear(.78, .58, .16, .22, "178,182,187", .28,  .26);
  smear(.47, .87, .26, .11, "156,162,166", .21, -.18);
  smear(.90, .32, .14, .13, "188,192,196", .26,  .32);

  // Schwache, durch Verwischen entstandene Striche statt klarer Flecken.
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    smear(
      .18 + t * .49,
      .66 - .055 * Math.sin(t * 5.2) + .022 * t,
      .038 + .007 * Math.sin(i * 2.1),
      .055,
      i % 3 === 0 ? "168,205,244" : "214,220,226",
      .055 + .022 * (1 - t),
      -.27
    );
  }

  ctx.save();
  ctx.lineWidth = .75;
  ctx.strokeStyle = "rgba(168,205,244,.095)";
  ctx.beginPath();
  ctx.moveTo(w * .08, h * .43);
  ctx.bezierCurveTo(w * .20, h * .38, w * .25, h * .51, w * .42, h * .46);
  ctx.stroke();
  ctx.strokeStyle = "rgba(237,237,222,.25)";
  ctx.beginPath();
  ctx.moveTo(w * .64, h * .84);
  ctx.bezierCurveTo(w * .74, h * .77, w * .86, h * .85, w * .96, h * .81);
  ctx.stroke();
  ctx.restore();

  // Wie verwischte Pastell- oder Kreidespuren auf benutztetem Papier:
  // einzelne transparente Haarlinien, Aussetzer und lose Pigmentkoerner.
  // Feste Startzahl, damit bei jedem Laden das gleiche Bild erscheint.
  let wearSeed = 0x521AC0;
  const wearRandom = () => {
    wearSeed = (Math.imul(wearSeed, 1664525) + 1013904223) >>> 0;
    return wearSeed / 4294967296;
  };

  const wearAreas = [
    { x: .15, y: .30, spreadX: .20, spreadY: .10, angle: -.28, rgb: "214,220,226", opacity: .12 },
    { x: .79, y: .17, spreadX: .21, spreadY: .09, angle:  .42, rgb: "168,205,244", opacity: .11 },
    { x: .70, y: .84, spreadX: .25, spreadY: .08, angle: -.16, rgb: "237,237,222", opacity: .16 },
    { x: .26, y: .82, spreadX: .15, spreadY: .08, angle:  .20, rgb: "247,247,215", opacity: .13 },
    { x: .59, y: .46, spreadX: .12, spreadY: .07, angle: -.55, rgb: "214,220,226", opacity: .08 },
    { x: .26, y: .21, spreadX: .16, spreadY: .07, angle: -.34, rgb: "150,155,159", opacity: .20 },
    { x: .74, y: .61, spreadX: .17, spreadY: .10, angle:  .26, rgb: "172,178,181", opacity: .22 },
    { x: .44, y: .87, spreadX: .22, spreadY: .06, angle: -.19, rgb: "161,166,170", opacity: .19 }
  ];

  for (const area of wearAreas) {
    ctx.save();
    ctx.translate(area.x * w, area.y * h);
    ctx.rotate(area.angle);
    ctx.lineCap = "round";
    for (let k = 0; k < 82; k++) {
      const sx = (wearRandom() - .5) * area.spreadX * w * 2;
      const sy = (wearRandom() - .5) * area.spreadY * h * 2;
      const length = 4 + wearRandom() * 47;
      const dy = (wearRandom() - .5) * 8;
      ctx.strokeStyle = `rgba(${area.rgb},${area.opacity * (.15 + wearRandom() * .75)})`;
      ctx.lineWidth = .4 + wearRandom() * 2.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + length * .5, sy + dy * 1.8, sx + length, sy + dy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Winzige, unregelmaessige Papierfasern; keine grossen sichtbaren Punkte.
  const dustTones = ["214,220,226", "237,237,222", "168,205,244", "247,247,215", "170,174,178"];
  for (let k = 0; k < 2100; k++) {
    const px = wearRandom() * w;
    const py = wearRandom() * h;
    const shade = dustTones[Math.floor(wearRandom() * dustTones.length)];
    ctx.fillStyle = `rgba(${shade},${.035 + wearRandom() * .10})`;
    ctx.fillRect(px, py, .3 + wearRandom() * 2.2, .3 + wearRandom() * 1.1);
  }

  // Reproduzierbares, sehr feines Papierkorn (kein animiertes Rauschen).
  const image = ctx.getImageData(0, 0, w, h);
  const pixels = image.data;
  let seed = 0xC4A0F;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const grain = ((seed >>> 16) / 65535 - .5) * 5.5;
    pixels[i] = clamp(pixels[i] + grain, 0, 255);
    pixels[i + 1] = clamp(pixels[i + 1] + grain, 0, 255);
    pixels[i + 2] = clamp(pixels[i + 2] + grain, 0, 255);
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const scene = new THREE.Scene();
scene.background = camouCreateUsedPaperTexture();
// Dieselbe Papierfarbe auch vor dem ersten WebGL-Frame zeigen.
stage.style.backgroundColor = CAMOU_THEME.paper;
container.style.backgroundColor = CAMOU_THEME.paper;

const camera = new THREE.PerspectiveCamera(
  38,
  Math.max(1, container.clientWidth) /
    Math.max(1, container.clientHeight),
  0.1,
  100
);

let currentZoom = defaultZoom;
camera.position.z = currentZoom;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    mobile ? 1.5 : 2
  )
);

renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);
// Touch-Gesten an CAMOU übergeben
renderer.domElement.style.touchAction = "none";
stage.style.touchAction = "none";
/* =========================================
   CAMOU COSMOS
   SONNE UND ENTFERNTER PLANET
========================================= */

// Hintergrundobjekte an der Kamera befestigen.
// Dadurch bleiben sie beim Drehen der Kugel
// im Hintergrund und beeinflussen keine Navigation.

scene.add(camera);

// Erzeugt eine runde, weich beleuchtete
// Hintergrundgrafik als Three.js-Textur.
function createCosmicTexture(colors) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    128, 128, 0,
    128, 128, 128
  );

  colors.forEach(([position, color]) => {
    gradient.addColorStop(position, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

// Entfernte Sonne mit warmem Lichtschein
const camouSunTexture = createCosmicTexture([
  [0.00, "rgba(252,252,252,.95)"],
  [0.12, "rgba(252,252,252,.82)"],
  [0.25, "rgba(192,196,122,.62)"],
  [0.40, "rgba(192,196,122,.25)"],
  [0.65, "rgba(136,200,200,.09)"],
  [1.00, "rgba(136,200,200,0)"]
]);

const camouSun = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: camouSunTexture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  })
);

// Position wird abhängig vom Bildschirm berechnet
camouSun.position.set(8, 5, -25);
camouSun.scale.set(7, 7, 1);

camouSun.renderOrder = -10;

camera.add(camouSun);


/* =========================================
   CAMOU – MINERALISCHER PLANET
========================================= */


function createRockyPlanetTexture() {
  const size = 256;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;

  // Der urspruengliche reproduzierbare Rauschalgorithmus.
  const hash = (x, y) => {
    let n =
      Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };

  const noise = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const a =
      hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
    const b =
      hash(ix, iy + 1) * (1 - sx) +
      hash(ix + 1, iy + 1) * sx;

    return a * (1 - sy) + b * sy;
  };

  const lx = -0.48;
  const ly = 0.58;
  const lz = Math.sqrt(1 - lx * lx - ly * ly);

  // Ortskoordinaten einmal je Spalte beziehungsweise Zeile.
  const coordsX = new Float64Array(size);
  const coordsY = new Float64Array(size);
  for (let x = 0; x < size; x++) {
    coordsX[x] = (x + 0.5 - size / 2) / (size * 0.445);
  }
  for (let y = 0; y < size; y++) {
    coordsY[y] = (size / 2 - y - 0.5) / (size * 0.445);
  }

  for (let y = 0; y < size; y++) {
    const ny = coordsY[y];

    for (let x = 0; x < size; x++) {
      const nx = coordsX[x];
      const r2 = nx * nx + ny * ny;
      const i = (y * size + x) * 4;

      if (r2 >= 1) continue;

      const nz = Math.sqrt(1 - r2);
      const light = Math.max(0, nx * lx + ny * ly + nz * lz);
      const shade = 0.28 + 0.72 * light;

      const warp = noise(nx * 3.1 + 13, ny * 3.1 + 7) - 0.5;
      const u = nx + warp * 0.17;
      const v = ny - warp * 0.13;

      const large = noise(u * 5.2 + 27, v * 5.2 + 11);
      const medium = noise(u * 13.7 + 5, v * 13.7 + 19);
      const fine = noise(u * 31.3 + 21, v * 31.3 + 31);

      const mineral =
        0.58 * large + 0.30 * medium + 0.12 * fine;
      const relief = (mineral - 0.5) * 43;

      const radius = Math.sqrt(r2);
      const rimLight =
        Math.pow(1 - nz, 5) *
        Math.max(0, nx * -0.55 + ny * 0.80) * 0.16;
      const vignette =
        1 - 0.12 * Math.pow(radius, 3) + rimLight;

      data[i] = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            (161 + relief + (medium - 0.5) * 16) *
            shade * vignette
          )
        )
      );
      data[i + 1] = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            (122 + relief * 0.78) * shade * vignette
          )
        )
      );
      data[i + 2] = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            (139 + relief * 0.96 + (large - 0.5) * 13) *
            shade * vignette
          )
        )
      );

      const edge = Math.min(1, (1 - radius) * 110);
      data[i + 3] = Math.round(255 * edge);
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const camouPlanetTexture = createRockyPlanetTexture();

const camouPlanet = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: camouPlanetTexture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  })
);

// Position wird abhängig vom Bildschirm berechnet
camouPlanet.position.set(-8, -4.5, -25);
camouPlanet.scale.set(2.2, 2.2, 1);

camouPlanet.renderOrder = -9;

camera.add(camouPlanet);
/* =========================================
   CAMOU COSMOS
   RESPONSIVE HIMMELSKOERPER
========================================= */

function updateCosmosPositions() {

  const portrait =
    window.innerWidth <= 700 &&
    window.innerHeight > window.innerWidth;

  if (portrait) {

    // Sichtbaren Kameraausschnitt in der
    // Entfernung der Hintergrundobjekte berechnen.
    const depth = 25;

    const halfHeight =
      Math.tan(
        THREE.MathUtils.degToRad(camera.fov / 2)
      ) * depth;

    const halfWidth =
      halfHeight * camera.aspect;

    // Sonne rechts oben, ausserhalb der Kugel
camouSun.position.set(
  halfWidth * 0.65,
  halfHeight * 0.94,
  -depth
);

camouSun.scale.set(
  halfWidth * 0.85,
  halfWidth * 0.85,
  1
);

// Planet links unten, ausserhalb der Kugel
camouPlanet.position.set(
  -halfWidth * 0.65,
  -halfHeight * 0.94,
  -depth
);

camouPlanet.scale.set(
  halfWidth * 0.45,
  halfWidth * 0.45,
  1
);

  } else {

    // Bisherige Desktop-Darstellung
    camouSun.position.set(8, 5, -25);
    camouSun.scale.set(7, 7, 1);

    camouPlanet.position.set(-8, -4.5, -25);
    camouPlanet.scale.set(2.2, 2.2, 1);
  }

  sceneNeedsRender = true;
}
/* ENDE CAMOU COSMOS */
scene.add(
  new THREE.AmbientLight(0xe2f4f2, 1.15)
);

const light = new THREE.DirectionalLight(
  0xfcfcfc, 2.1
);

light.position.set(-3, 4, 5);
scene.add(light);

const rim = new THREE.PointLight(
  0x88c8c8, 24, 15
);

rim.position.set(4, -1, -3);
scene.add(rim);

// Die erprobte Szenenstruktur bleibt unveraendert.
// Den Roll-Ausgleich uebernimmt die Kamera, nicht eine zusaetzliche Kugelgruppe.
const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius, 160, 112
  ),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02
  })
);

globeGroup.add(globe);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius * 1.012, 96, 64
  ),
  new THREE.MeshBasicMaterial({
    color: 0x88c8c8,
    transparent: true,
    opacity: 0.055,
    side: THREE.BackSide
  })
);

globeGroup.add(atmosphere);

/* =========================================
   FREIE POSITIONIERUNG AUF DER KUGEL
========================================= */

const MAP_W = 2048;
const MAP_H = 1024;
const RAD = Math.PI / 180;

// Neigung der gesamten Komposition um ihre eigene Kugelmitte.
// HOME, MUSIC, VISUALS, ECHOES, CONTACT.
// Negativ = rechts / im Uhrzeigersinn.
const CAMOU_PANEL_ROLL_DEG = [0, -90, 180, 0, 20];

const PHOTO_W = 440;
const PHOTO_H = 320;
const PHOTO_Y = 136;
const COMPASS_Y = 115;

/*
  lon: Längengrad
  lat: Breitengrad
  tilt: Neigung der gesamten Komposition
  photoTilt: zusätzliche Neigung des Bildes
  imageX: horizontale Bildverschiebung
  textX: horizontale Textverschiebung
*/

const PLACES = [
  // 01 HOME – obere Halbkugel
  {
    lon: -150,
    lat: 45,
    tilt: -7,
    photoTilt: 6,
    imageX: 38,
    textX: -32
  },

  // 02 MUSIC – untere Halbkugel
  {
    lon: -120,
    lat: -45,
    tilt: 11,
    photoTilt: -6,
    imageX: -35,
    textX: 36
  },

  // 03 VISUALS – obere Halbkugel
  {
    lon: 0,
    lat: 45,
    tilt: -12,
    photoTilt: 7,
    imageX: 32,
    textX: -28
  },

  // 04 ECHOES – untere Halbkugel
  {
    lon: -15,
    lat: -45,
    tilt: 10,
    photoTilt: 0,
    imageX: -14,
    textX: 30
  },

  // 05 CONTACT – seitlicher Mittelbereich
  {
    lon: 125,
    lat: -5,
    tilt: -11,
    photoTilt: 8,
    imageX: -30,
    textX: 34
  }
].map(p => {
  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  return {
    ...p,
    x: ((0.25 + p.lon / 360 + 1) % 1) * MAP_W,
    y: (0.5 - p.lat / 180) * MAP_H,
    tiltR: p.tilt * RAD,
    photoR: p.photoTilt * RAD,
    nx: Math.cos(lat) * Math.sin(lon),
    ny: Math.sin(lat),
    nz: Math.cos(lat) * Math.cos(lon)
  };
});

/* =========================================
   ZUSTAND
========================================= */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointers = new Map();

let rotationX = PLACES[0].lat * RAD;
let rotationY = -PLACES[0].lon * RAD;

let velocityX = 0;
let velocityY = 0;

let previousX = 0;
let previousY = 0;
let lastTime = 0;

let isDragging = false;
let menuAnimating = false;

/* =========================================
   CAMOU – NAVIGATIONSFLUG
========================================= */

// Grosse Standardansicht
const CAMOU_FOCUS_ZOOM = mobile ? 6.0 : 6.2;

// Kugel-Gesamtansicht
const CAMOU_OVERVIEW_ZOOM = mobile ? 11.4 : 11.6;

// Animationsdauer in Millisekunden
const CAMOU_ZOOM_OUT_MS = 550;
const CAMOU_ROTATE_MS = 1100;
const CAMOU_ZOOM_IN_MS = 800;

// Animationszustand
let camouNavPhase = "idle";
let camouNavStartedAt = 0;

let camouNavZoomFrom = currentZoom;
let camouNavRotFromX = rotationX;
let camouNavRotFromY = rotationY;
let camouNavRollFrom = 0;
let camouNavTargetRoll = 0;

let targetRotationX = 0;
let targetRotationY = 0;
let pointerStart = null;

let pinchDistance = 0;
let pinchZoom = currentZoom;
let pinchAngle = 0;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;
let baseTextureCanvas = null;
let sceneNeedsRender = true;

let visualImages = [];
let visualIndex = 0;
let visualLeverPointer = null;
let visualLeverMoved = false;
let visualLeverStartY = 0;

/* =========================================
   HOME VIDEO
========================================= */

const homeVideo = document.createElement("video");

homeVideo.src = ASSETS.homeVideo;
homeVideo.loop = true;
homeVideo.playsInline = true;
homeVideo.preload = "none";
homeVideo.volume = 1;

let homeVideoStarted = false;
let homeVideoPlaying = false;
let homeVideoStarting = false;
let homeVideoFrameRequest = null;
let lastVideoFallbackPaint = 0;

function startHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null ||
    typeof homeVideo.requestVideoFrameCallback !== "function"
  ) return;

  const onVideoFrame = () => {
    homeVideoFrameRequest = null;
    if (!homeVideoPlaying) return;

    updateHomeVideoFrame();

    homeVideoFrameRequest =
      homeVideo.requestVideoFrameCallback(onVideoFrame);
  };

  homeVideoFrameRequest =
    homeVideo.requestVideoFrameCallback(onVideoFrame);
}

function stopHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null &&
    typeof homeVideo.cancelVideoFrameCallback === "function"
  ) {
    homeVideo.cancelVideoFrameCallback(
      homeVideoFrameRequest
    );
  }

  homeVideoFrameRequest = null;
}

/* =========================================
   BILDER UND GRAFIKEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 1024;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d");
      const gradient = ctx.createLinearGradient(
        0, 0, 1024, 1024
      );

      gradient.addColorStop(0, "#88C8C8");
      gradient.addColorStop(1, "#4C919B");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      resolve(canvas);
    };

    img.src = src;
  });
}

function cover(ctx, image, x, y, w, h) {
  const iw =
    image.videoWidth ||
    image.naturalWidth ||
    image.width;

  const ih =
    image.videoHeight ||
    image.naturalHeight ||
    image.height;

  if (!iw || !ih) return;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;

  ctx.drawImage(
    image,
    (iw - sw) / 2,
    (ih - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

function playButton(ctx, x, y) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(38,86,93,.75)";
  ctx.fill();

  ctx.strokeStyle = "#FCFCFC";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 6, y - 10);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x - 6, y + 10);
  ctx.closePath();

  ctx.fillStyle = "#FCFCFC";
  ctx.fill();
  ctx.restore();
}

/* =========================================
   ORGANISCHER HINTERGRUND
========================================= */


function drawBackground(ctx, width, height) {
  const small = document.createElement("canvas");
  small.width = 512;
  small.height = 256;

  const g = small.getContext("2d");
  const image = g.createImageData(small.width, small.height);
  const data = image.data;

  const aqua = [136, 200, 200];        // #88C8C8
  const deepAqua = [71, 145, 159];     // dunklere tuerkise Pigmente
  const blueAqua = [108, 180, 190];
  const yellow = [192, 196, 122];      // #C0C47A
  const pink = [233, 195, 206];        // #E9C3CE
  const paper = [252, 252, 252];       // #FCFCFC

  const blend = (c1, c2, amount) => {
    const t = clamp(amount, 0, 1);
    return [
      lerp(c1[0], c2[0], t),
      lerp(c1[1], c2[1], t),
      lerp(c1[2], c2[2], t)
    ];
  };

  // Horizontales Wrapping laesst die Flecken ueber 0 / 360 Grad weiterlaufen.
  const cloud = (u, v, cx, cy, rx, ry) => {
    const dx = Math.abs(u - cx);
    const wrappedX = Math.min(dx, 1 - dx) / rx;
    const dy = (v - cy) / ry;
    return 1 - smooth(Math.hypot(wrappedX, dy));
  };

  for (let y = 0; y < small.height; y++) {
    const v = (y + .5) / small.height;

    for (let x = 0; x < small.width; x++) {
      const u = (x + .5) / small.width;
      const phase = 2 * Math.PI * u;

      // Ueberlagerte Wellen brechen die Konturen der Farbflecken auf.
      const broad = Math.sin(phase * 2 + Math.sin(v * 7.8) * 1.2 + v * 5.2);
      const middle = Math.cos(phase * 4 - Math.sin(v * 11.3) - v * 8.1);
      const fine = Math.sin(phase * 10 + v * 32 + Math.cos(phase * 3) * 1.2);
      const flow = broad * .49 + middle * .33 + fine * .18;
      const shiftU = .035 * Math.sin(v * 16 + broad * 1.2)
        + .014 * Math.sin(phase * 6 + v * 21);
      const shiftV = .044 * Math.cos(phase * 3 + middle)
        + .012 * Math.sin(phase * 8 - v * 12);
      const warpedU = ((u + shiftU) % 1 + 1) % 1;
      const warpedV = v + shiftV;
      const softness = .88 + .12 * (flow + 1) / 2;

      // Vorwiegend ruhiges Hellblau mit sichtbar unregelmaessigen Tiefen.
      let color = blend(aqua, blueAqua,
        .09 + .19 * (.5 + .5 * middle)
      );
      const darkInfluence = (
        cloud(warpedU, warpedV, .29, .18, .22, .32) * .67 +
        cloud(warpedU, warpedV, .57, .78, .21, .29) * .68 +
        cloud(warpedU, warpedV, .89, .44, .20, .28) * .52 +
        cloud(warpedU, warpedV, .05, .57, .14, .25) * .37 +
        cloud(warpedU, warpedV, .42, .43, .12, .17) * .24
      ) * softness;
      color = blend(color, deepAqua, darkInfluence);

      // Gelbliche Pigmentinseln, gross genug um sichtbar zu bleiben.
      const yellowInfluence = (
        cloud(warpedU, warpedV, .83, .76, .21, .26) * .72 +
        cloud(warpedU, warpedV, .22, .38, .19, .24) * .64 +
        cloud(warpedU, warpedV, .67, .25, .14, .21) * .58 +
        cloud(warpedU, warpedV, .46, .91, .12, .18) * .40
      ) * softness;
      color = blend(color, yellow, yellowInfluence);

      // Kleiner als die Gelbzonen, aber erkennbare Rosatoene.
      const pinkInfluence = (
        cloud(warpedU, warpedV, .59, .52, .15, .23) * .57 +
        cloud(warpedU, warpedV, .10, .78, .12, .18) * .48 +
        cloud(warpedU, warpedV, .94, .15, .11, .16) * .42
      ) * softness;
      color = blend(color, pink, pinkInfluence);

      // Vereinzelte papierhelle Spuren, nicht deckend weiss.
      const lightInfluence = (
        cloud(warpedU, warpedV, .38, .08, .22, .23) * .24 +
        cloud(warpedU, warpedV, .03, .89, .16, .20) * .16
      );
      color = blend(color, paper, lightInfluence);

      const grain = (
        Math.sin(x * 1.81 + y * 2.37) *
        Math.cos(x * 2.09 - y * 1.67)
      ) * 2.5;
      const i = (y * small.width + x) * 4;
      data[i] = Math.round(clamp(color[0] + grain, 0, 255));
      data[i + 1] = Math.round(clamp(color[1] + grain, 0, 255));
      data[i + 2] = Math.round(clamp(color[2] + grain, 0, 255));
      data[i + 3] = 255;
    }
  }

  g.putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, width, height);
}

/* =========================================
   ECHOES / KOMPASS / SOCIAL LINKS
========================================= */

const SOCIAL = [
  {
    name: "SPOTIFY",
    angle: -Math.PI / 2,
    url: "https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"
  },
  {
    name: "APPLE",
    angle: 0,
    url: "https://music.apple.com/ch/artist/b3nn3t/1786857463"
  },
  {
    name: "YOUTUBE",
    angle: Math.PI / 2,
    url: "https://www.youtube.com/@b333nn3t"
  },
  {
    name: "INSTAGRAM",
    angle: Math.PI,
    url: "https://www.instagram.com/b333nn3t"
  }
];

const compassRadius = 132;

let needleAngle = 0;
let targetNeedleAngle = 0;
let fallbackAngle = 0;


let lastGlobeX = rotationX;
let lastGlobeY = rotationY;
let lastCompassDraw = 0;

let motionAngle = 0;
let motionLastAt = 0;

let orientationPrevious = null;
let orientationLastAt = 0;
let motionPreviousTime = 0;

let sensorHeading = null;
let headingLastAt = 0;

let sensorOptIn = false;
let sensorRequestPending = false;
let sensorStatusText = "KUGELSTEUERUNG";

const fresh = (timestamp, ms = 2200) =>
  timestamp > 0 &&
  performance.now() - timestamp < ms;

function registerMotion(delta) {
  if (!Number.isFinite(delta)) return;

  motionAngle = wrapAngle(
    motionAngle + clamp(delta, -0.18, 0.18)
  );

  motionLastAt = performance.now();
}

function onOrientation(event) {
  const now = performance.now();

  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;

  if (
    ![alpha, beta, gamma].some(Number.isFinite)
  ) return;

  if (Number.isFinite(event.webkitCompassHeading)) {
    sensorHeading = event.webkitCompassHeading;
    headingLastAt = now;
  } else if (
    event.absolute === true &&
    Number.isFinite(alpha)
  ) {
    const screenAngle =
      Number.isFinite(screen.orientation?.angle)
        ? screen.orientation.angle
        : 0;

    sensorHeading =
      ((360 - alpha + screenAngle) % 360 + 360) % 360;

    headingLastAt = now;
  }

  const current = { alpha, beta, gamma };

  if (orientationPrevious) {
    const difference = (a, b) =>
      Number.isFinite(a) && Number.isFinite(b)
        ? wrapAngle((a - b) * Math.PI / 180)
        : 0;

    const da = difference(
      alpha, orientationPrevious.alpha
    );

    const db = difference(
      beta, orientationPrevious.beta
    );

    const dg = difference(
      gamma, orientationPrevious.gamma
    );

    registerMotion(
      -da * 0.85 +
      db * 0.35 +
      dg * 0.55
    );
  } else {
    motionLastAt = now;
  }

  orientationPrevious = current;
  orientationLastAt = now;
}

window.addEventListener(
  "deviceorientation",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "deviceorientationabsolute",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "devicemotion",
  event => {
    const now = performance.now();

    if (now - orientationLastAt < 450) return;

    const rate = event.rotationRate;
    const acceleration =
      event.accelerationIncludingGravity;

    const dt = motionPreviousTime
      ? Math.min(
          0.1,
          (now - motionPreviousTime) / 1000
        )
      : 0.016;

    motionPreviousTime = now;

    if (
      rate &&
      [rate.alpha, rate.beta, rate.gamma]
        .some(Number.isFinite)
    ) {
      registerMotion(
        (
          (Number(rate.alpha) || 0) * -0.85 +
          (Number(rate.beta) || 0) * 0.35 +
          (Number(rate.gamma) || 0) * 0.55
        ) * Math.PI / 180 * dt
      );
    } else if (
      acceleration &&
      Number.isFinite(acceleration.x) &&
      Number.isFinite(acceleration.y)
    ) {
      registerMotion(
        clamp(
          (acceleration.x - acceleration.y) * 0.0005,
          -0.012,
          0.012
        )
      );
    }
  },
  { passive: true }
);

function sensorMode() {
  if (!sensorOptIn) return "KUGELSTEUERUNG";

  if (fresh(headingLastAt)) {
    return "KOMPASS AKTIV";
  }

  if (fresh(motionLastAt)) {
    return "BEWEGUNG AKTIV";
  }

  return "KUGELSTEUERUNG";
}

const SENSOR_CONTROL = {
  y: COMPASS_Y + 207,
  checkboxX: -109,
  labelX: -85,
  hitLeft: -130,
  hitRight: 130,
  hitTop: -21,
  hitBottom: 30
};

function drawSensorControl(ctx, cx) {
  const cy = SENSOR_CONTROL.y;

  ctx.save();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(252,252,252,.85)";

  ctx.strokeRect(
    cx + SENSOR_CONTROL.checkboxX,
    cy - 7,
    14,
    14
  );

  if (sensorOptIn) {
    ctx.strokeStyle = "#C0C47A";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    ctx.moveTo(
      cx + SENSOR_CONTROL.checkboxX + 2,
      cy
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 6,
      cy + 4
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 13,
      cy - 5
    );

    ctx.stroke();
  }

  ctx.font = "500 11px 'DM Mono', monospace";
  ctx.fillStyle = "#FCFCFC";

  ctx.fillText(
    "SENSOR AKTIVIEREN",
    cx + SENSOR_CONTROL.labelX,
    cy
  );

  ctx.font = "9px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(252,252,252,.85)";

  ctx.fillText(
    sensorStatusText,
    cx,
    cy + 23,
    260
  );

  ctx.restore();
}

function requestSensorAccess() {
  if (sensorRequestPending) return;

  sensorOptIn = !sensorOptIn;

  if (!sensorOptIn) {
    fallbackAngle = needleAngle;
    targetNeedleAngle = needleAngle;
    sensorStatusText = "KUGELSTEUERUNG";
    refreshEchoesTexture();
    return;
  }

  if (!window.isSecureContext) {
    sensorOptIn = false;
    sensorStatusText = "HTTPS ERFORDERLICH";
    refreshEchoesTexture();
    return;
  }

  const requests = [];

  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceOrientationEvent.requestPermission()
      );
    }

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceMotionEvent.requestPermission()
      );
    }
  } catch (error) {
    sensorOptIn = false;
    sensorStatusText = "FREIGABE NICHT MÖGLICH";
    refreshEchoesTexture();
    return;
  }

  if (!requests.length) {
    sensorStatusText = "SENSOREN WERDEN GEPRÜFT";
    refreshEchoesTexture();
    return;
  }

  sensorRequestPending = true;
  sensorStatusText = "FREIGABE WIRD GEPRÜFT";
  refreshEchoesTexture();

  Promise.allSettled(requests).then(results => {
    sensorRequestPending = false;

    if (
      results.some(
        result =>
          result.status === "fulfilled" &&
          result.value === "granted"
      )
    ) {
      sensorStatusText = "WARTE AUF SENSORDATEN";
    } else {
      sensorOptIn = false;
      sensorStatusText = "FREIGABE NICHT ERTEILT";
    }

    refreshEchoesTexture();
  });
}

function socialIcon(ctx, name, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#FCFCFC";
  ctx.fillStyle = "#FCFCFC";
  ctx.lineWidth = 2.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (name === "SPOTIFY") {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        0,
        8 + i * 3,
        17 - i * 4,
        Math.PI * 1.18,
        Math.PI * 1.83
      );
      ctx.stroke();
    }
  } else if (name === "APPLE") {


    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♫", 0, 1);
  } else if (name === "YOUTUBE") {
    ctx.beginPath();
    ctx.roundRect(-17, -12, 34, 24, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, -7);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
  } else if (name === "INSTAGRAM") {
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(9, -9, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCompass(ctx, cx, cy) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    cx - 32,
    cy - 44,
    10,
    cx,
    cy,
    185
  );

  // Minecraft-Kompass als leise Referenz: silbriger Aussenring,
  // darunter ein mattes Anthrazit-Zifferblatt, ohne Pixel-Look.
  gradient.addColorStop(0, "#E0E1DF");
  gradient.addColorStop(0.54, "#ABB1B5");
  gradient.addColorStop(1, "#717A80");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.fill();

  const dial = ctx.createRadialGradient(cx - 30, cy - 42, 12, cx, cy, 165);
  dial.addColorStop(0, "#535B60");
  dial.addColorStop(.62, "#41494E");
  dial.addColorStop(1, "#30383D");
  ctx.fillStyle = dial;
  ctx.beginPath();
  ctx.arc(cx, cy, 156, 0, Math.PI * 2);
  ctx.fill();


  // Feiner Metallrand mit leicht wechselnder Helligkeit.
  const rimMetal = ctx.createLinearGradient(
    cx - 174, cy - 174,
    cx + 174, cy + 174
  );

  rimMetal.addColorStop(0, "rgba(250,249,247,.77)");
  rimMetal.addColorStop(.32, "rgba(228,230,230,.92)");
  rimMetal.addColorStop(.68, "rgba(133,140,144,.79)");
  rimMetal.addColorStop(1, "rgba(249,249,247,.73)");

  ctx.strokeStyle = rimMetal;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Schmale dunkle Fuge zwischen Gehaeuse und Glas.
  ctx.strokeStyle = "rgba(52,60,65,.62)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 169, 0, Math.PI * 2);
  ctx.stroke();

  // Zurueckhaltender innerer Rand.
  ctx.strokeStyle = "rgba(230,233,232,.26)";
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.arc(cx, cy, 163, 0, Math.PI * 2);
  ctx.stroke();


  for (let i = 0; i < 120; i++) {
    const angle =
      i * Math.PI / 60 - Math.PI / 2;

    const major = i % 10 === 0;

    const inner = major
      ? 148
      : i % 5 === 0
        ? 154
        : 159;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 163,
      cy + Math.sin(angle) * 163
    );

    ctx.strokeStyle = major
      ? "rgba(240,241,239,.73)"
      : "rgba(232,235,235,.43)";

    ctx.lineWidth = major ? 1.8 : 0.8;
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(226,230,230,.16)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * 58,
      cy + Math.sin(angle) * 58
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 115,
      cy + Math.sin(angle) * 115
    );

    ctx.stroke();
  }


  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(needleAngle);

  // Sehr weicher Schatten unter der Nadel.
  ctx.shadowColor = "rgba(0,0,0,.30)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Sanftes, entsaettigtes Rot statt knalliger Minecraft-Pixelfarbe.
  const redMetal = ctx.createLinearGradient(
    -12, 0, 12, 0
  );

  redMetal.addColorStop(0, "#A75F69");
  redMetal.addColorStop(0.42, "#D89A9F");
  redMetal.addColorStop(1, "#B86D76");

  ctx.fillStyle = redMetal;

  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(-12, 8);
  ctx.lineTo(0, -3);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  // Gegenseite: helles Silber mit weicher Grauschattierung.
  const paleMetal = ctx.createLinearGradient(
    -12, 0, 12, 0
  );

  paleMetal.addColorStop(0, "#818B90");
  paleMetal.addColorStop(0.45, "#C9CED0");
  paleMetal.addColorStop(1, "#F2F1EE");

  ctx.fillStyle = paleMetal;

  ctx.beginPath();
  ctx.moveTo(0, 112);
  ctx.lineTo(-12, -8);
  ctx.lineTo(0, 3);
  ctx.lineTo(12, -8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();



  // =========================================
  // GEWOELBTE GLASABDECKUNG
  // =========================================

  ctx.save();

  // Spiegelungen nur innerhalb des Kompasses
  ctx.beginPath();
  ctx.arc(cx, cy, 169, 0, Math.PI * 2);
  ctx.clip();

  const glass = ctx.createLinearGradient(
    cx - 140,
    cy - 165,
    cx + 135,
    cy + 170
  );

  glass.addColorStop(
    0,
    "rgba(252,252,252,.23)"
  );

  glass.addColorStop(
    0.28,
    "rgba(232,248,250,.11)"
  );

  glass.addColorStop(
    0.55,
    "rgba(255,255,255,0)"
  );

  glass.addColorStop(
    1,
    "rgba(29,36,42,.18)"
  );

  ctx.fillStyle = glass;
  ctx.fillRect(
    cx - 170,
    cy - 170,
    340,
    340
  );

  ctx.restore();

  // =========================================
  // VIER GEWOELBTE SOCIAL-GLASKNOEPFE
  // =========================================

  for (const item of SOCIAL) {
    const x =
      cx + Math.cos(item.angle) * compassRadius;

    const y =
      cy + Math.sin(item.angle) * compassRadius;

    ctx.save();

    // Tiefe unterhalb des Glasknopfes
    ctx.shadowColor = "rgba(0,0,0,.7)";
    ctx.shadowBlur = 13;
    ctx.shadowOffsetY = 4;

    // Gewoelbtes, tuerkisfarbenes Glas
    const buttonGlass = ctx.createRadialGradient(
      x - 10,
      y - 12,
      2,
      x + 3,
      y + 5,
      39
    );

    buttonGlass.addColorStop(
      0,
      "#F3F3F0"
    );

    buttonGlass.addColorStop(
      0.22,
      "#C6CCCE"
    );

    buttonGlass.addColorStop(
      0.58,
      "#9BA6AB"
    );

    buttonGlass.addColorStop(
      1,
      "#737F87"
    );

    ctx.fillStyle = buttonGlass;

    ctx.beginPath();
    ctx.arc(
      x,
      y,
      31,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Praegnanter heller Metall-/Glasring

ctx.strokeStyle =
  "rgba(252,252,252,.82)";

ctx.lineWidth = 1.2;
ctx.stroke();


    // Spiegelung auf der Oberseite
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      24,
      Math.PI * 1.12,
      Math.PI * 1.76
    );

ctx.strokeStyle =
  "rgba(252,252,252,.43)";

ctx.lineWidth = 1.1;
ctx.stroke();

    // Bestehendes Spotify-/Apple-/
    // YouTube-/Instagram-Symbol
    socialIcon(
      ctx,
      item.name,
      x,
      y
    );

    ctx.restore();
  }

  ctx.fillStyle = "#9DA7AA";
  ctx.strokeStyle = "#FCFCFC";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#F1F2F0";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   ANALOGER DIA-BETRACHTER
========================================= */

function drawVisualViewer(ctx, cx, iy, iw, ih) {
  const image = visualImages[visualIndex];

  const bodyW = iw + 112;
  const bodyH = ih + 100;

  const bodyX = cx - bodyW / 2;
  const bodyY = iy - 50;

  const windowX = cx - iw / 2 + 13;
  const windowY = iy + 13;

  const windowW = iw - 26;
  const windowH = ih - 26;

  ctx.save();
  ctx.shadowColor = "rgba(30,36,41,.36)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 13;

  const bodyGradient = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY + bodyH
  );

  // Mattes, leicht gealtertes TV-Silber statt tuerkisem Gehaeuse.
  bodyGradient.addColorStop(0, "#F0F0ED");
  bodyGradient.addColorStop(.18, "#D2D5D5");
  bodyGradient.addColorStop(.55, "#9FA6AA");
  bodyGradient.addColorStop(.82, "#BFC4C6");
  bodyGradient.addColorStop(1, "#7D858C");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();

  ctx.roundRect(
    bodyX, bodyY, bodyW, bodyH, 30
  );

  ctx.fill();
  ctx.restore();

  ctx.save();

  ctx.strokeStyle = "rgba(252,252,250,.80)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(
    bodyX, bodyY, bodyW, bodyH, 30
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(63,69,73,.63)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(
    bodyX + 7,
    bodyY + 7,
    bodyW - 14,
    bodyH - 14,
    24
  );
  ctx.stroke();

  const highlight = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY
  );

  highlight.addColorStop(0, "rgba(255,255,255,0)");
  highlight.addColorStop(0.25, "rgba(255,255,255,.2)");
  highlight.addColorStop(0.75, "rgba(255,255,255,.08)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");

  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bodyX + 32, bodyY + 10);
  ctx.lineTo(bodyX + bodyW - 32, bodyY + 10);
  ctx.stroke();

  const screws = [
    [bodyX + 22, bodyY + 22],
    [bodyX + bodyW - 22, bodyY + 22],
    [bodyX + 22, bodyY + bodyH - 22],
    [bodyX + bodyW - 22, bodyY + bodyH - 22]
  ];

  for (const [sx, sy] of screws) {
    ctx.fillStyle = "#646D74";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(252,252,252,.74)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,.8)";
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + 3);
    ctx.lineTo(sx + 3, sy - 3);
    ctx.stroke();
  }

  const frameGradient = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX,
    windowY + windowH
  );

  frameGradient.addColorStop(0, "#69747B");
  frameGradient.addColorStop(.5, "#E7E9E8");
  frameGradient.addColorStop(1, "#868E94");

  ctx.fillStyle = frameGradient;

  ctx.beginPath();
  ctx.roundRect(
    windowX - 13,
    windowY - 13,
    windowW + 26,
    windowH + 26,
    14
  );

  ctx.fill();

  ctx.strokeStyle = "rgba(252,252,252,.78)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Gedunkelte CRT-Dichtung direkt zwischen Bild und Metall.
  ctx.fillStyle = "rgba(45,50,55,.76)";
  ctx.beginPath();
  ctx.roundRect(windowX - 5, windowY - 5, windowW + 10, windowH + 10, 9);
  ctx.fill();

  // Dezente vertikale Lueftungsschlitze an der rechten TV-Seite.
  ctx.save();
  ctx.lineCap = "round";
  for (let slot = 0; slot < 7; slot++) {
    const x = windowX + windowW + 18;
    const y = windowY + 42 + slot * 14;
    ctx.strokeStyle = "rgba(63,70,77,.36)";
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y);
    ctx.stroke();
  }
  ctx.restore();

  // Kleiner versenkter Einstellknopf (der aktive Dia-Hebel bleibt frei).
  const tuningX = windowX + windowW + 25;
  const tuningY = windowY + windowH - 38;
  ctx.fillStyle = "#788188";
  ctx.beginPath();
  ctx.arc(tuningX, tuningY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(248,248,247,.76)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.strokeStyle = "rgba(54,61,68,.75)";
  ctx.beginPath();
  ctx.moveTo(tuningX, tuningY - 4);
  ctx.lineTo(tuningX, tuningY + 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();

  ctx.roundRect(
    windowX,
    windowY,
    windowW,
    windowH,
    5
  );

  ctx.clip();

  if (image) {
    cover(
      ctx,
      image,
      windowX,
      windowY,
      windowW,
      windowH
    );
  } else {
    ctx.fillStyle = "#43494D";
    ctx.fillRect(
      windowX,
      windowY,
      windowW,
      windowH
    );
  }

  const reflection = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX + windowW * 0.8,
    windowY + windowH
  );

  reflection.addColorStop(
    0, "rgba(255,255,255,.18)"
  );
  reflection.addColorStop(
    0.35, "rgba(255,255,255,.035)"
  );
  reflection.addColorStop(
    1, "rgba(255,255,255,0)"
  );

  ctx.fillStyle = reflection;

  ctx.fillRect(
    windowX,
    windowY,
    windowW,
    windowH
  );

  ctx.restore();

  // Die alte CAMOU / VIEWER-Beschriftung entfaellt.

  const leverX = cx + iw / 2 + 43;
  const leverTop = iy + 15;
  const leverBottom = iy + ih * 0.72;

  const knobY =
    leverTop +
    (leverBottom - leverTop) * 0.30;

  const railGradient = ctx.createLinearGradient(
    leverX - 9,
    0,
    leverX + 9,
    0
  );

  railGradient.addColorStop(0, "#7F898D");
  railGradient.addColorStop(.5, "#E3E7E7");
  railGradient.addColorStop(1, "#828B91");

  ctx.fillStyle = railGradient;
  ctx.beginPath();

  ctx.roundRect(
    leverX - 8,
    leverTop,
    16,
    leverBottom - leverTop,
    8
  );

  ctx.fill();
  ctx.strokeStyle = "rgba(252,252,252,.83)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const rodGradient = ctx.createLinearGradient(
    leverX - 5,
    0,
    leverX + 5,
    0
  );

  rodGradient.addColorStop(0, "#8A9498");
  rodGradient.addColorStop(.45, "#F4F4F1");
  rodGradient.addColorStop(1, "#B7BDC0");

  ctx.strokeStyle = rodGradient;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(leverX, knobY);
  ctx.lineTo(leverX, knobY + 38);
  ctx.stroke();

  const knobGradient = ctx.createRadialGradient(
    leverX - 8,
    knobY - 8,
    2,
    leverX,
    knobY,
    23
  );

  knobGradient.addColorStop(0, "#FAFAF8");
  knobGradient.addColorStop(.35, "#DADEDF");
  knobGradient.addColorStop(.75, "#ADB5BA");
  knobGradient.addColorStop(1, "#747F86");

  ctx.fillStyle = knobGradient;
  ctx.beginPath();
  ctx.arc(leverX, knobY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(252,252,252,.90)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dezente PRESS-Markierung.
  ctx.save();

  ctx.shadowColor = "rgba(226,228,227,.40)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "#E8E9E8";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(leverX, knobY, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  ctx.save();

  ctx.font = "700 15px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#414A50";

  ctx.fillText(
    "PRESS",
    leverX,
    knobY + 1,
    38
  );

  ctx.restore();

  ctx.fillStyle = "rgba(252,252,252,.88)";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "↓",
    leverX,
    leverBottom + 25
  );

  ctx.fillStyle = "#FCFCFC";
  ctx.font = "bold 15px 'DM Mono', monospace";
  ctx.textAlign = "right";

  ctx.fillText(
    `${String(visualIndex + 1).padStart(2, "0")} / ${String(visualImages.length).padStart(2, "0")}`,
    bodyX + bodyW - 25,
    bodyY + bodyH - 15
  );

  ctx.restore();
}


let camouVisualSlideLoading = null;

function camouEnsureVisualSlides() {
  if (camouVisualSlideLoading) {
    return camouVisualSlideLoading;
  }

  camouVisualSlideLoading = Promise.all(
    ASSETS.visualSlides.slice(1).map(loadImage)
  ).then(images => {
    images.forEach((image, i) => {
      visualImages[i + 1] = image;
    });

    refreshVisualsTexture();
  });

  return camouVisualSlideLoading;
}

function advanceVisualSlide() {
  if (!visualImages.length) return;

  if (visualImages.some(image => !image)) {
    camouEnsureVisualSlides().then(() => {
      visualIndex =
        (visualIndex + 1) % visualImages.length;

      refreshVisualsTexture();
    });

    return;
  }

  visualIndex =
    (visualIndex + 1) % visualImages.length;

  refreshVisualsTexture();
}


function refreshVisualsTexture() {
  refreshIsland(2);
}

/* =========================================
   ÖFFNEN-BESCHRIFTUNG
========================================= */

function drawOpenLabel(ctx, cx, ix, iy, iw, ih) {
  ctx.save();

  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  const shade = ctx.createLinearGradient(
    0,
    iy + ih - 100,
    0,
    iy + ih
  );

  shade.addColorStop(
    0, "rgba(38,86,93,0)"
  );

  shade.addColorStop(
    1, "rgba(38,86,93,.88)"
  );

  ctx.fillStyle = shade;

  ctx.fillRect(
    ix,
    iy + ih - 100,
    iw,
    100
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FCFCFC";
  ctx.font = "500 21px 'DM Mono', monospace";

  ctx.fillText(
    "ÖFFNEN  ↗",
    cx,
    iy + ih - 33,
    iw - 24
  );

  ctx.restore();
}

/* =========================================
   FREI PLATZIERTE BEREICHE
========================================= */

function eachIslandInstance(index, callback) {
  const p = PLACES[index];

  for (const shift of [-MAP_W, 0, MAP_W]) {
    if (
      shift !== 0 &&
      p.x + shift < -460
    ) continue;

    if (
      shift !== 0 &&
      p.x + shift > MAP_W + 460
    ) continue;

    callback(p.x + shift, p.y, p);
  }
}

function islandTransform(ctx, x, y, p) {
  ctx.translate(x, y);
  ctx.rotate(p.tiltR);
}

function paintPhoto(
  ctx,
  index,
  image,
  onlyVideo = false
) {
  const p = PLACES[index];

  ctx.save();
  ctx.translate(p.imageX, PHOTO_Y);
  ctx.rotate(p.photoR);

  if (!onlyVideo) {
    ctx.fillStyle = "rgba(38,86,93,.92)";

    ctx.fillRect(
      -PHOTO_W / 2 - 8,
      -PHOTO_H / 2 - 8,
      PHOTO_W + 16,
      PHOTO_H + 16
    );
  }

  ctx.save();

  ctx.beginPath();
  ctx.rect(
    -PHOTO_W / 2,
    -PHOTO_H / 2,
    PHOTO_W,
    PHOTO_H
  );
  ctx.clip();

  if (
    index === 0 &&
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    cover(
      ctx,
      homeVideo,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (homeVideo.paused) {
      playButton(ctx, 0, 0);
    }
  } else if (!onlyVideo) {
    cover(
      ctx,
      image,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (index === 0) {
      playButton(ctx, 0, 0);
    }
  }

  ctx.restore();

  if (!onlyVideo) {
    if (index === 1 || index === 4) {
      drawOpenLabel(
        ctx,
        0,
        -PHOTO_W / 2,
        -PHOTO_H / 2,
        PHOTO_W,
        PHOTO_H
      );
    }

    ctx.strokeStyle = "rgba(252,252,252,.71)";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );
  }

  ctx.restore();
}

function drawPanel(ctx, index, image) {
  const section = sections[index];
  const p = PLACES[index];
  const textX = p.textX;

  ctx.save();
  ctx.textAlign = "center";

  // Die kleinen Bereichstitel (z. B. "02 - RELEASES") und
  // ihre Trennlinien entfallen auf saemtlichen Globus-Flaechen.

  // Titel.
  ctx.fillStyle = "#FCFCFC";
  ctx.font = "300 58px Manrope, Arial";

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -247 + i * 68,
      600
    );
  });

  // Beschreibung.
  ctx.fillStyle = "rgba(252,252,252,.95)";
  ctx.font = "400 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -180 + i * 36,
      650
    );
  });

  if (index === 2) {
    // Visuals – geneigter mechanischer Betrachter.
    ctx.save();

    ctx.translate(p.imageX, PHOTO_Y);
    ctx.rotate(p.photoR);
    ctx.scale(
      CONFIG.visualScale,
      CONFIG.visualScale
    );

    drawVisualViewer(
      ctx,
      0,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    ctx.restore();
  } else if (index === 3) {
    // Echoes – Kompass.
    drawCompass(
      ctx,
      p.imageX,
      COMPASS_Y
    );

    drawSensorControl(
      ctx,
      p.imageX
    );
  } else {
    // Legacy-Pfad: V2 zeichnet die eigentlichen 3D-Inhalte.
    if (index === 0) paintPhoto(ctx, index, image);
  }

  // Kleine Sektionsnummer.
  ctx.fillStyle = "rgba(252,252,252,.82)";
  ctx.font = "500 17px 'DM Mono', monospace";

  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / 05`,
    p.imageX + 142,
    376
  );

  ctx.restore();
}

function drawWrappedPanel(ctx, index, image) {
  eachIslandInstance(
    index,
    (x, y, p) => {
      ctx.save();
      islandTransform(ctx, x, y, p);
      drawPanel(ctx, index, image);
      ctx.restore();
    }
  );
}

function refreshIsland(index) {
  if (
    !globeTexture ||
    !globeContext ||
    !baseTextureCanvas
  ) return;

  eachIslandInstance(
    index,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      globeContext.beginPath();
      globeContext.rect(
        -445, -405, 890, 810
      );
      globeContext.clip();

      globeContext.setTransform(
        1, 0, 0, 1, 0, 0
      );

      globeContext.drawImage(
        baseTextureCanvas,
        0,
        0
      );

      globeContext.restore();
    }
  );

  const image = index === 2
    ? visualImages[visualIndex]
    : null;

  drawWrappedPanel(
    globeContext,
    index,
    image
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

function refreshEchoesTexture() {
  refreshIsland(3);
}

/* =========================================
   KUGELTEXTUR ERSTELLEN
========================================= */


async function createGlobeTexture() {
  // Die vier VISUALS-Slides behalten feste Positionen.
  // Der erste Slide wird erst nach HOME geladen.
  visualImages = new Array(ASSETS.visualSlides.length).fill(null);
  visualIndex = 0;

  const canvasFontsReady = document.fonts?.load
    ? Promise.allSettled([
        document.fonts.load("300 58px Manrope"),
        document.fonts.load("400 22px Manrope"),
        document.fonts.load('500 19px "DM Mono"'),
        document.fonts.load('400 19px "DM Mono"')
      ])
    : Promise.resolve();

  // Beim Start wird nur das HOME-Bild angefordert.
  const homeImage = await loadImage(ASSETS.home);
  await canvasFontsReady;

  globeCanvas = document.createElement("canvas");
  globeCanvas.width = MAP_W;
  globeCanvas.height = MAP_H;
  globeContext = globeCanvas.getContext("2d");

  drawBackground(globeContext, MAP_W, MAP_H);

  // Als erstes nur HOME auf der V2-Kugel bereitstellen.
  drawWrappedPanel(globeContext, 0, homeImage);

  globeTexture = new THREE.CanvasTexture(globeCanvas);
  globeTexture.colorSpace = THREE.SRGBColorSpace;
  globeTexture.wrapS = THREE.RepeatWrapping;
  globeTexture.wrapT = THREE.ClampToEdgeWrapping;
  globeTexture.needsUpdate = true;
  globeTexture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  return globeTexture;
}

/* =========================================
   CAMOU: GESTAFFELTES NACHLADEN
========================================= */

// Zustand pro Bereich. HOME wird getrennt davor aufgebaut.
const camouSectionLoadState = sections.map((_, index) => ({
  ready: index === 0,
  urgent: false,
  promise: null,
  wake: null
}));

let camouHomeReady = false;
let camouBackgroundStarted = false;
let camouLastViewedSection = 0;

// Nur fuer eine sehr fruehe Navigation.
// Die echte Grafik ersetzt diesen Platzhalter.
const camouPendingPhoto = document.createElement("canvas");
camouPendingPhoto.width = 1;
camouPendingPhoto.height = 1;

function camouWaitForIdle() {
  return new Promise(resolve => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(resolve, { timeout: 1800 });
    } else {
      setTimeout(resolve, 120);
    }
  });
}

// Hintergrundarbeit bevorzugt in ruhigen Browserphasen.
// Bei einer Navigation darf die Wartezeit enden.
async function camouWaitForPaintSlot(state) {
  const busy = () =>
    isDragging || menuAnimating ||
    !!camouWorldFlight || camouWorldMode === "planet";

  while (!state.urgent && busy()) {
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  if (state.urgent) return;

  await new Promise(resolve => {
    let completed = false;
    let idleId = null;
    let timerId = null;

    const finish = () => {
      if (completed) return;

      completed = true;
      state.wake = null;

      if (
        idleId !== null &&
        typeof cancelIdleCallback === "function"
      ) {
        cancelIdleCallback(idleId);
      }

      if (timerId !== null) clearTimeout(timerId);

      resolve();
    };

    state.wake = finish;

    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(
        finish,
        { timeout: 1800 }
      );
    } else {
      timerId = setTimeout(finish, 120);
    }
  });

  // Hat waehrend der Wartezeit eine Geste begonnen?
  if (!state.urgent && busy()) {
    await camouWaitForPaintSlot(state);
  }
}

// Jeden Bereich nur einmal herunterladen.
function camouPrepareSection(index) {
  const state = camouSectionLoadState[index];

  if (!state || state.ready) {
    return Promise.resolve();
  }

  if (state.promise) {
    return state.promise;
  }

  state.promise = (async () => {

    if (index === 1 || index === 3 || index === 4) {
      // MUSIC ist jetzt nur noch ein Textlink; ECHOES nutzt den Kompass,
      // CONTACT ebenfalls ausschliesslich Text.
      await camouWaitForPaintSlot(state);

      if (!CAMOU_V2_CANVASES[index]) {
        drawWrappedPanel(globeContext, index, null);
      }

    } else {
      // MUSIC und VISUALS.
      const image = await loadImage(
        sections[index].image
      );

      // Bild nach Moeglichkeit vorher dekodieren.
      if (typeof image.decode === "function") {
        try {
          await image.decode();
        } catch (_) {}
      }

      if (index === 2) {
        visualImages[0] = image;
      }

      await camouWaitForPaintSlot(state);

      drawWrappedPanel(
        globeContext,
        index,
        image
      );
    }

    state.ready = true;

  })().catch(error => {
    state.promise = null;

    console.error(
      "CAMOU: Bereich konnte nicht geladen werden",
      index,
      error
    );
  });

  return state.promise;
}

// Navigation und manuelles Drehen haben Vorrang.
function camouPrioritizeSection(index) {
  if (index < 1 || index >= sections.length) {
    return;
  }

  const state = camouSectionLoadState[index];

  if (state.ready) return;

  state.urgent = true;

  // Eine wartende Hintergrundaufgabe aufwecken.
  state.wake?.();

  // HOME muss zuerst initialisiert sein.
  if (!camouHomeReady) return;

  // Interaktive Flaeche sofort erstellen.
  // Das echte Bild wird anschliessend eingesetzt.
  if (!CAMOU_V2_CANVASES[index]) {
    drawWrappedPanel(
      globeContext,
      index,
      index === 1 || index === 2 || index === 3 || index === 4
        ? null
        : camouPendingPhoto
    );
  }

  void camouPrepareSection(index);
}

// Normales Nachladen strikt nacheinander.
async function camouLoadRemainingSections() {
  if (camouBackgroundStarted) return;

  camouBackgroundStarted = true;

  // MUSIC, VISUALS, ECHOES, CONTACT.
  for (const index of [1, 2, 3, 4]) {
    const state = camouSectionLoadState[index];

    // Bereits geladen oder durch Navigation gestartet?
    if (state.ready || state.promise) continue;

    // Vor jedem weiteren Bereich freie Zeit abwarten.
    await camouWaitForIdle();

    if (state.ready || state.promise) continue;

    await camouPrepareSection(index);
  }
}

// Zuerst HOME. Danach die Hintergrundwarteschlange.
createGlobeTexture()
  .then(texture => {
    globe.material.map = texture;
    globe.material.needsUpdate = true;
    sceneNeedsRender = true;

    console.info("CAMOU: HOME-Kugel geladen.");

    camouHomeReady = true;

    // Sehr fruehe Navigationswünsche berücksichtigen.
    for (let index = 1; index < sections.length; index++) {
      if (camouSectionLoadState[index].urgent) {
        camouPrioritizeSection(index);
      }
    }

    // HOME zunaechst rendern lassen.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void camouLoadRemainingSections();
      });
    });
  })
  .catch(error => {
    console.error(
      "CAMOU: Fehler beim Laden der Kugeltextur",
      error
    );
  });

/* =========================================
   VIDEO AUF GENEIGTEM BILDRAHMEN
========================================= */

function updateHomeVideoFrame() {

  if (
    !homeVideoStarted ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  eachIslandInstance(
    0,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      paintPhoto(
        globeContext,
        0,
        null,
        true
      );

      globeContext.restore();
    }
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

/* =========================================
   NAVIGATION / POSITIONEN
========================================= */

function currentIndex() {
  const x =
    -Math.sin(rotationY) * Math.cos(rotationX);

  const y = Math.sin(rotationX);

  const z =
    Math.cos(rotationY) * Math.cos(rotationX);

  let best = 0;
  let bestDot = -Infinity;

  PLACES.forEach((p, i) => {
    const dot =
      x * p.nx +
      y * p.ny +
      z * p.nz;

    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  });

  return best;
}

let lastIndicatorIndex = -1;

function updateIndicator() {
  const index = currentIndex();

  if (index === lastIndicatorIndex) return;
  lastIndicatorIndex = index;

  $("current-section").textContent =
    sections[index].name;

  $("section-number").textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle(
      "active",
      i === index
    );
  });
}

function goToSection(index) {
  const i = ((index % 5) + 5) % 5;
  const p = PLACES[i];

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  pointers.clear();
  pointerStart = null;

  stage.classList.remove("dragging");

  // Zielposition berechnen
  targetRotationX = p.lat * RAD;

  let yaw = -p.lon * RAD;

  while (yaw - rotationY > Math.PI) {
    yaw -= Math.PI * 2;
  }

  while (yaw - rotationY < -Math.PI) {
    yaw += Math.PI * 2;
  }

  targetRotationY = yaw;

  // Die neue Ausrichtung des Zielbereichs beim Zoomen ausgleichen.
  // Roll um die Welt-Z-Achse: Der anvisierte Bereich bleibt frontal
  // und in der Standardansicht so lesbar wie bisher.
  let roll = CAMOU_PANEL_ROLL_DEG[i] * RAD;
  while (roll - camera.rotation.z > Math.PI) roll -= 2 * Math.PI;
  while (roll - camera.rotation.z < -Math.PI) roll += 2 * Math.PI;
  camouNavTargetRoll = roll;

  // Navigationsflug starten
  camouNavPhase = "out";
  camouNavStartedAt = performance.now();
  camouNavZoomFrom = currentZoom;

  menuAnimating = true;
  sceneNeedsRender = true;
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    goToSection(
      Number(button.dataset.section)
    );
  });
});

$("logo")?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    goToSection(0);
  }
);

/* =========================================
   SPOTIFY POPUP
========================================= */

const spotifyModal = $("spotify-modal");
const spotifyPlayer = $("spotify-modal-player");
const spotifyClose = $("spotify-modal-close");

let spotifyOpen = false;

if (spotifyModal) {
  document.body.appendChild(spotifyModal);
}

function openSpotifyModal() {
  if (!spotifyModal || spotifyOpen) return;

  spotifyOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  spotifyModal.hidden = false;
  spotifyModal.style.display = "flex";

  document.body.classList.add(
    "spotify-dialog-open"
  );

  if (spotifyPlayer) {
    spotifyPlayer.src =
      spotifyPlayer.dataset.src ||
      "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";
  }

  spotifyClose?.focus({
    preventScroll: true
  });
}

function closeSpotifyModal() {
  if (!spotifyModal) return;

  spotifyOpen = false;

  spotifyModal.hidden = true;
  spotifyModal.style.display = "none";

  document.body.classList.remove(
    "spotify-dialog-open"
  );

  spotifyPlayer?.removeAttribute("src");
}

spotifyClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    event.stopPropagation();
    closeSpotifyModal();
  }
);

spotifyModal?.addEventListener(
  "pointerdown",
  event => {
    if (
      event.target === spotifyModal ||
      event.target.closest?.(
        "[data-close-spotify]"
      )
    ) {
      closeSpotifyModal();
    }
  }
);

/* =========================================
   CONTACT POPUP
========================================= */

const CONTACT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby3SfFxFDJQZNL0PxI75Z0O_HyDZl_MoC2b8jcW5PLy0kwPAuiOnK9macrxFTaUboXftg/exec";

const contactModal = $("contact-modal");
const contactForm = $("contact-form");

const contactClose = $("contact-modal-close");
const contactStatus = $("contact-status");
const contactSubmit = $("contact-submit");

let contactOpen = false;
let contactSending = false;

if (contactModal) {
  document.body.appendChild(contactModal);
}

function openContactModal() {
  if (!contactModal || contactOpen) return;

  contactOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  contactModal.hidden = false;
  contactModal.style.display = "flex";

  document.body.classList.add(
    "contact-dialog-open"
  );

  contactModal
    .querySelector('input[name="name"]')
    ?.focus({ preventScroll: true });
}

function closeContactModal() {
  if (!contactModal) return;

  contactOpen = false;

  contactModal.hidden = true;
  contactModal.style.display = "none";

  document.body.classList.remove(
    "contact-dialog-open"
  );
}

contactClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    closeContactModal();
  }
);

contactModal?.addEventListener(
  "click",
  event => {
    if (
      event.target === contactModal ||
      event.target.closest?.(
        "[data-close-contact]"
      )
    ) {
      closeContactModal();
    }
  }
);

contactForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (
      contactSending ||
      !contactForm.reportValidity()
    ) return;

    contactSending = true;

    if (contactSubmit) {
      contactSubmit.disabled = true;
    }

    if (contactStatus) {
      contactStatus.textContent =
        "Nachricht wird übertragen …";
    }

    const data = new FormData(contactForm);

// Honeypot prüfen
if (data.get("website")) {
  if (contactStatus) {
    contactStatus.textContent =
      "Senden nicht möglich.";
  }

  contactSending = false;

  if (contactSubmit) {
    contactSubmit.disabled = false;
  }

  return;
}

    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        body: data,
        mode: "no-cors"
      });

      if (contactStatus) {
        contactStatus.textContent =
          "Nachricht gesendet. Ich danke dir.";
      }
    } catch (error) {
      console.error(
        "CAMOU Kontaktformular:",
        error
      );

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung fehlgeschlagen.";
      }
    } finally {
      contactSending = false;

      if (contactSubmit) {
        contactSubmit.disabled = false;
      }
    }
  }
);

/* =========================================
   3D KLICKERKENNUNG
========================================= */

function texturePoint(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    (event.clientX - rect.left) /
      rect.width * 2 - 1,

    -(
      (event.clientY - rect.top) /
        rect.height * 2 - 1
    )
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const hit =
    raycaster.intersectObject(globe)[0];

  if (!hit?.uv) return null;

  return {
    x: hit.uv.x * MAP_W,
    y: (1 - hit.uv.y) * MAP_H
  };
}

function islandPoint(point, index) {
  if (!point) return null;

  const p = PLACES[index];

  let dx = point.x - p.x;

  if (dx > MAP_W / 2) {
    dx -= MAP_W;
  }

  if (dx < -MAP_W / 2) {
    dx += MAP_W;
  }

  const dy = point.y - p.y;

  const c = Math.cos(p.tiltR);
  const s = Math.sin(p.tiltR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function photoPoint(point, index) {
  const local = islandPoint(point, index);

  if (!local) return null;

  const p = PLACES[index];

  const dx = local.x - p.imageX;
  const dy = local.y - PHOTO_Y;

  const c = Math.cos(p.photoR);
  const s = Math.sin(p.photoR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function inImage(point, index) {
  const q = photoPoint(point, index);

  return !!q &&
    Math.abs(q.x) <= PHOTO_W / 2 &&
    Math.abs(q.y) <= PHOTO_H / 2;
}

function isOnVisualLever(point) {
  const q = photoPoint(point, 2);

  if (!q) return false;

  const dx =
    q.x / CONFIG.visualScale;

  const y =
    q.y / CONFIG.visualScale;

  const leverX =
    PHOTO_W / 2 + 43;

  const leverTop =
    -PHOTO_H / 2 + 15;

  const leverBottom =
    -PHOTO_H / 2 +
    PHOTO_H * 0.72;

  return (
    Math.abs(dx - leverX) < 38 &&
    y >= leverTop - 28 &&
    y <= leverBottom + 35
  );
}

function handleGlobeClick(event) {
  const point = texturePoint(event);

  if (!point) return;

  // Spotify: ausschliesslich der unterstrichene FRAGMENTE-Titel ist klickbar.
  if (camouMusicTitleHit(point)) {
    openSpotifyModal();
    return;
  }

  // Contact: Link ist ausschliesslich der unterstrichene Titel.
  if (camouContactTitleHit(point)) {
    openContactModal();
    return;
  }

  // Kompass, Checkbox und Social Links.
  const echoPoint = islandPoint(point, 3);

  if (echoPoint) {
    const p = PLACES[3];

    const dx =
      echoPoint.x - p.imageX;

    const dy =
      echoPoint.y - COMPASS_Y;

    const controlY =
      echoPoint.y - SENSOR_CONTROL.y;

    if (
      dx >= SENSOR_CONTROL.hitLeft &&
      dx <= SENSOR_CONTROL.hitRight &&
      controlY >= SENSOR_CONTROL.hitTop &&
      controlY <= SENSOR_CONTROL.hitBottom
    ) {
      requestSensorAccess();
      return;
    }

    const link = SOCIAL.find(item => {
      const x =
        Math.cos(item.angle) * compassRadius;

      const y =
        Math.sin(item.angle) * compassRadius;

      return Math.hypot(
        dx - x,
        dy - y
      ) < 39;
    });

    if (link) {
      window.open(
        link.url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
  }

  // Home Video.
  if (
    inImage(point, 0) &&
    !homeVideoStarting
  ) {
    if (
      homeVideoStarted &&
      !homeVideo.paused
    ) {
      homeVideo.pause();
      homeVideoPlaying = false;

      stopHomeVideoFrameUpdates();
      updateHomeVideoFrame();
      return;
    }

    homeVideoStarting = true;

    homeVideo.play()
      .then(() => {
        homeVideoStarted = true;
        homeVideoPlaying = true;
        homeVideoStarting = false;

        updateHomeVideoFrame();
        startHomeVideoFrameUpdates();
      })
      .catch(error => {
        homeVideoStarting = false;

        console.error(
          "CAMOU Home-Video:",
          error
        );

        alert(
          "Das HOME-Video konnte nicht gestartet werden."
        );
      });
  }
}

/* =========================================
   ZOOM
========================================= */

function setZoom(value) {
  currentZoom = clamp(
    value,
    CONFIG.minZoom,
    CONFIG.maxZoom
  );

  camera.position.z = currentZoom;
  sceneNeedsRender = true;
}

$("zoom-in")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom - 0.7);
  }
);

$("zoom-out")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom + 0.7);
  }
);

$("zoom-reset")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(defaultZoom);
  }
);

const zoomControls =
  document.querySelector(".zoom-controls");

for (const type of [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel"
]) {
  zoomControls?.addEventListener(
    type,
    event => event.stopPropagation()
  );
}

stage.addEventListener(
  "wheel",
  event => {
    if (
      event.target.closest(".zoom-controls")
    ) return;

    if (camouWorldFlight) return;

    // Browser-Zoom durch Zwei-Finger-Geste verhindern
    if (event.ctrlKey) {
      event.preventDefault();

      setZoom(
        currentZoom + event.deltaY * 0.008
      );

      return;
    }

    setZoom(
      currentZoom + event.deltaY * 0.008
    );
  },
  { passive: false }
);

/* =========================================
   DRAG UND TOUCH
========================================= */

stage.addEventListener(
  "pointerdown",
  event => {
        if (
      spotifyOpen ||
      contactOpen ||
      event.target !== renderer.domElement ||
      camouWorldFlight
    ) return;

    const point = texturePoint(event);

    // Visuals Hebel.
    if (
  camouWorldMode !== "planet" &&
  isOnVisualLever(point)
) {
      visualLeverPointer = event.pointerId;
      visualLeverMoved = false;
      visualLeverStartY = event.clientY;

      stage.setPointerCapture(
        event.pointerId
      );
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };

    stage.setPointerCapture(
      event.pointerId
    );

    if (pointers.size === 1) {
      isDragging = true;

      previousX = event.clientX;
      previousY = event.clientY;

      lastTime = performance.now();

      velocityX = 0;
      velocityY = 0;
      menuAnimating = false;

      stage.classList.add("dragging");
      $("hint")?.classList.add("hidden");
} else if (pointers.size === 2) {
  isDragging = false;
  pointerStart = null;

  const points = [...pointers.values()];

  // Abstand für Zoom speichern
  pinchDistance = distance(
    points[0],
    points[1]
  );

  pinchZoom = currentZoom;

  // Ausgangswinkel der beiden Finger
  pinchAngle = Math.atan2(
    points[1].y - points[0].y,
    points[1].x - points[0].x
  );

  // Laufende Menüanimation beenden
  menuAnimating = false;

  // Ungewolltes Weiterdrehen verhindern
  velocityX = 0;
  velocityY = 0;
}
  }
);

stage.addEventListener(
  "pointermove",
  event => {
    // Mechanischer Dia-Hebel.
    if (
      visualLeverPointer === event.pointerId
    ) {
      const pullDistance =
        event.clientY - visualLeverStartY;

      if (
        pullDistance > 35 &&
        !visualLeverMoved
      ) {
        visualLeverMoved = true;
        advanceVisualSlide();
      }

      return;
    }

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    // Zwei-Finger-Geste: Zoom und intuitive Rotation
if (pointers.size >= 2) {
  const points = [...pointers.values()];

  // Abstand zwischen den Fingern
  const currentDistance = distance(
    points[0],
    points[1]
  );

  // Zoom beibehalten
  if (pinchDistance > 0 && currentDistance > 0) {
    setZoom(
      pinchZoom * (
        pinchDistance / currentDistance
      )
    );
  }

  // Winkel zwischen den Fingern
  const currentAngle = Math.atan2(
    points[1].y - points[0].y,
    points[1].x - points[0].x
  );

  // Winkeländerung berechnen
  const delta = wrapAngle(
    currentAngle - pinchAngle
  );

  // Zwei-Finger-Drehung:
  // CAMOU dreht weiterhin die Kamera.
  // Der Projektplanet dreht sich selbst.
  if (
    camouWorldMode === "planet" &&
    !camouWorldFlight
  ) {
    camouExploreRoll = wrapAngle(
      camouExploreRoll - delta
    );
  } else {
    camera.rotation.z += delta;
  }

  // Winkel für nächste Bewegung speichern
  pinchAngle = currentAngle;

  sceneNeedsRender = true;

  return;
}

    if (!isDragging) return;

    const now = performance.now();

    const dt = Math.max(
      1,
      now - lastTime
    );

    const dx =
      event.clientX - previousX;

    const dy =
      event.clientY - previousY;

    const factor = Math.min(
      dt / 16, 2
    );

// Kameraneigung bei manueller Drehung berücksichtigen

const roll =
  camera.rotation.z +
  (
    camouWorldMode === "planet"
      ? camouExploreRoll
      : 0
  );


const cosRoll = Math.cos(roll);
const sinRoll = Math.sin(roll);

// Mausbewegung in die gedrehte Ansicht umrechnen
const horizontal =
  dx * cosRoll + dy * sinRoll;

const vertical =
  dy * cosRoll - dx * sinRoll;

// Etwas feinfühligere Steuerung
const sensitivity = CONFIG.dragSpeed * 0.80;


const mx = horizontal * sensitivity;
const my = vertical * sensitivity;

// Horizontale Drehrichtung an die
// aktuelle Ausrichtung anpassen.
const horizontalDirection =
  camouHorizontalDirection();

if (camouWorldMode === "planet") {
  camouExploreY += mx * horizontalDirection;
  camouExploreX += my;

  sceneNeedsRender = true;
} else {
  rotationY += mx * horizontalDirection;
  rotationX += my;
}

// Geschwindigkeit in Bildschirmrichtung
// speichern. Die Korrektur erfolgt auch
// beim Nachlaufen separat.
velocityY = mx / factor;
velocityX = my / factor;

    previousX = event.clientX;
    previousY = event.clientY;

    lastTime = now;

    updateIndicator();
  }
);

/* =========================================
   POINTER RELEASE
========================================= */

function releasePointer(event) {
  // Visuals Hebel.
  if (
    visualLeverPointer === event.pointerId
  ) {
    if (
      event.type === "pointerup" &&
      !visualLeverMoved
    ) {
      advanceVisualSlide();
    }

    visualLeverPointer = null;
    visualLeverMoved = false;
    return;
  }

  if (!pointers.has(event.pointerId)) {
    return;
  }

  if (
    event.type === "pointerup" &&
    pointerStart &&
    distance(
      {
        x: event.clientX,
        y: event.clientY
      },
      pointerStart
    ) <= 7 &&
    !spotifyOpen &&
    !contactOpen
  ) {
    handleGlobeClick(event);
  }

  pointerStart = null;
  pointers.delete(event.pointerId);

  if (pointers.size === 0) {
    isDragging = false;
    stage.classList.remove("dragging");
  } else if (pointers.size === 1) {
    const point = [
      ...pointers.values()
    ][0];

    previousX = point.x;
    previousY = point.y;

    lastTime = performance.now();

    velocityX = 0;
    velocityY = 0;
    isDragging = true;
  }
}

stage.addEventListener(
  "pointerup",
  releasePointer
);

stage.addEventListener(
  "pointercancel",
  releasePointer
);

stage.addEventListener(
  "lostpointercapture",
  releasePointer
);

/* =========================================
   TASTATUR
========================================= */

window.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      if (contactOpen) {
        closeContactModal();
      } else if (spotifyOpen) {
        closeSpotifyModal();
      }

      return;
    }

    if (spotifyOpen || contactOpen) return;

    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
      )
    ) return;

    
if (camouWorldFlight) return;

if (event.key === "ArrowRight") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreY += 0.25 * camouHorizontalDirection();
    sceneNeedsRender = true;
  } else {
    goToSection(currentIndex() + 1);
  }
}

if (event.key === "ArrowLeft") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreY -= 0.25 * camouHorizontalDirection();
    sceneNeedsRender = true;
  } else {
    goToSection(currentIndex() - 1);
  }
}

if (event.key === "ArrowUp") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreX -= 0.25;
  } else {
    rotationX -= 0.25;
  }

  sceneNeedsRender = true;
}

if (event.key === "ArrowDown") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreX += 0.25;
  } else {
    rotationX += 0.25;
  }

  sceneNeedsRender = true;
}

    if (
      event.key === "+" ||
      event.key === "="
    ) {
      setZoom(currentZoom - 0.7);
    }

    if (event.key === "-") {
      setZoom(currentZoom + 0.7);
    }

    if (event.key === "0") {
      setZoom(defaultZoom);
    }
  }
);

/* =========================================
   ANIMATION
========================================= */

let lastShownSensorMode = "";

const camouProjectYawAxis =
  new THREE.Vector3(0, 1, 0);

const camouProjectYawQuat =
  new THREE.Quaternion();

 
// Freie Erkundung des Projektplaneten.
let camouExploreX = 0;
let camouExploreY = 0;
let camouExploreRoll = 0;

const camouExploreRollAxis =
  new THREE.Vector3(0, 0, 1);

const camouExploreRollQuaternion =
  new THREE.Quaternion();

const camouExploreEuler =
  new THREE.Euler(0, 0, 0, "XYZ");

const camouExploreQuaternion =
  new THREE.Quaternion();

function camouGetExploreQuaternion() {
  camouExploreEuler.set(
    camouExploreX,
    camouExploreY,
    0
  );

  camouExploreQuaternion.setFromEuler(
    camouExploreEuler
  );

  camouExploreRollQuaternion.setFromAxisAngle(
    camouExploreRollAxis,
    camouExploreRoll
  );

  // Die Zwei-Finger-Drehung mit der
  // freien Planetendrehung kombinieren.
  return camouExploreQuaternion.premultiply(
    camouExploreRollQuaternion
  );
}


function camouHorizontalDirection() {
  const tilt = camouWorldMode === "planet"
    ? camouExploreX
    : rotationX;

  // Horizontale Richtung nach
  // einer Ueberkopf-Drehung korrigieren.
  return Math.cos(tilt) < 0 ? -1 : 1;
}

function animate(now = 0) {
  requestAnimationFrame(animate);

  if (camouWorldFlight) camouUpdateWorldFlight(now);

  /* NAVIGATION – DREI PHASEN */

  if (!isDragging && menuAnimating) {

    const elapsed = Math.max(
      0,
      now - camouNavStartedAt
    );

    // Phase 1: Herauszoomen
    if (camouNavPhase === "out") {

      const t = smooth(
        elapsed / CAMOU_ZOOM_OUT_MS
      );

      setZoom(
        lerp(
          camouNavZoomFrom,
          CAMOU_OVERVIEW_ZOOM,
          t
        )
      );

      if (elapsed >= CAMOU_ZOOM_OUT_MS) {
        setZoom(CAMOU_OVERVIEW_ZOOM);

        camouNavRotFromX = rotationX;
        camouNavRotFromY = rotationY;
        camouNavRollFrom = camera.rotation.z;

        camouNavPhase = "turn";
        camouNavStartedAt = now;
      }

    // Phase 2: Kugel drehen
    } else if (camouNavPhase === "turn") {

      const t = smooth(
        elapsed / CAMOU_ROTATE_MS
      );

      rotationX = lerp(
        camouNavRotFromX,
        targetRotationX,
        t
      );

      rotationY = lerp(
        camouNavRotFromY,
        targetRotationY,
        t
      );

      camera.rotation.z = lerp(
        camouNavRollFrom,
        camouNavTargetRoll,
        t
      );

      sceneNeedsRender = true;

      if (elapsed >= CAMOU_ROTATE_MS) {
        rotationX = targetRotationX;
        rotationY = targetRotationY;
        camera.rotation.z = camouNavTargetRoll;

        camouNavPhase = "in";
        camouNavStartedAt = now;
        camouNavZoomFrom = currentZoom;
      }

    // Phase 3: Hineinzoomen
    } else if (camouNavPhase === "in") {

      const t = smooth(
        elapsed / CAMOU_ZOOM_IN_MS
      );

      setZoom(
        lerp(
          camouNavZoomFrom,
          CAMOU_FOCUS_ZOOM,
          t
        )
      );

      if (elapsed >= CAMOU_ZOOM_IN_MS) {
        setZoom(CAMOU_FOCUS_ZOOM);

        menuAnimating = false;
        camouNavPhase = "idle";
      }
    }

     
} else if (!isDragging && !camouWorldFlight) {
  const horizontalDirection =
    camouHorizontalDirection();

  if (camouWorldMode === "planet") {
    camouExploreY +=
      velocityY * horizontalDirection;

    camouExploreX += velocityX;

    if (velocityX !== 0 || velocityY !== 0) {
      sceneNeedsRender = true;
    }
  } else {
    rotationY +=
      velocityY * horizontalDirection;

    rotationX += velocityX;
  }

  velocityY *= CONFIG.friction;
  velocityX *= CONFIG.friction;

  if (Math.abs(velocityY) < 0.00004) {
    velocityY = 0;
  }

  if (Math.abs(velocityX) < 0.00004) {
    velocityX = 0;
  }
}

    globeGroup.rotation.set(
    rotationX,
    rotationY,
    0
  );


if (camouSecondPlanetGroup) {
  const f = camouWorldFlight;

  if (f || camouWorldMode === "planet") {

    if (f?.planetOrientation) {
      // Die beim Rueckflug gespeicherte
      // Erkundungsrichtung verwenden.
      camouProjectYawQuat.copy(
        f.planetOrientation
      );

    } else if (f) {
      // Automatische Drehung beim Hinflug.
      camouProjectYawQuat.setFromAxisAngle(
        camouProjectYawAxis,
        f.planetYaw ?? 0
      );

    } else {
      // Freies Drehen nach dem Hinflug.
      camouProjectYawQuat.copy(
        camouGetExploreQuaternion()
      );
    }

    camouSecondPlanetGroup.quaternion
      .copy(camera.quaternion)
      .multiply(camouProjectYawQuat);

  } else {
    camouSecondPlanetGroup.rotation.set(
      0, 0, 0
    );
  }
}
// Auch bei manueller Bedienung den
// Projektplaneten samt Inhalt skalieren.
camouUpdateExplorePlanetSize();
  // Video nur bei neuen Frames.
  if (
    homeVideoPlaying &&
    typeof homeVideo.requestVideoFrameCallback !== "function" &&
    now - lastVideoFallbackPaint >= 33
  ) {
    lastVideoFallbackPaint = now;
    updateHomeVideoFrame();
  }

  const deltaX =
    rotationX - lastGlobeX;

  const deltaY =
    rotationY - lastGlobeY;

  if (
    Math.abs(deltaX) > 1e-9 ||
    Math.abs(deltaY) > 1e-9
  ) {
    sceneNeedsRender = true;
  }

  lastGlobeX = rotationX;
  lastGlobeY = rotationY;

  fallbackAngle = wrapAngle(
    fallbackAngle +
    deltaY * 0.85 +
    deltaX * 0.35
  );

  const mode = sensorMode();

  if (mode === "KOMPASS AKTIV") {
    targetNeedleAngle =
      -sensorHeading * Math.PI / 180;
  } else if (mode === "BEWEGUNG AKTIV") {
    targetNeedleAngle = motionAngle;
  } else {
    targetNeedleAngle = fallbackAngle;
  }

  if (mode !== lastShownSensorMode) {
    lastShownSensorMode = mode;
    sensorStatusText = mode;
    refreshEchoesTexture();
  }

  const needleDelta = wrapAngle(
    targetNeedleAngle - needleAngle
  );

  if (Math.abs(needleDelta) > 0.0005) {
    needleAngle = wrapAngle(
      needleAngle +
      needleDelta * 0.12
    );

    if (
      currentIndex() === 3 &&
      now - lastCompassDraw > 32
    ) {
      refreshEchoesTexture();
      lastCompassDraw = now;
    }
  }

  // Nur rendern, wenn sich etwas geändert hat.
  if (sceneNeedsRender) {
    sceneNeedsRender = false;

    renderer.render(
      scene,
      camera
    );
  }

  updateIndicator();
}

requestAnimationFrame(animate);

/* =========================================
   RESIZE
========================================= */

function resize() {
  const w = Math.max(
    1, container.clientWidth
  );

  const h = Math.max(
    1, container.clientHeight
  );

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
   updateCosmosPositions();

  renderer.setSize(w, h);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    mobile ? 1.5 : 2
  )
);

  sceneNeedsRender = true;
}

window.addEventListener(
  "resize",
  resize
);
// Cosmos beim ersten Laden positionieren
updateCosmosPositions();
setZoom(defaultZoom);
updateIndicator();

/* ENDE CAMOU – EXPLORE GLOBE */

/* ============================================================
   CAMOU – ENTDECKER-KUGEL V2
   VERZERRUNGSARME INHALTE

   Diesen Block EINMAL am Ende der aktuellen
   script.js einfuegen.
============================================================ */

const CAMOU_V2_W = 960;
const CAMOU_V2_H = 760;
const CAMOU_V2_SCALE = mobile ? 0.00222 : 0.00296;
const CAMOU_MOBILE_SIDE_SCALE = 0.80;
const CAMOU_HOME_VIDEO_SCALE = mobile ? 1.10 : 1.20;

// Der gesamte ??-Inhalt (Titel, Untertitel, TV, Hebel) wandert leicht
// nach rechts oben. Die gebogene Flaeche und die Navigation bleiben gleich.
const CAMOU_VISUALS_OFFSET = Object.freeze({ x: 52, y: -42 });

const CAMOU_V2_CANVASES = [];
const CAMOU_V2_TEXTURES = [];
const CAMOU_V2_MESHES = [];
const CAMOU_V2_IMAGES = [];

let CAMOU_V2_SHOW_LABELS = false;

/* =========================================
   NEUE VERTEILUNG DER BEREICHE
========================================= */

const CAMOU_V2_PLACES = [
  {
    lon: -155,
    lat: 32,
    tilt: -4,
    photoTilt: 4,
    imageX: 15,
    textX: -20
  },
  {
    lon: -105,
    lat: -33,
    tilt: 3,
    photoTilt: -4,
    imageX: -205,
    textX: 214
  },
  {
    lon: 5,
    lat: 34,
    tilt: -4,
    photoTilt: 4,
    imageX: 10,
    textX: -20
  },
  {
    lon: -3,
    lat: -35,
    tilt: 3,
    photoTilt: 0,
    imageX: 0,
    textX: 12
  },
  {
    lon: 125,
    lat: 1,
    tilt: -4,
    photoTilt: 5,
    imageX: -205,
    textX: 214
  }
];

for (let i = 0; i < PLACES.length; i++) {
  const p = PLACES[i];

  Object.assign(p, CAMOU_V2_PLACES[i]);

  // Bilder auf Smartphones mittiger platzieren
  if (mobile && i === 1) p.imageX = -95;
  if (mobile && i === 4) p.imageX = 50;

  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  p.tiltR = (p.tilt + CAMOU_PANEL_ROLL_DEG[i]) * RAD;
  p.photoR = p.photoTilt * RAD;

  p.nx = Math.cos(lat) * Math.sin(lon);
  p.ny = Math.sin(lat);
  p.nz = Math.cos(lat) * Math.cos(lon);
}

/* =========================================
   GEKRUEMMTE 3D-INHALTSFLAECHEN
========================================= */

function camouV2Geometry(p) {
  const positions = [];
  const uvs = [];
  const indices = [];

  const columns = 26;
  const rows = 22;

  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  const normal = new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon)
  );

  const east = new THREE.Vector3(
    Math.cos(lon),
    0,
    -Math.sin(lon)
  );

  const north = new THREE.Vector3(
    -Math.sin(lat) * Math.sin(lon),
    Math.cos(lat),
    -Math.sin(lat) * Math.cos(lon)
  );

  const c = Math.cos(p.tiltR);
  const s = Math.sin(p.tiltR);

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;

    for (let col = 0; col <= columns; col++) {
      const u = col / columns;

      const lx =
        (u - 0.5) * CAMOU_V2_W * CAMOU_V2_SCALE;

      const ly =
        (v - 0.5) * CAMOU_V2_H * CAMOU_V2_SCALE;

      const x = lx * c - ly * s;
      const y = lx * s + ly * c;

      const z = Math.sqrt(
        Math.max(
          0.01,
          CONFIG.radius ** 2 - x * x - y * y
        )
      );

      const point = normal
        .clone()
        .multiplyScalar(z + 0.018)
        .addScaledVector(east, x)
        .addScaledVector(north, y);

      positions.push(
        point.x,
        point.y,
        point.z
      );

      uvs.push(u, v);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;

      indices.push(
        a, c, b,
        b, c, d
      );
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      uvs,
      2
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/* =========================================
   EIGENE TEXTUREN PRO BEREICH
========================================= */

drawWrappedPanel = function(ctx, index, image) {
  CAMOU_V2_IMAGES[index] = image;

  if (!CAMOU_V2_CANVASES[index]) {
    const canvas = document.createElement("canvas");

    canvas.width = CAMOU_V2_W;
    canvas.height = CAMOU_V2_H;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(
      camouV2Geometry(PLACES[index]),
      material
    );

    mesh.renderOrder = 2;
    mesh.userData.sectionIndex = index;

    globeGroup.add(mesh);

    CAMOU_V2_CANVASES[index] = canvas;
    CAMOU_V2_TEXTURES[index] = texture;
    CAMOU_V2_MESHES[index] = mesh;
  }

  refreshIsland(index);
};

/* =========================================
   BILDER / VIDEOS ZEICHNEN
========================================= */

// Bilder von HOME und MUSIC, ohne Sonderfall fuer CONTACT.
paintPhoto = function(ctx, index, image) {
  const p = PLACES[index];
  const photoY = mobile && index === 1 ? 150 : 112;

  ctx.save();
  ctx.translate(p.imageX, photoY);
  if (index === 0) {
    // Groessere HOME-Videoflaeche; MUSIC und CONTACT bleiben unveraendert.
    ctx.scale(CAMOU_HOME_VIDEO_SCALE, CAMOU_HOME_VIDEO_SCALE);
  } else if (mobile && index === 1) {
    ctx.scale(CAMOU_MOBILE_SIDE_SCALE, CAMOU_MOBILE_SIDE_SCALE);
  }
  ctx.rotate(p.photoR);

  ctx.fillStyle = "rgba(38,86,93,.92)";
  ctx.fillRect(-PHOTO_W / 2 - 7, -PHOTO_H / 2 - 7, PHOTO_W + 14, PHOTO_H + 14);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-PHOTO_W / 2, -PHOTO_H / 2, PHOTO_W, PHOTO_H);
  ctx.clip();

  if (index === 0 && homeVideoStarted && homeVideo.readyState >= 2) {
    cover(ctx, homeVideo, -PHOTO_W / 2, -PHOTO_H / 2, PHOTO_W, PHOTO_H);
    if (homeVideo.paused) playButton(ctx, 0, 0);
  } else {
    cover(ctx, image, -PHOTO_W / 2, -PHOTO_H / 2, PHOTO_W, PHOTO_H);
    if (index === 0) playButton(ctx, 0, 0);
  }
  ctx.restore();

  if (index === 1) {
    drawOpenLabel(ctx, 0, -PHOTO_W / 2, -PHOTO_H / 2, PHOTO_W, PHOTO_H);
  }

  ctx.strokeStyle = "rgba(252,252,252,.78)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-PHOTO_W / 2, -PHOTO_H / 2, PHOTO_W, PHOTO_H);
  ctx.restore();
};

/* =========================================
   CAMOU – ORGANISCHE TARNFARBZONEN
   NUR VISUALS UND ECHOES
========================================= */

const camouOrganicZones = new Map();

function camouDrawOrganicZone(ctx, index) {
  if (index !== 2 && index !== 3) return;

  // Muster einmal erzeugen und zwischenspeichern
  if (!camouOrganicZones.has(index)) {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 256;

    const c = canvas.getContext("2d");
    const image = c.createImageData(
      canvas.width,
      canvas.height
    );

    const data = image.data;
    const seed = index === 2 ? 0.4 : 2.6;

    const fade = value => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    };

    for (let y = 0; y < canvas.height; y++) {
      const v = 2 * y / (canvas.height - 1) - 1;

      for (let x = 0; x < canvas.width; x++) {
        const u = 2 * x / (canvas.width - 1) - 1;

        // Ueberlagerte organische Strukturen
        const wave1 = Math.sin(
          u * 5.7 + v * 3.1 + seed
        );

        const wave2 = Math.cos(
          u * 10.2 - v * 6.3 - seed
        );

        const wave3 = Math.sin(
          u * 15.1 + v * 12.4 + 2 * seed
        );

        const drift =
          0.5 * wave1 +
          0.3 * wave2 +
          0.2 * wave3;

        // Asymmetrische Verformung
        const warpedX =
          u + 0.16 * Math.sin(v * 4.1 + seed);

        const warpedY =
          v + 0.13 * Math.cos(u * 4.5 - seed);

        const distance = Math.hypot(
          warpedX * 0.90,
          warpedY * 0.95
        );

        const angle = Math.atan2(
          warpedY,
          warpedX
        );

        // Unregelmaessige Tarnkonturen
        const perimeter =
          1.05 +
          0.15 * Math.sin(angle * 3 + seed) +
          0.12 * Math.cos(angle * 6 - seed) +
          0.13 * drift;

        const irregular = fade(
          (perimeter - distance + 0.20) / 0.48
        );

        // Weicher Uebergang zur Kugeltextur
        const edge =
          fade((1 - Math.abs(u)) / 0.22) *
          fade((1 - Math.abs(v)) / 0.22);

        const alpha =
          irregular *
          edge *
          (0.80 + 0.12 * drift);

        // Tuerkis-, Gelb- und Rosa-Pigmente
        const moss = fade(
          (drift + 0.50) / 1.1
        );

        const i =
          (y * canvas.width + x) * 4;

        data[i] = Math.round(
          105 + 76 * moss
        );

        data[i + 1] = Math.round(
          169 + 31 * moss
        );

        data[i + 2] = Math.round(
          180 + 20 * moss
        );

        data[i + 3] = Math.round(
          255 * Math.max(0, alpha)
        );
      }
    }

    c.putImageData(image, 0, 0);
    camouOrganicZones.set(index, canvas);
  }

  // Farbzone hinter dem Bereich zeichnen
  ctx.drawImage(
    camouOrganicZones.get(index),
    -CAMOU_V2_W / 2,
    -CAMOU_V2_H / 2,
    CAMOU_V2_W,
    CAMOU_V2_H
  );
}

/* =========================================
   LESBARE, UMBRECHENDE GLOBUS-TEXTE
   Bewahrt Satzzeichen und Absatzreihenfolge.
========================================= */
function camouWrapParagraph(ctx, paragraph, maxWidth) {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function camouDrawParagraphBlock(ctx, paragraphs, {
  x = 0,
  y = 0,
  maxWidth = 390,
  maxHeight = 370,
  fontSize = 21,
  minFontSize = 16,
  leading = 1.30,
  paragraphGap = 7
} = {}) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let rows = [];
  let lineHeight = 0;
  let height = 0;
  let size = fontSize;

  // Die Schrift nur dann reduzieren, wenn der Text andernfalls nicht passt.
  // So bleibt die Schriftgroesse moeglichst nahe am urspruenglichen Design.
  while (size >= minFontSize) {
    ctx.font = `400 ${size}px Manrope, Arial, sans-serif`;
    rows = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      camouWrapParagraph(ctx, paragraph, maxWidth).forEach((line, i) => {
        rows.push({ text: line, gapBefore: paragraphIndex > 0 && i === 0 });
      });
    });
    lineHeight = size * leading;
    height = rows.length * lineHeight +
      Math.max(0, paragraphs.length - 1) * paragraphGap;
    if (height <= maxHeight || size === minFontSize) break;
    size = Math.max(minFontSize, size - 0.5);
  }

  let baseline = y - height / 2 + lineHeight / 2;
  for (const row of rows) {
    if (row.gapBefore) baseline += paragraphGap;
    ctx.fillText(row.text, x, baseline, maxWidth);
    baseline += lineHeight;
  }
  ctx.restore();
}

drawPanel = function(ctx, index, image) {
  const p = PLACES[index];
  const section = sections[index];

  ctx.save();

  if (index === 2) {
    // Titel, Beschreibung, TV und Hebel gemeinsam versetzen.
    ctx.translate(CAMOU_VISUALS_OFFSET.x, CAMOU_VISUALS_OFFSET.y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Keine kleinen Bereichstitel, Nummern oder Trennlinien auf dem Globus.
  // Der Titel ist direkt lesbar, unabhaengig von Drehung oder Zoom.

  /* Haupttitel */

  ctx.font = "300 58px Manrope, Arial";
  ctx.fillStyle = "#FCFCFC";

const titleY = index === 3 ? -262 : -217;
const titleX = -12;
ctx.fillText(section.title[0], titleX, titleY, 820);

if (index === 1 || index === 4) {
  // FRAGMENTE und CONTACT: Der jeweilige Titel ersetzt die Bild-Verlinkung.
  // Breite wie beim durch maxWidth skalierten fillText verwenden.
  const titleWidth = Math.min(ctx.measureText(section.title[0]).width, 820);
  ctx.save();
  ctx.strokeStyle = "#FCFCFC";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(titleX - titleWidth / 2, titleY + 13);
  ctx.lineTo(titleX + titleWidth / 2, titleY + 13);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = "400 34px Manrope, Arial";
  ctx.fillText("↗", titleX + titleWidth / 2 + 15, titleY);
  ctx.restore();
}

  /* Beschreibung */

  ctx.fillStyle = "rgba(252,252,252,.97)";

  if (index === 1) {
    // FRAGMENTE: Das Gedicht beginnt bewusst weit unter dem Linktitel.
    // Der Abstand entspricht ungefaehr 25 kleinen Textzeilen. Die Schrift
    // liegt auf allen Geraeten um 90 Grad nach links gedreht und wird
    // weiterhin sauber umbrochen, ohne die Flaeche zu verlassen.
    ctx.save();
    ctx.translate(mobile ? 72 : 85, mobile ? 270 : 272);
    ctx.rotate(-Math.PI / 2);
    camouDrawParagraphBlock(ctx, section.body, {
      maxWidth: mobile ? 180 : 190,
      maxHeight: mobile ? 415 : 440,
      fontSize: mobile ? 17.5 : 19,
      minFontSize: mobile ? 14.5 : 15.5,
      leading: 1.17,
      paragraphGap: 6
    });
    ctx.restore();

  } else {
    // ZUHAUSE und ??: jeweils genau eine Zeile.
    // ECHO und KONTAKT: zwei bewusst gesetzte Zeilen.
    // Der alte Titel, das Startvideo und alle anderen Elemente bleiben stehen.
    ctx.font = "400 22px Manrope, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    section.body.forEach((line, i) => {
      ctx.fillText(
        line,
        index === 4 ? -12 : p.textX,
        -140 + i * 38 - (index === 3 ? 45 : 0),
        index === 0 ? 750 : index === 4 ? 750 : 730
      );
    });
  }

  /* Visuals */

  if (index === 2) {
    ctx.save();

    ctx.translate(p.imageX, 112);
    ctx.rotate(p.photoR);

    ctx.scale(
      CONFIG.visualScale,
      CONFIG.visualScale
    );

    drawVisualViewer(
      ctx,
      0,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    ctx.restore();

  } else if (index === 3) {
    /* Echoes */

    drawCompass(
      ctx,
      p.imageX,
      112
    );

    ctx.save();

    ctx.translate(0, -3);

    drawSensorControl(
      ctx,
      p.imageX
    );

    ctx.restore();

  } else if (index === 0) {
    /* Nur HOME besitzt hier noch ein Bild / Startvideo.
       FRAGMENTE ist jetzt ausschliesslich als Text-Link dargestellt. */
    paintPhoto(ctx, index, image);
  }

  ctx.restore();
};

/* =========================================
   EINZELNEN BEREICH AKTUALISIEREN
========================================= */

refreshIsland = function(index) {
  const canvas = CAMOU_V2_CANVASES[index];
  const texture = CAMOU_V2_TEXTURES[index];

  if (!canvas || !texture) return;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    CAMOU_V2_W,
    CAMOU_V2_H
  );

  ctx.save();

  ctx.translate(
    CAMOU_V2_W / 2,
    CAMOU_V2_H / 2
  );

  drawPanel(
    ctx,
    index,
    index === 2
      ? visualImages[visualIndex]
      : CAMOU_V2_IMAGES[index]
  );

  ctx.restore();

  texture.needsUpdate = true;
  sceneNeedsRender = true;
};

/* =========================================
   VIDEO-PERFORMANCE
========================================= */

updateHomeVideoFrame = function() {
  if (
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    refreshIsland(0);
  }
};

/* =========================================
   KLICKERKENNUNG AUF NEUEN FLÄCHEN
========================================= */

texturePoint = function(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    (event.clientX - rect.left) /
      rect.width * 2 - 1,

    -(
      (event.clientY - rect.top) /
        rect.height * 2 - 1
    )
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const sphereHit =
    raycaster.intersectObject(globe)[0];

  const hit = raycaster
    .intersectObjects(
      CAMOU_V2_MESHES.filter(Boolean),
      false
    )
    .find(result =>
      !sphereHit ||
      result.distance <= sphereHit.distance + 0.05
    );

  if (!hit?.uv) return null;

  return {
    index: hit.object.userData.sectionIndex,

    x:
      (hit.uv.x - 0.5) * CAMOU_V2_W,

    y:
      (0.5 - hit.uv.y) * CAMOU_V2_H
  };
};

islandPoint = function(point, index) {
  return point && point.index === index
    ? {
        x: point.x,
        y: point.y
      }
    : null;
};

photoPoint = function(point, index) {
  const local = islandPoint(point, index);

  if (!local) return null;

  const p = PLACES[index];

  // Die Klickkoordinaten um denselben ??-Versatz wie beim Zeichnen
  // korrigieren; insbesondere bleibt der TV-Hebel exakt bedienbar.
  const shiftX = index === 2 ? CAMOU_VISUALS_OFFSET.x : 0;
  const shiftY = index === 2 ? CAMOU_VISUALS_OFFSET.y : 0;
  const dx = local.x - p.imageX - shiftX;
  const imageY = mobile && index === 1 ? 150 : 112;
  const dy = local.y - imageY - shiftY;

  const c = Math.cos(p.photoR);
  const s = Math.sin(p.photoR);

  // Skalierung der Bilder auf Smartphones
  const scale = index === 0
    ? CAMOU_HOME_VIDEO_SCALE
    : mobile && (index === 1 || index === 4)
      ? CAMOU_MOBILE_SIDE_SCALE
      : 1;

  // Klickposition auf die Bildgrösse umrechnen
  return {
    x: (c * dx + s * dy) / scale,
    y: (-s * dx + c * dy) / scale
  };
};

/* =========================================
   BEREICHSNUMMERN EIN-/AUSBLENDEN
========================================= */

function camouV2Tags(visible) {
  // Bewusst ausgeblendet: unabhaengig von Navigation oder Gesten.
  CAMOU_V2_SHOW_LABELS = false;
}

/* Navigation: kleine Nummern ausblenden */

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    camouV2Tags(false);
  });
});

$("logo")?.addEventListener(
  "click",
  () => camouV2Tags(false)
);

/* Beim Erkunden wieder einblenden */

stage.addEventListener(
  "pointerdown",
  event => {
    if (event.target === renderer.domElement) {
      camouV2Tags(true);
    }
  }
);

window.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    ) {
      camouV2Tags(true);
    }
  }
);

/* =========================================
   STANDARD-ZOOM LEICHT VERGRÖSSERN
========================================= */
let camouWorldFlight = null;
const camouV2OriginalZoom = setZoom;

setZoom = function(value) {
  const corrected =
    !menuAnimating &&
    Math.abs(value - defaultZoom) < 1e-8
      ? CAMOU_FOCUS_ZOOM
      : value;

  camouV2OriginalZoom(corrected);

if (!isDragging && !camouWorldFlight) {
  camouV2Tags(
    currentZoom > defaultZoom + 0.4
  );
}
};

/* =========================================
   HOME-STARTPOSITION KORRIGIEREN
========================================= */

rotationX = PLACES[0].lat * RAD;
rotationY = -PLACES[0].lon * RAD;

lastGlobeX = rotationX;
lastGlobeY = rotationY;

velocityX = 0;
velocityY = 0;

globeGroup.rotation.set(
  rotationX,
  rotationY,
  0
);

sceneNeedsRender = true;

setZoom(defaultZoom);
updateIndicator();

/* ENDE CAMOU – ENTDECKER-KUGEL V2 */

// Text-Hitbox fuer MUSIC statt des zuvor verlinkten Coverbilds.
// Der Bereich entspricht dem gezeichneten, zentrierten Titel.
function camouMusicTitleHit(point) {
  const local = islandPoint(point, 1);
  if (!local) return false;
  const cx = -12;
  const baselineY = -217;
  const measure = CAMOU_V2_CANVASES[1]?.getContext("2d");
  let width = 640; // Fallback, falls die Schrift noch nicht geladen ist.
  if (measure) {
    measure.save();
    measure.font = "300 58px Manrope, Arial";
    width = Math.min(measure.measureText(sections[1].title[0]).width, 820);
    measure.restore();
  }
  return local.x >= cx - width / 2 - 8 &&
    local.x <= cx + width / 2 + 43 &&
    local.y >= baselineY - 67 && local.y <= baselineY + 24;
}

// Nur der sichtbare, unterstrichene Contact-Titel ist ein Link.
function camouContactTitleHit(point) {
  const local = islandPoint(point, 4);
  return !!local &&
    local.x >= -200 && local.x <= 215 &&
    local.y >= -280 && local.y <= -184;
}

// Auch die Mausform zeigt die Klickbarkeit des Canvas-Titels an.
renderer.domElement.addEventListener("pointermove", event => {
  if (isDragging || camouWorldFlight || camouWorldMode !== "camou") {
    renderer.domElement.style.cursor = "";
    return;
  }
  const point = texturePoint(event);
  renderer.domElement.style.cursor = (
    camouMusicTitleHit(point) || camouContactTitleHit(point)
  ) ? "pointer" : "";
});
renderer.domElement.addEventListener("pointerleave", () => {
  renderer.domElement.style.cursor = "";
});

/* ============================================================
   CAMOU PROJEKTPLANET 02
   ERST BEIM AUFRUF LADEN
============================================================ */

let camouSecondPlanetGroup = null;
let camouSecondPlanetReady = null;
let camouWorldMode = "camou";
let camouSpriteHome = null;
let camouPortalView = null;

const CAMOU_WORLD_OVERVIEW = CAMOU_OVERVIEW_ZOOM;
const CAMOU_WORLD_FOCUS = CAMOU_FOCUS_ZOOM;
const CAMOU_SPRITE_TRAVEL_SCALE = 9.0;

// Freier Bereich auf der CAMOU-Kugel.
const camouPortalPlace = {
  lon: 63,
  lat: -4,
  tiltR: -7 * RAD
};

/* =========================================
   SCHAU REIN AUF DER CAMOU-KUGEL
========================================= */

function camouCreatePortal() {
  if (CAMOU_V2_MESHES[5]) return;

  const canvas = document.createElement("canvas");

  // Halbe Aufloesung spart Speicher beim Start.
  canvas.width = CAMOU_V2_W / 2;
  canvas.height = CAMOU_V2_H / 2;

  const c = canvas.getContext("2d");

  c.scale(0.5, 0.5);
  c.translate(
    CAMOU_V2_W / 2,
    CAMOU_V2_H / 2
  );

  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "500 28px 'DM Mono', monospace";

  c.shadowColor = "rgba(0,0,0,.7)";
  c.shadowBlur = 14;
  c.fillStyle = "#FCFCFC";

  const camouPortalLabel = "dings  ↗";
  c.fillText(camouPortalLabel, 0, 0);

  c.shadowBlur = 0;

  c.strokeStyle = "rgba(192,196,122,.70)";
  c.lineWidth = 1;

  c.beginPath();
  const portalUnderlineHalfWidth = c.measureText(camouPortalLabel).width / 2;
  c.moveTo(-portalUnderlineHalfWidth, 27);
  c.lineTo(portalUnderlineHalfWidth, 27);
  c.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    camouV2Geometry(camouPortalPlace),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  mesh.renderOrder = 2;
  mesh.userData.sectionIndex = 5;

  globeGroup.add(mesh);
  CAMOU_V2_MESHES[5] = mesh;

  sceneNeedsRender = true;
}

/* =========================================
   GESTEINSOBERFLAECHE DER ZWEITEN KUGEL
========================================= */


function camouCreateRockyWorldTexture() {
  const width = mobile ? 512 : 768;
  const height = width / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);

  function hash(x, y, z) {
    let h =
      Math.imul(x, 374761393) ^
      Math.imul(y, 668265263) ^
      Math.imul(z, 1442695041);

    h = Math.imul(
      h ^ (h >>> 13),
      1274126177
    );

    return (
      (h ^ (h >>> 16)) >>> 0
    ) / 4294967295;
  }

  function noise(x, y, z) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    let fx = x - ix;
    let fy = y - iy;
    let fz = z - iz;

    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    fz = fz * fz * (3 - 2 * fz);

    const mix = (a, b, t) =>
      a + (b - a) * t;

    const layer = dz => {
      const a = mix(
        hash(ix, iy, iz + dz),
        hash(ix + 1, iy, iz + dz),
        fx
      );

      const b = mix(
        hash(ix, iy + 1, iz + dz),
        hash(ix + 1, iy + 1, iz + dz),
        fx
      );

      return mix(a, b, fy);
    };

    return mix(layer(0), layer(1), fz);
  }

  // Echte 3D-Koordinaten verhindern
  // sternfoermige Muster an den Polen.
  for (let y = 0; y < height; y++) {
    const lat =
      Math.PI * (
        0.5 - (y + 0.5) / height
      );

    const cy = Math.sin(lat);
    const cr = Math.cos(lat);

    for (let x = 0; x < width; x++) {
      const lon =
        2 * Math.PI * (
          (x + 0.5) / width
        );

      const nx = -Math.cos(lon) * cr;
      const ny = cy;
      const nz = Math.sin(lon) * cr;

      const large = noise(
        nx * 4.5 + 7,
        ny * 4.5 + 11,
        nz * 4.5 + 19
      );

      const medium = noise(
        nx * 11.2 + 3,
        ny * 11.2 + 17,
        nz * 11.2 + 23
      );

      const fine = noise(
        nx * 28 + 5,
        ny * 28 + 13,
        nz * 28 + 31
      );

      const mineral =
        0.57 * large +
        0.30 * medium +
        0.13 * fine;

      const relief =
        (mineral - 0.5) * 75;

      // Dunkles, mineralisches Altrosa mit sanfter Unebenheit.
      const light = Math.max(
        0,
        nx * -0.48 +
        ny * 0.58 +
        nz * 0.66
      );

      const shade = 0.40 + 0.60 * light;
      const i = (y * width + x) * 4;

      image.data[i] = Math.max(
        0,
        Math.min(
          255,
          (158 + relief + (medium - .5) * 13) * shade
        )
      );

      image.data[i + 1] = Math.max(
        0,
        Math.min(
          255,
          (117 + relief * 0.84) * shade
        )
      );

      image.data[i + 2] = Math.max(
        0,
        Math.min(
          255,
          (139 + relief * 0.94 + (large - .5) * 11) * shade
        )
      );

      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  // Die vier Saetze sitzen direkt auf der kugelfoermigen Textur.
  // Man entdeckt sie an unterschiedlichen Stellen beim Drehen des Planeten.
  camouDrawSecondPlanetScatteredText(ctx, width, height);

  const texture = new THREE.CanvasTexture(
    canvas
  );

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  texture.anisotropy = Math.min(
    renderer.capabilities.getMaxAnisotropy(),
    4
  );

  return texture;
}


/* =========================================
   ZWEITER PLANET: TEXTE UEBER DIE GESAMTE KUGEL
========================================= */

function camouDrawSecondPlanetScatteredText(ctx, width, height) {
  // Jede Schrift erscheint genau einmal, aber an einer eigenen Position.
  // Die Ausgangspunkte sind gleichmaessig ueber 360 Grad verteilt; die
  // kleine, reproduzierbare Zufallsabweichung macht die Anordnung organisch.
  const fragments = [
    { text: "mach kein auge", u: .24, v: .33, size: 28, width: 200, tilt: -.11 },
    { text: "detaillreiche qualität braucht seine zeit ja", u: .49, v: .71, size: 22, width: 246, tilt: .10 },
    { text: "der nächste planet wird angesteuert!", u: .73, v: .29, size: 23, width: 247, tilt: -.07 },
    { text: "mal sehen wo der wind mich hinweht >.<", u: .94, v: .70, size: 22, width: 240, tilt: .13 }
  ];

  let randomSeed = 0xC42026;
  const jitter = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296 - .5;
  };

  const scale = width / 768;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.lineJoin = "round";

  for (const fragment of fragments) {
    const x = (fragment.u + jitter() * .025) * width;
    const y = (fragment.v + jitter() * .032) * height;
    const angle = fragment.tilt + jitter() * .04;
    const fontSize = fragment.size * scale;
    const maxWidth = fragment.width * scale;
    ctx.font = `500 ${fontSize}px Manrope, Arial, sans-serif`;
    const lines = camouWrapParagraph(ctx, fragment.text, maxWidth);
    const leading = fontSize * 1.27;

    // An der 0/360-Grad-Naht wird der Schriftblock gespiegelt gezeichnet,
    // damit kein Wort bei der Umdrehung abrupt abbricht.
    for (const wrapX of [-width, 0, width]) {
      ctx.save();
      ctx.translate(x + wrapX, y);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(252,252,252,.96)";
      ctx.strokeStyle = "rgba(65,39,53,.38)";
      ctx.lineWidth = 1.1 * scale;
      ctx.shadowColor = "rgba(53,34,45,.36)";
      ctx.shadowBlur = 5 * scale;

      lines.forEach((line, i) => {
        const baseline = (i - (lines.length - 1) / 2) * leading;
        ctx.strokeText(line, 0, baseline, maxWidth);
        ctx.fillText(line, 0, baseline, maxWidth);
      });
      ctx.restore();
    }
  }
  ctx.restore();
}

/* =========================================
   ZWEITEN PLANETEN BEI BEDARF ERSTELLEN
========================================= */
function camouEnsureSecondPlanet() {
  if (camouSecondPlanetReady) {
    return camouSecondPlanetReady;
  }

  camouSecondPlanetReady =
    Promise.resolve().then(() => {
      const group = new THREE.Group();


const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius,
    mobile ? 64 : 96,
    mobile ? 48 : 64
  ),
  new THREE.MeshBasicMaterial({
    map: camouCreateRockyWorldTexture(),

    // Echte, undurchsichtige 3D-Oberflaeche.
    transparent: false,
    depthTest: true,
    depthWrite: true
  })
);

// Die Tiefenpruefung bestimmt, welche
// Kugeloberflaeche vorne liegt.
sphere.renderOrder = 0;

group.add(sphere);

      group.visible = false;
      scene.add(group);
      camouSecondPlanetGroup = group;

      // Keine Bilddatei noetig: die Texte sind Teil der Planetenoberflaeche.
      sceneNeedsRender = true;
      return group;
    });

  return camouSecondPlanetReady;
}

/* =========================================
   ZURUECK-BUTTON
========================================= */

const camouReturnButton =
  document.createElement("button");

camouReturnButton.type = "button";
camouReturnButton.textContent =
  "← ZURÜCK ZU camOu";

camouReturnButton.setAttribute(
  "aria-label",
  "Zurueck zur CAMOU-Kugel"
);

Object.assign(camouReturnButton.style, {
  position: "absolute",
  bottom: "30px",
  left: "24px",
  zIndex: "12",
  padding: "12px 17px",
  cursor: "pointer",
  border: "1px solid rgba(229,230,235,.5)",
  background: "rgba(7,12,20,.78)",
  color: "#f3f0f3",
  font: "500 12px monospace",
  letterSpacing: "1px",
  display: "none",
  borderRadius: "3px"
});

stage.appendChild(camouReturnButton);

camouReturnButton.addEventListener(
  "pointerdown",
  event => event.stopPropagation()
);

camouReturnButton.addEventListener(
  "click",
  () => camouFlyToWorld("camou", 0)
);

/* =========================================
   NAVIGATIONSFLUG ZWISCHEN DEN PLANETEN
========================================= */


/* =========================================
   PLANETENWECHSEL
   ZUERST BEWEGUNG, DANN ANSICHTSWECHSEL
========================================= */

const CAMOU_WORLD_CROSSFADE_MS = 650;
const CAMOU_WORLD_REVEAL_MS = 460;
const CAMOU_PLANET_SPRITE_RADIUS = 0.89;

function camouSpriteFocusScale() {
  // Sprite-Silhouette an die 3D-Kugel anpassen.
  const r = CONFIG.radius;
  const z = CAMOU_WORLD_FOCUS;

  return (
    25 * 2 * r /
    Math.sqrt(z * z - r * r) /
    CAMOU_PLANET_SPRITE_RADIUS
  );
}

const camouGlobeFlightMaterials = new WeakMap();

function camouSetGlobeFlightOpacity(value) {
  const alpha = clamp(value, 0, 1);

  globeGroup.traverse(object => {
    if (!object.isMesh || !object.material) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (!camouGlobeFlightMaterials.has(material)) {
        camouGlobeFlightMaterials.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite
        });
      }

      const original =
        camouGlobeFlightMaterials.get(material);

      const fading = alpha < 0.999;
      const transparent = fading
        ? true
        : original.transparent;

      const depthWrite = fading
        ? false
        : original.depthWrite;

      if (
        material.transparent !== transparent ||
        material.depthWrite !== depthWrite
      ) {
        material.transparent = transparent;
        material.depthWrite = depthWrite;
        material.needsUpdate = true;
      }

      material.opacity = original.opacity * alpha;
    }
  });

  sceneNeedsRender = true;
}

function camouSetPlanetSpriteForeground(enabled) {
  camouPlanet.material.depthTest = !enabled;
  camouPlanet.material.needsUpdate = true;
  camouPlanet.renderOrder = enabled ? 20 : -9;
}

function camouRestorePlanetSprite() {
  if (!camouSpriteHome) return;

  camouPlanet.position.copy(
    camouSpriteHome.position
  );

  camouPlanet.scale.copy(
    camouSpriteHome.scale
  );

  camouPlanet.material.opacity = 1;
  camouPlanet.visible = true;

  camouSetPlanetSpriteForeground(false);
}


function camouSetSecondProjectInfo() {
  // Alle Markierungen in der Navigation entfernen.
  navButtons.forEach(button => {
    button.classList.remove("active");

    // Auch die Tastatur-Fokusmarkierung entfernen.
    if (document.activeElement === button) {
      button.blur();
    }
  });

  // Beschriftung unten rechts.
  const section = $("current-section");
  const number = $("section-number");

  if (section) {
    section.textContent = "PLANET";
  }

  if (number) {
    number.textContent = "01 / 01";
  }

  // Zurueck-Button anzeigen.
  camouReturnButton.style.display = "block";
}

/* =========================================
   CAMOU: GEMEINSAMER HIN- UND RUECKFLUG
========================================= */

// Kamera-Sprite und echte 3D-Kugel
// auf dieselbe sichtbare Groesse bringen.
function camouSpriteScaleForZoom(zoom) {
  const r = CONFIG.radius;

  return (
    25 * 2 * r /
    Math.sqrt(zoom * zoom - r * r) /
    CAMOU_PLANET_SPRITE_RADIUS
  );
}

const CAMOU_PLANET_TURN_MS = 720;
const CAMOU_PLANET_SWAP_MS = 320;
const CAMOU_PLANET_YAW = -1.85;

const CAMOU_MINI_FRONT_Z =
  CONFIG.radius + 1.4;

const CAMOU_FULL_FRONT_Z = 0.12;

function camouMiniProjectScale() {
  const spriteSlope =
    CAMOU_SPRITE_TRAVEL_SCALE *
    CAMOU_PLANET_SPRITE_RADIUS / 50;

  return (
    (CAMOU_WORLD_OVERVIEW - CAMOU_MINI_FRONT_Z) *
    spriteSlope /
    (
      CONFIG.radius *
      Math.sqrt(1 + spriteSlope ** 2)
    )
  );
}

// Manueller Zoom mit derselben Bewegung
// wie beim animierten Hin- und Rueckflug.
function camouUpdateExplorePlanetSize() {
  if (
    camouWorldMode !== "planet" ||
    camouWorldFlight ||
    !camouSecondPlanetGroup
  ) return;

  const u = clamp(
    (currentZoom - CAMOU_WORLD_FOCUS) /
    (CAMOU_WORLD_OVERVIEW - CAMOU_WORLD_FOCUS),
    0,
    1
  );

  const z = lerp(
    CAMOU_FULL_FRONT_Z,
    CAMOU_MINI_FRONT_Z,
    u
  );

  const scale = lerp(
    1,
    camouMiniProjectScale(),
    u
  );

  if (
    Math.abs(camouSecondPlanetGroup.position.z - z) > 1e-7 ||
    Math.abs(camouSecondPlanetGroup.scale.x - scale) > 1e-7
  ) {
    camouSecondPlanetGroup.position.z = z;
    camouSecondPlanetGroup.scale.setScalar(scale);
    sceneNeedsRender = true;
  }
}

function camouFlyToWorld(world, sectionIndex = 0) {
  if (camouWorldFlight) return;
  if (world === camouWorldMode) return;

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  menuAnimating = false;
  camouNavPhase = "idle";

  pointers.clear();
  pointerStart = null;
  stage.classList.remove("dragging");

  if (world === "planet") {
    // Exakte Ausgangsansicht von SCHAU REIN.
    camouPortalView = {
      x: rotationX,
      y: rotationY,
      roll: camera.rotation.z
    };

    // Urspruengliche Position links unten.
    camouSpriteHome = {
      position: camouPlanet.position.clone(),
      scale: camouPlanet.scale.clone()
    };

    camouWorldFlight = {
      to: "planet",
      index: sectionIndex,
      phase: "prepare",
      start: performance.now(),
      fromZoom: currentZoom,
      ready: false,
      planetYaw: CAMOU_PLANET_YAW
    };

    const flight = camouWorldFlight;

    // Auch der erste Besuch verwendet
    // dieselbe fertige Projektoberflaeche.
    camouEnsureSecondPlanet()
      .then(() => {
        if (camouWorldFlight === flight) {
          flight.ready = true;
        }
      })
      .catch(error => {
        console.error(
          "CAMOU Projektplanet:",
          error
        );

        if (camouWorldFlight === flight) {
          camouWorldFlight = null;
        }
      });

  
} else {
  // Die zuletzt erkundete Ausrichtung sichern.
  const exploredOrientation =
    camouGetExploreQuaternion().clone();

  camouWorldFlight = {
    to: "camou",
    index: sectionIndex,
    phase: "returnZoom",
    start: performance.now(),
    fromZoom: currentZoom,
fromPlanetZ:
  camouSecondPlanetGroup.position.z,

fromPlanetScale:
  camouSecondPlanetGroup.scale.x,
    planetOrientation:
      exploredOrientation.clone(),

    returnFromOrientation:
      exploredOrientation,

    returnToOrientation:
      new THREE.Quaternion().setFromAxisAngle(
        camouProjectYawAxis,
        CAMOU_PLANET_YAW
      )
  };
    
// CAMOU steht bereits beim Beginn des
// Rueckflugs hinter dem Projektplaneten.
rotationX = camouPortalView.x;
rotationY = camouPortalView.y;

camera.rotation.z =
  camouPortalView.roll;

globeGroup.rotation.set(
  rotationX,
  rotationY,
  0
);

globeGroup.visible = true;
camouSetGlobeFlightOpacity(1);

    camouReturnButton.style.display = "none";
  }

  sceneNeedsRender = true;
}

function camouUpdateWorldFlight(now) {
  const f = camouWorldFlight;
  if (!f) return;

  const elapsed = Math.max(0, now - f.start);

  const progress = duration =>
    smooth(elapsed / duration);

  const next = phase => {
    f.phase = phase;
    f.start = now;
  };

  const portal = camouPortalView;
  const home = camouSpriteHome;

  const overview = CAMOU_WORLD_OVERVIEW;
  const focus = CAMOU_WORLD_FOCUS;

const spriteSlope =
  CAMOU_SPRITE_TRAVEL_SCALE *
  CAMOU_PLANET_SPRITE_RADIUS / 50;

const miniScale =
  (overview - CAMOU_MINI_FRONT_Z) *
  spriteSlope /
  (
    CONFIG.radius *
    Math.sqrt(1 + spriteSlope ** 2)
  );

  /* =====================================
     HINFLUG 1: PLANET ZUR MITTE
  ===================================== */

  if (f.phase === "prepare") {
    if (!f.ready) return;

   
camouSecondPlanetGroup.visible = false;

camouSecondPlanetGroup.position.z =
  CAMOU_MINI_FRONT_Z;

camouSecondPlanetGroup.scale.setScalar(
  miniScale
);

globeGroup.visible = true;
camouSetGlobeFlightOpacity(1);

    camouPlanet.visible = true;
    camouPlanet.material.opacity = 1;

    camouSetPlanetSpriteForeground(true);

    next("move");
  }

  else if (f.phase === "move") {
    const u = progress(CAMOU_ROTATE_MS);

    // CAMOU wird kleiner, waehrend
    // der Planet zur Mitte wandert.
    setZoom(
      lerp(f.fromZoom, overview, u)
    );

    camouPlanet.position
      .copy(home.position)
      .lerp(
        new THREE.Vector3(0, 0, -25),
        u
      );

    const scale = lerp(
      home.scale.x,
      CAMOU_SPRITE_TRAVEL_SCALE,
      u
    );

    camouPlanet.scale.set(
      scale,
      scale,
      1
    );

    if (u >= 1) {
  camouSecondPlanetGroup.scale.setScalar(miniScale);
  camouSecondPlanetGroup.visible = true;
  next("swapIn");
}
}
  
  /* =====================================
     HINFLUG 3: ZUR ECHTEN 3D-KUGEL
  ===================================== */

else if (f.phase === "swapIn") {
  const u = progress(CAMOU_PLANET_SWAP_MS);

  // Der kleine 2D-Planet wird zur 3D-Kugel.
  camouPlanet.material.opacity = 1 - u;

  // CAMOU bleibt die ganze Zeit dahinter.
  if (u >= 1) {
    camouPlanet.visible = false;
    next("planetTurn");
  }
}

    /* =====================================
     HINFLUG 4: PROJEKTBEREICH ANDREHEN
  ===================================== */

  else if (f.phase === "planetTurn") {
    const u = progress(CAMOU_PLANET_TURN_MS);

    // Projektinhalt dreht sich frontal,
    // solange die 3D-Kugel noch klein ist.
    f.planetYaw = lerp(
      CAMOU_PLANET_YAW,
      0,
      u
    );

    if (elapsed >= CAMOU_PLANET_TURN_MS) {
      f.planetYaw = 0;
      next("zoomIn");
    }
  }

  /* =====================================
     HINFLUG 5: MIT INHALT HERANZOOMEN
  ===================================== */

else if (f.phase === "zoomIn") {
  const u = progress(CAMOU_ZOOM_IN_MS);

  camouSecondPlanetGroup.position.z =
    lerp(
      CAMOU_MINI_FRONT_Z,
      CAMOU_FULL_FRONT_Z,
      u
    );

  camouSecondPlanetGroup.scale.setScalar(
    lerp(miniScale, 1, u)
  );

  setZoom(lerp(overview, focus, u));

  if (elapsed >= CAMOU_ZOOM_IN_MS) {
    camouSecondPlanetGroup.position.z =
      CAMOU_FULL_FRONT_Z;

    camouSecondPlanetGroup.scale.setScalar(1);
    setZoom(focus);
      
// CAMOU bleibt hinter dem Projektplaneten
// auf der gespeicherten SCHAU-REIN-Ansicht.
rotationX = camouPortalView.x;
rotationY = camouPortalView.y;
camera.rotation.z = camouPortalView.roll;

camouExploreX = 0;
camouExploreY = 0;
camouExploreRoll = 0;
     
camouWorldMode = "planet";
camouSetSecondProjectInfo();
     
      // Material fuer den spaeteren
      // Rueckflug wiederherstellen.
      camouSetGlobeFlightOpacity(1);

      camouWorldFlight = null;
    }
  }

  /* =====================================
     RUECKFLUG 1: MIT INHALT VERKLEINERN
  ===================================== */



else if (f.phase === "returnZoom") {
  const u = progress(CAMOU_ZOOM_IN_MS);

  // Umgekehrter Hinzoom:
  // Planet, Bild und Text werden kleiner.

// Von der aktuellen manuellen Zoomposition
// ohne Groessensprung zurueckfliegen.
camouSecondPlanetGroup.position.z = lerp(
  f.fromPlanetZ,
  CAMOU_MINI_FRONT_Z,
  u
);

camouSecondPlanetGroup.scale.setScalar(
  lerp(f.fromPlanetScale, miniScale, u)
);

setZoom(
  lerp(f.fromZoom, overview, u)
);

  // CAMOU bleibt unveraendert dahinter.

  if (elapsed >= CAMOU_ZOOM_IN_MS) {
    camouSecondPlanetGroup.position.z =
      CAMOU_MINI_FRONT_Z;

    camouSecondPlanetGroup.scale.setScalar(
      miniScale
    );

    setZoom(overview);
    next("returnTurn");
  }
}

  /* =====================================
     RUECKFLUG 2: PROJEKTBEREICH WEGDREHEN
  ===================================== */

  else if (f.phase === "returnTurn") {
    const u = progress(CAMOU_PLANET_TURN_MS);

    // Der Inhaltsbereich verschwindet
    // durch die Rotation der 3D-Kugel.

// Von der zuletzt erkundeten Ausrichtung
// sanft zur Rueckflugposition drehen.
f.planetOrientation
  .copy(f.returnFromOrientation)
  .slerp(f.returnToOrientation, u);

if (elapsed >= CAMOU_PLANET_TURN_MS) {
  f.planetOrientation.copy(
    f.returnToOrientation
  );

      // Kleine Planetenansicht
      // passend zur 3D-Kugel vorbereiten.
      camouPlanet.position.set(
        0, 0, -25
      );

camouPlanet.scale.set(
  CAMOU_SPRITE_TRAVEL_SCALE,
  CAMOU_SPRITE_TRAVEL_SCALE,
  1
);
      camouPlanet.material.opacity = 0;
      camouPlanet.visible = true;

      camouSetPlanetSpriteForeground(true);

      next("swapOut");
    }
  }

  /* =====================================
     RUECKFLUG 3: ZUR KLEINEN PLANETENANSICHT
  ===================================== */


else if (f.phase === "swapOut") {
  const u = progress(CAMOU_PLANET_SWAP_MS);

  // Gleich grosse kleine Planetendarstellung
  // uebernimmt die 3D-Kugel.
  camouPlanet.material.opacity = u;

  // CAMOU steht dahinter bereits auf
  // SCHAU REIN und bleibt unveraendert.

  if (u >= 1) {
    camouSecondPlanetGroup.visible = false;
    next("returnMove");
  }
}

  /* =====================================
     RUECKFLUG 5: NACH LINKS UNTEN
  ===================================== */

  else if (f.phase === "returnMove") {
    const u = progress(CAMOU_ROTATE_MS);

    // CAMOU zeigt waehrend der gesamten
    // Rueckbewegung unveraendert SCHAU REIN.
    camouPlanet.position
      .set(0, 0, -25)
      .lerp(home.position, u);

    const scale = lerp(
      CAMOU_SPRITE_TRAVEL_SCALE,
      home.scale.x,
      u
    );

    camouPlanet.scale.set(
      scale,
      scale,
      1
    );

    if (u >= 1) {
      camouRestorePlanetSprite();

      camouWorldMode = "camou";

      // Erst jetzt CAMOU-Drehung
      // zum gewaehlten Bereich vorbereiten.
      const p = PLACES[f.index];

      f.fromX = rotationX;
      f.fromY = rotationY;
      f.fromRoll = camera.rotation.z;

      f.toX = p.lat * RAD;
      f.toY = -p.lon * RAD;
      f.toRoll =
        CAMOU_PANEL_ROLL_DEG[f.index] * RAD;

      // Kuerzester Drehweg.
      while (f.toY - f.fromY > Math.PI) {
        f.toY -= 2 * Math.PI;
      }

      while (f.toY - f.fromY < -Math.PI) {
        f.toY += 2 * Math.PI;
      }

      while (
        f.toRoll - f.fromRoll > Math.PI
      ) {
        f.toRoll -= 2 * Math.PI;
      }

      while (
        f.toRoll - f.fromRoll < -Math.PI
      ) {
        f.toRoll += 2 * Math.PI;
      }

      next("returnRotate");
    }
  }

  /* =====================================
     RUECKFLUG 6: CAMOU ZUM ZIEL DREHEN
  ===================================== */

  else if (f.phase === "returnRotate") {
    const u = progress(CAMOU_ROTATE_MS);

    rotationX = lerp(
      f.fromX,
      f.toX,
      u
    );

    rotationY = lerp(
      f.fromY,
      f.toY,
      u
    );

    camera.rotation.z = lerp(
      f.fromRoll,
      f.toRoll,
      u
    );

    if (elapsed >= CAMOU_ROTATE_MS) {
      rotationX = f.toX;
      rotationY = f.toY;
      camera.rotation.z = f.toRoll;

      next("returnFocus");
    }
  }

  /* =====================================
     RUECKFLUG 7: CAMOU HERANZOOMEN
  ===================================== */

  else if (f.phase === "returnFocus") {
    const u = progress(CAMOU_ZOOM_IN_MS);

    setZoom(
      lerp(overview, focus, u)
    );

    if (elapsed >= CAMOU_ZOOM_IN_MS) {
      setZoom(focus);

      camouRestorePlanetSprite();

      camouWorldFlight = null;

      lastIndicatorIndex = -1;
      camouOriginalIndicator();
    }
  }

  sceneNeedsRender = true;
}

/* =========================================
   BESTEHENDE NAVIGATION ANBINDEN
========================================= */

const camouOriginalGoToSection = goToSection;

goToSection = function(index) {
  const target = ((index % 5) + 5) % 5;

  // Der gewaehlte Bereich bekommt sofort Vorrang.
  // Weitere VISUALS-Dias erst beim Hebel laden.
  if (camouWorldMode === "planet") {
    camouPrioritizeSection(target);

    camouFlyToWorld("camou", target);
    return;
  }

  if (camouWorldFlight) return;

  camouPrioritizeSection(target);

  camouOriginalGoToSection(target);
};

const camouOriginalIndicator = updateIndicator;

updateIndicator = function() {
  // Auf dem Projektplaneten bleibt PLANET aktiv.
  if (
    camouWorldMode === "planet" &&
    !camouWorldFlight
  ) {
    camouSetSecondProjectInfo();
    return;
  }

  // Waehrend der Planetenfluege keine
  // normale Bereichsanzeige aktualisieren.
  if (camouWorldFlight) return;

  // Manuelles Drehen mit Maus oder Fingern:
  // neu sichtbaren Bereich sofort priorisieren.
  if (
    camouHomeReady &&
    camouWorldMode === "camou"
  ) {
    const visibleIndex = currentIndex();

    if (visibleIndex !== camouLastViewedSection) {
      camouLastViewedSection = visibleIndex;

      camouPrioritizeSection(visibleIndex);
    }
  }

  // Normale CAMOU-Navigation wiederherstellen.
  camouOriginalIndicator();
};

/* =========================================
   KLICK AUF SCHAU REIN
========================================= */

const camouOriginalGlobeClick =
  handleGlobeClick;

handleGlobeClick = function(event) {
  if (camouWorldMode === "planet") return;

  const point = texturePoint(event);

  if (
    point?.index === 5 &&
    Math.abs(point.x) < 210 &&
    Math.abs(point.y) < 90
  ) {
    camouFlyToWorld("planet");
    return;
  }

  camouOriginalGlobeClick(event);
};

// Portal auf der Hauptkugel erzeugen.
camouCreatePortal();

/* ENDE CAMOU PROJEKTPLANET 02 */


/* ============================================================
   CAMOU – TRACKLIST + COUNTDOWN
   Zusaetzliche freie Flaechen auf der oberen/unteren Kugelseite
============================================================ */

const CAMOU_TRACKS_PLACE = {
  lon: 72,
  lat: 48,
  tiltR: -13 * RAD
};

const CAMOU_COUNTDOWN_PLACE = {
  lon: 72,
  lat: -43,
  tiltR: 8 * RAD
};

function camouCreateOverlayCanvas(place) {
  const canvas = document.createElement("canvas");
  canvas.width = CAMOU_V2_W;
  canvas.height = CAMOU_V2_H;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(
    renderer.capabilities.getMaxAnisotropy(),
    4
  );

  const mesh = new THREE.Mesh(
    camouV2Geometry(place),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  mesh.renderOrder = 3;
  globeGroup.add(mesh);

  return { canvas, texture, mesh };
}

const camouTracksOverlay = camouCreateOverlayCanvas(CAMOU_TRACKS_PLACE);
const camouCountdownOverlay = camouCreateOverlayCanvas(CAMOU_COUNTDOWN_PLACE);

function camouDrawTracklist() {
  const { canvas, texture } = camouTracksOverlay;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.textBaseline = "middle";

  // Unruhiger, handgezeichneter Orbit als visuelle Klammer.
  ctx.save();
  ctx.strokeStyle = "rgba(38,86,93,.43)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 10, 18, 6]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 350, 270, -0.24, -0.12, Math.PI * 1.83);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(252,252,252,.42)";
  ctx.beginPath();
  ctx.ellipse(10, -2, 285, 205, 0.34, 0.25, Math.PI * 1.78);
  ctx.stroke();
  ctx.restore();

  // Kleine Stern-/Kreuzmarken, bewusst unregelmaessig verteilt.
  const marks = [
    [-365, -220, 9], [330, -270, 7], [375, 115, 10],
    [-330, 260, 7], [35, -315, 8], [180, 290, 6],
    [-70, 285, 5]
  ];
  for (const [x, y, size] of marks) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.4);
    ctx.strokeStyle = "rgba(192,196,122,.90)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.restore();
  }

  // Die alte Ueberschrift TRACKS / FRAGMENTE wird nicht mehr gezeichnet.

  const tracks = [
    { n: "3", title: "verstand gg. leib", x: -205, y: -175, r: -0.10, size: 29 },
    { n: "2", title: "mfg", x: 70, y: -255, r: 0.13, size: 35 },
    { n: "7", title: "SCHOTTER", x: 250, y: -145, r: -0.16, size: 31 },
    { n: "5", title: "06:00, 06:05, 06:10, 06:15…", x: 245, y: 55, r: 0.08, size: 18 },
    { n: "8", title: "suchtbedingt (outro)", x: 105, y: 235, r: -0.11, size: 24 },
    { n: "4", title: "wie die jungs", x: -145, y: 235, r: 0.12, size: 27 },
    { n: "1", title: "sanktgallen (intro)", x: -280, y: 35, r: -0.17, size: 23 },
    { n: "6", title: "moerder", x: -20, y: 80, r: 0.06, size: 33 }
  ];

  for (const track of tracks) {
    ctx.save();
    ctx.translate(track.x, track.y);
    ctx.rotate(track.r);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(38,86,93,.78)";
    ctx.font = "500 15px 'DM Mono', monospace";
    if (track.n) ctx.fillText(track.n, -8, -21);

    ctx.fillStyle = "#FCFCFC";
    ctx.font = `500 ${track.size}px Manrope, Arial, sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,.48)";
    ctx.shadowBlur = 9;
    ctx.fillText(track.title, 18, 0, 430);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(252,252,252,.69)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, 17);
    ctx.lineTo(Math.min(245, 26 + track.title.length * track.size * 0.34), 17);
    ctx.stroke();
    ctx.restore();
  }

  // Kleine handschriftliche Akzentlinie.
  ctx.save();
  ctx.translate(5, 5);
  ctx.rotate(-0.18);
  ctx.strokeStyle = "rgba(192,196,122,.82)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-70, -5);
  ctx.bezierCurveTo(-15, -24, 28, 20, 88, -8);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  texture.needsUpdate = true;
  sceneNeedsRender = true;
}

const CAMOU_COUNTDOWN_TARGET = new Date(2026, 10, 27, 0, 0, 0, 0);

function camouDrawCountdown() {
  const { canvas, texture } = camouCountdownOverlay;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const remaining = Math.max(0, CAMOU_COUNTDOWN_TARGET.getTime() - Date.now());

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Die alte Countdown-Ueberschrift wurde entfernt.

  ctx.fillStyle = "#FCFCFC";
  ctx.shadowColor = "rgba(0,0,0,.48)";
  ctx.shadowBlur = 12;
  ctx.font = "300 112px Manrope, Arial, sans-serif";
  ctx.fillText(String(days).padStart(2, "0"), 0, 8);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(38,86,93,.80)";
  ctx.font = "500 20px 'DM Mono', monospace";
  ctx.fillText("TAGE", 0, 67);

  ctx.fillStyle = "#FCFCFC";
  ctx.font = "500 30px 'DM Mono', monospace";
  ctx.fillText(
    `${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`,
    0,
    112
  );

  ctx.fillStyle = "rgba(38,86,93,.78)";
  ctx.font = "500 17px 'DM Mono', monospace";
  ctx.fillText("27 . 11 . 2026", 0, 174);

  ctx.restore();
  texture.needsUpdate = true;
  sceneNeedsRender = true;
}

camouDrawTracklist();
camouDrawCountdown();

// Nur die Countdown-Flaeche wird sekundenweise neu gezeichnet.
const camouCountdownTimer = window.setInterval(
  camouDrawCountdown,
  1000
);

/* ENDE CAMOU – TRACKLIST + COUNTDOWN */
