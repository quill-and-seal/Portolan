/**
 * Portolan — des cartes dessinées par les joueurs, pour Foundry VTT.
 * Point d'entrée : réglages, garde-fou du MJ, accès aux carnets, API publique.
 *
 * API (game.modules.get("portolan").api) :
 *   createCarnet(actor, { style })   crée un carnet neuf (style "default" ou "cartographe")
 *   createPapier(actor, { quantity }) crée un lot de pages vierges
 *   usePapier(carnetItem, papierItem) ajoute des pages vierges à un carnet
 *   open(item)                       ouvre l'atelier d'un carnet ou d'une feuille (joueurs)
 *   model                            fonctions pures sur les carnets (voir model.js)
 */

import { MODULE_ID, KINDS, log, t } from "./constants.js";
import * as model from "./model.js";
import * as dnd5e from "./systems/dnd5e.js";
import { isPortolan, createCarnet, createPapier, usePapier } from "./services/items.js";
import { openItem, refreshItem, closeItem } from "./apps/carnet-app.js";

/* -------------------------------------------- */
/*  Réglages                                    */
/* -------------------------------------------- */

function registerSettings() {
  game.settings.register(MODULE_ID, "defaultCapacity", {
    name: "PORTOLAN.Settings.DefaultCapacity.Name",
    hint: "PORTOLAN.Settings.DefaultCapacity.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 200, step: 1 },
    default: 25
  });

  game.settings.register(MODULE_ID, "cartographerCapacity", {
    name: "PORTOLAN.Settings.CartographerCapacity.Name",
    hint: "PORTOLAN.Settings.CartographerCapacity.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 200, step: 1 },
    default: 40
  });
}

/* -------------------------------------------- */
/*  Garde-fou : le MJ n'annote pas les cartes   */
/* -------------------------------------------- */

/**
 * Le MJ ne peut pas modifier le contenu d'un objet Portolan à la main (feuille de l'objet,
 * console…). Seules les écritures du module passent, marquées { portolan: true }.
 */
function guardGMEdits(item, changes, options) {
  if (!game.user.isGM || options?.[MODULE_ID]) return;
  if (!isPortolan(item)) return;
  if (!foundry.utils.hasProperty(changes, `flags.${MODULE_ID}`)) return;
  ui.notifications.warn(t("PORTOLAN.Notifications.GMCannotEdit"));
  return false;
}

/* -------------------------------------------- */
/*  Accès aux carnets                           */
/* -------------------------------------------- */

/** Bouton « Ouvrir » dans l'en-tête de la feuille d'objet. */
function addHeaderControl(app, controls) {
  const item = app.document;
  if (item?.documentName !== "Item" || game.user.isGM) return;
  if (!isPortolan(item, KINDS.CARNET) && !isPortolan(item, KINDS.FEUILLE)) return;
  controls.unshift({
    icon: "fa-solid fa-book-atlas",
    label: "PORTOLAN.Open",
    action: "portolanOpen",
    onClick: () => openItem(item)
  });
}

/** Entrée « Ouvrir » dans le menu contextuel de l'inventaire dnd5e. */
function addContextOption(item, options) {
  if (game.user.isGM) return;
  if (!isPortolan(item, KINDS.CARNET) && !isPortolan(item, KINDS.FEUILLE)) return;
  options.unshift({
    name: "PORTOLAN.Open",
    icon: '<i class="fa-solid fa-book-atlas"></i>',
    callback: () => openItem(item)
  });
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.once("init", () => {
  registerSettings();

  game.modules.get(MODULE_ID).api = {
    createCarnet,
    createPapier,
    usePapier,
    open: openItem,
    model
  };
});

Hooks.once("ready", () => {
  if (!dnd5e.isActive()) {
    if (game.user.isGM) ui.notifications.warn(t("PORTOLAN.Notifications.SystemUnsupported"));
    return;
  }
  log("prêt");
});

Hooks.on("preUpdateItem", guardGMEdits);
Hooks.on("updateItem", (item) => isPortolan(item) && refreshItem(item));
Hooks.on("deleteItem", (item) => isPortolan(item) && closeItem(item));
Hooks.on("getHeaderControlsApplicationV2", addHeaderControl);
Hooks.on("dnd5e.getItemContextOptions", addContextOption);
