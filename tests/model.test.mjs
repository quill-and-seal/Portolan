import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCarnet,
  pageCount,
  freeSlots,
  startPage,
  updatePage,
  addBlankPages,
  tearBlankPage,
  removePage,
  copyPage,
  pageToOriginal,
  tuckSheet,
  untuckSheet,
  simplifyPath,
  PortolanError
} from "../scripts/model.js";

let n = 0;
const makeId = () => `id${++n}`;

test("un carnet neuf a toutes ses pages vierges", () => {
  const c = createCarnet();
  assert.equal(c.capacity, 25);
  assert.equal(c.blank, 25);
  assert.equal(pageCount(c), 25);
  assert.equal(freeSlots(c), 0);
});

test("une capacité invalide est refusée", () => {
  assert.throws(() => createCarnet({ capacity: 0 }), PortolanError);
  assert.throws(() => createCarnet({ capacity: 2.5 }), PortolanError);
});

test("commencer une carte consomme une page vierge sans changer le nombre de pages", () => {
  const { carnet, page } = startPage(createCarnet({ capacity: 3 }), { name: "Vallée", makeId });
  assert.equal(carnet.blank, 2);
  assert.equal(carnet.pages.length, 1);
  assert.equal(page.name, "Vallée");
  assert.equal(pageCount(carnet), 3);
});

test("plus de page vierge : plus de nouvelle carte", () => {
  const { carnet } = startPage(createCarnet({ capacity: 1 }), { makeId });
  assert.throws(() => startPage(carnet, { makeId }), { key: "PORTOLAN.Errors.NoBlankPage" });
});

test("les fonctions ne modifient pas le carnet d'origine", () => {
  const c = createCarnet({ capacity: 2 });
  startPage(c, { makeId });
  tearBlankPage(c);
  assert.equal(c.blank, 2);
  assert.equal(c.pages.length, 0);
});

test("mettre à jour une page remplace ses traits", () => {
  const { carnet, page } = startPage(createCarnet(), { makeId });
  const strokes = [{ t: "text", x: 10, y: 20, s: 24, v: "Ici" }];
  const next = updatePage(carnet, page.id, { strokes, now: 42 });
  assert.deepEqual(next.pages[0].strokes, strokes);
  assert.equal(next.pages[0].updated, 42);
  assert.throws(() => updatePage(carnet, "absent", { strokes }), { key: "PORTOLAN.Errors.NoPage" });
});

test("copier arrache une page vierge et fige les traits", () => {
  let { carnet, page } = startPage(createCarnet({ capacity: 5 }), { makeId });
  carnet = updatePage(carnet, page.id, { strokes: [{ t: "path", c: "#000", w: 2, p: [0, 0, 10, 10] }] });
  const { carnet: after, feuille } = copyPage(carnet, page.id, { author: "Kael", makeId, now: 7 });
  assert.equal(after.blank, carnet.blank - 1);
  assert.equal(pageCount(after), 4);
  assert.equal(freeSlots(after), 1);
  assert.equal(feuille.author, "Kael");
  assert.equal(feuille.original, false);
  assert.deepEqual(feuille.strokes, carnet.pages[0].strokes);

  // Modifier l'original ne touche pas la copie.
  const edited = updatePage(after, page.id, { strokes: [] });
  assert.equal(edited.pages[0].strokes.length, 0);
  assert.equal(feuille.strokes.length, 1);
});

test("pas de copie sans page vierge", () => {
  const { carnet, page } = startPage(createCarnet({ capacity: 1 }), { makeId });
  assert.throws(() => copyPage(carnet, page.id, { makeId }), { key: "PORTOLAN.Errors.NoBlankPage" });
});

test("les pages de la papeterie remplacent les pages arrachées, jusqu'à la capacité", () => {
  let c = createCarnet({ capacity: 25 });
  c = tearBlankPage(tearBlankPage(tearBlankPage(c)));
  assert.equal(freeSlots(c), 3);
  const { carnet, used } = addBlankPages(c, 10);
  assert.equal(used, 3);
  assert.equal(carnet.blank, 25);
  assert.equal(addBlankPages(carnet, 5).used, 0);
});

test("vendre l'original retire la page du carnet", () => {
  const { carnet, page } = startPage(createCarnet({ capacity: 4 }), { name: "Port", makeId });
  const { carnet: after, page: removed } = removePage(carnet, page.id);
  assert.equal(after.pages.length, 0);
  assert.equal(pageCount(after), 3);
  const original = pageToOriginal(carnet, removed, { author: "Kael", now: 1 });
  assert.equal(original.original, true);
  assert.equal(original.name, "Port");
});

test("une feuille glissée n'occupe pas de page et peut être ressortie", () => {
  const c = createCarnet({ capacity: 2 });
  const feuille = { kind: "feuille", id: "f1", strokes: [] };
  const tucked = tuckSheet(c, feuille);
  assert.equal(pageCount(tucked), 2);
  assert.equal(tucked.tucked.length, 1);
  assert.equal(tuckSheet(tucked, feuille).tucked.length, 1, "pas de doublon");
  const { carnet, feuille: out } = untuckSheet(tucked, "f1");
  assert.equal(carnet.tucked.length, 0);
  assert.equal(out.id, "f1");
  assert.throws(() => untuckSheet(carnet, "f1"), { key: "PORTOLAN.Errors.NoSheet" });
});

test("simplifier un tracé garde les extrémités et retire les points alignés", () => {
  const line = [];
  for (let i = 0; i <= 100; i++) line.push(i, i * 0.5 + (i % 2 ? 0.2 : -0.2));
  const out = simplifyPath(line, 1);
  assert.deepEqual(out.slice(0, 2), [0, 0]);
  assert.deepEqual(out.slice(-2), [100, 50]);
  assert.ok(out.length <= 6, `trop de points : ${out.length / 2}`);
});

test("simplifier garde les angles", () => {
  const corner = [0, 0, 50, 0, 100, 0, 100, 50, 100, 100];
  assert.deepEqual(simplifyPath(corner, 1), [0, 0, 100, 0, 100, 100]);
});

test("simplifier retire les points en double après arrondi", () => {
  assert.deepEqual(simplifyPath([0.2, 0.1, 0.4, 0.3]), [0, 0]);
});
