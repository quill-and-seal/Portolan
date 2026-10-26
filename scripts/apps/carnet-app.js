/**
 * Portolan — atelier du carnet.
 *
 * Fenêtre d'un carnet (ou d'une feuille volante) : pages dessinées en vignettes,
 * pages vierges restantes, feuilles glissées dedans. En 0.1 elle permet de commencer
 * et de renommer une carte ; le dessin arrive avec la table à dessin (0.2).
 *
 * Le MJ ne peut pas l'ouvrir : il ne voit les cartes des joueurs que pendant une vente.
 */

import { MODULE_ID, KINDS, t } from "../constants.js";
import { PortolanError, pageCount, freeSlots } from "../model.js";
import { dataOf, isPortolan, startPage, renamePage } from "../services/items.js";
import { pageToSVG } from "../render.js";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/** Fenêtres ouvertes, par uuid d'objet, pour les rafraîchir quand l'objet change. */
const open = new Map();

export class CarnetApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["portolan", "portolan-carnet"],
    window: { icon: "fa-solid fa-book-atlas", resizable: true },
    position: { width: 720, height: 640 },
    actions: {
      newPage: CarnetApp.#onNewPage,
      renamePage: CarnetApp.#onRenamePage
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/carnet.hbs`, scrollable: [".portolan-pages"] }
  };

  /** @param {Item} item */
  constructor(item, options = {}) {
    super({ ...options, id: `portolan-${item.uuid.replaceAll(".", "-")}` });
    this.item = item;
  }

  get title() {
    return this.item.name;
  }

  get canEdit() {
    return this.item.isOwner && !game.user.isGM;
  }

  async _prepareContext() {
    const data = dataOf(this.item);
    const kind = data.kind;
    const sheet = (s) => ({ ...s, svg: pageToSVG(s.strokes, { title: s.name }) });
    if (kind === KINDS.FEUILLE) {
      return { kind, feuille: sheet(data), style: data.style ?? "default", canEdit: false };
    }
    return {
      kind,
      style: data.style,
      canEdit: this.canEdit,
      pages: data.pages.map(sheet),
      tucked: data.tucked.map(sheet),
      blank: data.blank,
      capacity: data.capacity,
      count: pageCount(data),
      free: freeSlots(data),
      canStart: this.canEdit && data.blank > 0
    };
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    open.set(this.item.uuid, this);
  }

  _onClose(options) {
    super._onClose(options);
    open.delete(this.item.uuid);
  }

  static async #onNewPage() {
    const name = await askName(t("PORTOLAN.Carnet.NewPage"), "");
    if (name === null) return;
    await guard(() => startPage(this.item, name));
  }

  static async #onRenamePage(event, target) {
    const pageId = target.closest("[data-page-id]")?.dataset.pageId;
    const page = dataOf(this.item).pages.find((p) => p.id === pageId);
    if (!page) return;
    const name = await askName(t("PORTOLAN.Carnet.Rename"), page.name);
    if (name === null) return;
    await guard(() => renamePage(this.item, pageId, name));
  }
}

/** Demande un nom de carte. Renvoie null si la fenêtre est fermée. */
async function askName(title, value) {
  const input = document.createElement("input");
  input.type = "text";
  input.name = "name";
  input.value = value;
  input.placeholder = t("PORTOLAN.Carnet.NamePlaceholder");
  input.autofocus = true;
  try {
    return await DialogV2.prompt({
      window: { title },
      content: `<div class="form-group">${input.outerHTML}</div>`,
      ok: { label: t("PORTOLAN.Carnet.Confirm"), callback: (event, button) => button.form.elements.name.value.trim() },
      rejectClose: false
    });
  } catch {
    return null;
  }
}

/** Exécute une action et affiche les erreurs métier sous forme de notification. */
async function guard(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PortolanError) ui.notifications.warn(t(err.key, err.data));
    else throw err;
  }
}

/** Ouvre la fenêtre d'un objet Portolan, sauf pour le MJ. */
export function openItem(item) {
  if (!isPortolan(item, KINDS.CARNET) && !isPortolan(item, KINDS.FEUILLE)) return null;
  if (game.user.isGM) {
    ui.notifications.info(t("PORTOLAN.Notifications.GMCannotRead"));
    return null;
  }
  if (!item.testUserPermission(game.user, "OBSERVER")) return null;
  const app = open.get(item.uuid) ?? new CarnetApp(item);
  app.render({ force: true });
  return app;
}

/** Rafraîchit la fenêtre d'un objet s'il est ouvert. */
export function refreshItem(item) {
  open.get(item.uuid)?.render();
}

/** Ferme la fenêtre d'un objet supprimé. */
export function closeItem(item) {
  open.get(item.uuid)?.close();
}
