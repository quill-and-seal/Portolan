/**
 * Portolan — lecture et écriture des objets du module (carnets, feuilles, papier).
 *
 * Toute écriture passe par saveCarnet / saveFeuille, qui marquent la mise à jour avec
 * l'option { portolan: true }. Le garde-fou de main.js refuse au MJ toute autre
 * modification de flags.portolan : il ne peut pas annoter les cartes des joueurs.
 */

import { MODULE_ID, KINDS, STYLES, setting, t } from "../constants.js";
import * as model from "../model.js";
import * as dnd5e from "../systems/dnd5e.js";

/** Données Portolan d'un objet, ou null. */
export const dataOf = (item) => item?.flags?.[MODULE_ID] ?? null;

/** L'objet est-il un objet Portolan (d'une sorte donnée, si précisée) ? */
export function isPortolan(item, kind) {
  const data = dataOf(item);
  return !!data?.kind && (!kind || data.kind === kind);
}

const UPDATE_OPTIONS = { [MODULE_ID]: true };

export function saveCarnet(item, carnet) {
  return item.update({ [`flags.${MODULE_ID}`]: carnet }, UPDATE_OPTIONS);
}

export function saveFeuille(item, feuille) {
  return item.update({ [`flags.${MODULE_ID}`]: feuille }, UPDATE_OPTIONS);
}

/* -------------------------------------------- */
/*  Création                                    */
/* -------------------------------------------- */

/**
 * Crée un carnet neuf dans l'inventaire d'un personnage.
 * @param {Actor} actor
 * @param {object} [o]
 * @param {"default"|"cartographe"} [o.style]
 */
export async function createCarnet(actor, { style = "default" } = {}) {
  if (!STYLES[style]) throw new Error(`Portolan | style de carnet inconnu : ${style}`);
  const cartographe = style === "cartographe";
  const capacity = setting(cartographe ? "cartographerCapacity" : "defaultCapacity");
  const defaults = cartographe ? dnd5e.DEFAULTS.carnetCartographe : dnd5e.DEFAULTS.carnet;
  const data = dnd5e.itemData({
    kind: KINDS.CARNET,
    name: t(cartographe ? "PORTOLAN.Items.CarnetCartographe" : "PORTOLAN.Items.Carnet"),
    data: model.createCarnet({ style, capacity }),
    description: `<p>${t("PORTOLAN.Items.CarnetHint", { capacity })}</p>`,
    ...defaults
  });
  const [item] = await actor.createEmbeddedDocuments("Item", [data]);
  return item;
}

/** Crée un lot de pages vierges (papeterie). */
export async function createPapier(actor, { quantity = 5 } = {}) {
  const data = dnd5e.itemData({
    kind: KINDS.PAPIER,
    name: t("PORTOLAN.Items.Papier"),
    data: { kind: KINDS.PAPIER },
    quantity,
    description: `<p>${t("PORTOLAN.Items.PapierHint")}</p>`,
    ...dnd5e.DEFAULTS.papier
  });
  const [item] = await actor.createEmbeddedDocuments("Item", [data]);
  return item;
}

/* -------------------------------------------- */
/*  Actions du propriétaire                     */
/* -------------------------------------------- */

/** Commence une nouvelle carte sur une page vierge du carnet. */
export async function startPage(item, name) {
  const { carnet, page } = model.startPage(dataOf(item), { name, makeId: foundry.utils.randomID });
  await saveCarnet(item, carnet);
  return page;
}

/** Renomme une page. */
export async function renamePage(item, pageId, name) {
  await saveCarnet(item, model.updatePage(dataOf(item), pageId, { name }));
}

/** Utilise un lot de pages vierges sur un carnet. Le reste du lot reste dans l'inventaire. */
export async function usePapier(carnetItem, papierItem) {
  const available = dnd5e.quantity(papierItem);
  const { carnet, used } = model.addBlankPages(dataOf(carnetItem), available);
  if (!used) return 0;
  await saveCarnet(carnetItem, carnet);
  if (used >= available) await papierItem.delete();
  else await papierItem.update({ "system.quantity": available - used });
  return used;
}
