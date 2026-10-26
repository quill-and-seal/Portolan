export const MODULE_ID = "portolan";

export const log = (...args) => console.log("Portolan |", ...args);
export const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));
export const setting = (key) => game.settings.get(MODULE_ID, key);

/** Les trois sortes d'objets du module, rangées dans flags.portolan.kind. */
export const KINDS = Object.freeze({
  CARNET: "carnet",
  FEUILLE: "feuille",
  PAPIER: "papier"
});

/** Styles de carnet : apparence et jeux de tampons disponibles. */
export const STYLES = Object.freeze({
  default: { stamps: ["base"] },
  cartographe: { stamps: ["base", "cartographe"] }
});

/** Taille logique d'une page, en unités de dessin (indépendante de l'écran). */
export const PAGE_SIZE = Object.freeze({ width: 1000, height: 1400 });
