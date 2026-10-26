/**
 * Portolan — rendu d'une page en SVG (vignettes de l'atelier, aperçus de vente).
 * La table à dessin (0.2) aura son propre rendu interactif ; celui-ci est en lecture seule.
 */

import { PAGE_SIZE } from "./constants.js";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

function pathElement({ c, w, p }) {
  if (!Array.isArray(p) || p.length < 4) return "";
  let d = `M${num(p[0])} ${num(p[1])}`;
  for (let i = 2; i + 1 < p.length; i += 2) d += ` L${num(p[i])} ${num(p[i + 1])}`;
  return `<path d="${d}" fill="none" stroke="${esc(c ?? "var(--portolan-ink)")}" stroke-width="${num(w, 2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function textElement({ x, y, s, v }) {
  return `<text x="${num(x)}" y="${num(y)}" font-size="${num(s, 24)}" class="portolan-label">${esc(v)}</text>`;
}

/** Tampon provisoire : un losange étiqueté, en attendant la bibliothèque de tampons (0.2). */
function stampElement({ id, x, y, s, r }) {
  const size = num(s, 40) / 2;
  const cx = num(x);
  const cy = num(y);
  return `<g transform="rotate(${num(r)} ${cx} ${cy})" class="portolan-stamp" data-stamp="${esc(id)}">
<path d="M${cx} ${cy - size} L${cx + size} ${cy} L${cx} ${cy + size} L${cx - size} ${cy} Z" fill="none" stroke="var(--portolan-ink)" stroke-width="2"/></g>`;
}

const RENDERERS = { path: pathElement, text: textElement, stamp: stampElement };

/** SVG complet d'une page à partir de ses éléments. */
export function pageToSVG(strokes = [], { title = "" } = {}) {
  const body = strokes.map((el) => RENDERERS[el?.t]?.(el) ?? "").join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_SIZE.width} ${PAGE_SIZE.height}" class="portolan-page-svg" role="img" aria-label="${esc(title)}">${body}</svg>`;
}
