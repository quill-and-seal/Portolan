/**
 * Portolan — modèle des carnets, pages et feuilles volantes.
 *
 * Fonctions pures : elles prennent des données et renvoient de nouvelles données, sans toucher
 * à Foundry. Le reste du module lit et écrit ces données dans flags.portolan des objets.
 *
 * Un carnet :
 *   { kind: "carnet", style, capacity, blank, pages: [Page], tucked: [Feuille] }
 *   pages.length + blank ne dépasse jamais capacity.
 * Une page :     { id, name, strokes: [Element], updated }
 * Une feuille :  { kind: "feuille", id, style, name, strokes, author, copiedAt, original }
 * Un élément :   { t: "path", c, w, p: [x0, y0, x1, y1, …] }
 *              | { t: "text", x, y, s, v }
 *              | { t: "stamp", id, x, y, s, r }
 */

const randomId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

/** Erreur métier, avec une clé de traduction pour l'interface. */
export class PortolanError extends Error {
  constructor(key, data) {
    super(key);
    this.key = key;
    this.data = data;
  }
}

const clone = (v) => structuredClone(v);

/* -------------------------------------------- */
/*  Carnet                                      */
/* -------------------------------------------- */

/** Nouveau carnet : toutes ses pages sont vierges. */
export function createCarnet({ style = "default", capacity = 25 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new PortolanError("PORTOLAN.Errors.BadCapacity");
  return { kind: "carnet", style, capacity, blank: capacity, pages: [], tucked: [] };
}

/** Nombre de pages présentes dans le carnet (dessinées et vierges). */
export const pageCount = (carnet) => carnet.pages.length + carnet.blank;

/** Places libres : pages arrachées qui peuvent être remplacées par du papier. */
export const freeSlots = (carnet) => carnet.capacity - pageCount(carnet);

/** Commence une nouvelle carte sur une page vierge. */
export function startPage(carnet, { name = "", makeId = randomId, now = Date.now() } = {}) {
  if (carnet.blank < 1) throw new PortolanError("PORTOLAN.Errors.NoBlankPage");
  const next = clone(carnet);
  const page = { id: makeId(), name, strokes: [], updated: now };
  next.blank -= 1;
  next.pages.push(page);
  return { carnet: next, page };
}

/** Remplace le contenu d'une page (après une session de dessin). */
export function updatePage(carnet, pageId, { name, strokes, now = Date.now() } = {}) {
  const next = clone(carnet);
  const page = next.pages.find((p) => p.id === pageId);
  if (!page) throw new PortolanError("PORTOLAN.Errors.NoPage");
  if (name !== undefined) page.name = name;
  if (strokes !== undefined) page.strokes = clone(strokes);
  page.updated = now;
  return next;
}

/**
 * Ajoute des pages vierges achetées à la papeterie, sans dépasser la capacité.
 * Renvoie le carnet et le nombre de pages réellement utilisées.
 */
export function addBlankPages(carnet, count) {
  const used = Math.max(0, Math.min(count, freeSlots(carnet)));
  const next = clone(carnet);
  next.blank += used;
  return { carnet: next, used };
}

/** Arrache une page vierge (pour faire une copie). La place libérée reste vide. */
export function tearBlankPage(carnet) {
  if (carnet.blank < 1) throw new PortolanError("PORTOLAN.Errors.NoBlankPage");
  const next = clone(carnet);
  next.blank -= 1;
  return next;
}

/** Retire une page dessinée (vente de l'original). Renvoie le carnet et la page retirée. */
export function removePage(carnet, pageId) {
  const index = carnet.pages.findIndex((p) => p.id === pageId);
  if (index < 0) throw new PortolanError("PORTOLAN.Errors.NoPage");
  const next = clone(carnet);
  const [page] = next.pages.splice(index, 1);
  return { carnet: next, page };
}

/* -------------------------------------------- */
/*  Copie et feuilles volantes                  */
/* -------------------------------------------- */

/**
 * Copie une page : une page vierge est arrachée du carnet du copiste et devient
 * une feuille volante qui reprend les traits de la page à cet instant.
 */
export function copyPage(carnet, pageId, { author, makeId = randomId, now = Date.now() } = {}) {
  const page = carnet.pages.find((p) => p.id === pageId);
  if (!page) throw new PortolanError("PORTOLAN.Errors.NoPage");
  const next = tearBlankPage(carnet);
  const feuille = {
    kind: "feuille",
    id: makeId(),
    style: carnet.style,
    name: page.name,
    strokes: clone(page.strokes),
    author: author ?? null,
    copiedAt: now,
    original: false
  };
  return { carnet: next, feuille };
}

/** Transforme une page retirée du carnet en feuille « original » (vente de l'original). */
export function pageToOriginal(carnet, page, { author, now = Date.now() } = {}) {
  return {
    kind: "feuille",
    id: page.id,
    style: carnet.style,
    name: page.name,
    strokes: clone(page.strokes),
    author: author ?? null,
    copiedAt: now,
    original: true
  };
}

/** Glisse une feuille volante dans un carnet : elle n'occupe pas de page. */
export function tuckSheet(carnet, feuille) {
  if (carnet.tucked.some((f) => f.id === feuille.id)) return clone(carnet);
  const next = clone(carnet);
  next.tucked.push(clone(feuille));
  return next;
}

/** Ressort une feuille glissée dans le carnet. */
export function untuckSheet(carnet, feuilleId) {
  const index = carnet.tucked.findIndex((f) => f.id === feuilleId);
  if (index < 0) throw new PortolanError("PORTOLAN.Errors.NoSheet");
  const next = clone(carnet);
  const [feuille] = next.tucked.splice(index, 1);
  return { carnet: next, feuille };
}

/* -------------------------------------------- */
/*  Tracés                                      */
/* -------------------------------------------- */

function perpendicularDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (!len2) return Math.hypot(px - ax, py - ay);
  const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
}

/**
 * Simplifie un tracé (Ramer-Douglas-Peucker) et arrondit les points à l'unité.
 * points : [x0, y0, x1, y1, …] ; tolerance en unités de page.
 */
export function simplifyPath(points, tolerance = 1.5) {
  const n = points.length / 2;
  if (!n) return [];
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = n > 2 ? [[0, n - 1]] : [];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpendicularDistance(points[2 * i], points[2 * i + 1], points[2 * a], points[2 * a + 1], points[2 * b], points[2 * b + 1]);
      if (d > max) {
        max = d;
        index = i;
      }
    }
    if (index >= 0 && max > tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    const x = Math.round(points[2 * i]) + 0; // + 0 : évite -0
    const y = Math.round(points[2 * i + 1]) + 0;
    if (out.length && out[out.length - 2] === x && out[out.length - 1] === y) continue;
    out.push(x, y);
  }
  return out;
}
