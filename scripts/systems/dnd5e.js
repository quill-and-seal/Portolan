/**
 * Portolan — adaptateur dnd5e.
 *
 * Les carnets, feuilles volantes et pages vierges sont des objets « loot » de dnd5e :
 * ils ont un poids et un prix, se rangent dans l'inventaire et s'échangent comme
 * n'importe quel équipement. Les données de Portolan vivent dans flags.portolan.
 *
 * Poids en livres, prix en pièces d'or. Valeurs par défaut, encore à valider (voir le
 * document de conception, « Questions ouvertes »).
 */

import { MODULE_ID, KINDS } from "../constants.js";

const ICONS = {
  [KINDS.CARNET]: `modules/${MODULE_ID}/assets/icons/carnet.svg`,
  [KINDS.FEUILLE]: `modules/${MODULE_ID}/assets/icons/feuille.svg`,
  [KINDS.PAPIER]: `modules/${MODULE_ID}/assets/icons/papier.svg`
};

/** Poids (lb) et prix (po) par défaut. */
export const DEFAULTS = Object.freeze({
  carnet: { weight: 1, price: 5 },
  carnetCartographe: { weight: 1.5, price: 25 },
  feuille: { weight: 0, price: 0 },
  papier: { weight: 0.1, price: 0.2 }
});

export const id = "dnd5e";

/** Le système actif est-il pris en charge ? */
export const isActive = () => game.system?.id === id;

/**
 * Données de création d'un objet Portolan.
 * @param {object} o
 * @param {string} o.kind       carnet | feuille | papier
 * @param {string} o.name
 * @param {object} o.data       contenu de flags.portolan
 * @param {number} o.weight     en livres
 * @param {number} o.price      en pièces d'or
 * @param {number} [o.quantity]
 * @param {string} [o.description] HTML
 */
export function itemData({ kind, name, data, weight, price, quantity = 1, description = "" }) {
  return {
    name,
    type: "loot",
    img: ICONS[kind],
    system: {
      quantity,
      weight: { value: weight, units: "lb" },
      price: { value: price, denomination: "gp" },
      description: { value: description }
    },
    flags: { [MODULE_ID]: data }
  };
}

/** Quantité d'un objet (lot de pages vierges). */
export const quantity = (item) => Number(item.system?.quantity ?? 1);
