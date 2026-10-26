# Portolan

**Foundry VTT v14 · dnd5e** : des cartes dessinées par les joueurs.

Les portulans étaient les cartes marines du Moyen Âge, tracées à la main d'après les récits des navigateurs : précises là où l'on était passé, vides ailleurs. Portolan fait la même chose à ta table. Le MJ garde seul la vraie carte du monde ; chaque joueur dessine la sienne dans des carnets qu'il transporte, la recopie en arrachant une page pour la donner, ou la vend à un cartographe qui en revendra des copies.

Un module de l'atelier [Quill & Seal](https://github.com/quill-and-seal).

> **État : 0.1, squelette.** Les carnets, les pages vierges et l'atelier du carnet existent ; le dessin, la copie et la vente arrivent dans les versions suivantes. Voir [ROADMAP.md](ROADMAP.md) et le [document de conception](https://docs.google.com/document/d/15ud0tik_yixs2NYOl3l2j4mqU9KW4jnYxx3vY-Mxf_0/edit).

## Installation

Dans Foundry, **Modules complémentaires → Installer un module**, puis colle ce lien de manifeste :

```
https://github.com/quill-and-seal/Portolan/releases/latest/download/module.json
```

Active ensuite le module dans un monde **dnd5e**. Mint est optionnel : quand il sera branché (0.5), l'achat et la vente passeront par lui.

## Les objets

Tout est rangé dans l'inventaire dnd5e du personnage, avec poids et prix.

| Objet | Rôle |
|---|---|
| **Carnet** | Contient les cartes du joueur. Un carnet neuf a toutes ses pages vierges (25 par défaut). |
| **Carnet de cartographe** | Plus beau, avec des tampons en plus (40 pages par défaut). |
| **Feuille volante** | Copie figée d'une carte. Se donne, se vend, se glisse dans un carnet sans prendre de page. |
| **Pages vierges** | Papeterie : remplacent les pages arrachées, sans dépasser la capacité du carnet. |

Copier une carte arrache une page vierge du carnet du copiste. Vendre l'original au cartographe retire la page du carnet.

## Utilisation (0.1)

Le MJ donne un carnet à un personnage depuis une macro :

```js
const api = game.modules.get("portolan").api;
const actor = game.actors.getName("Nom du personnage");
await api.createCarnet(actor);                            // carnet par défaut
await api.createCarnet(actor, { style: "cartographe" });  // carnet de cartographe
await api.createPapier(actor, { quantity: 5 });           // lot de pages vierges
```

Le joueur ouvre son carnet avec le bouton **Ouvrir le carnet** en haut de la fiche de l'objet, ou depuis le menu contextuel de son inventaire. Il peut y commencer une carte sur une page vierge et la renommer.

Le MJ ne peut ni ouvrir ni modifier les cartes des joueurs : il ne les verra que lors d'une vente. C'est une règle protégée par l'interface ; les données restent lisibles par qui fouille la console.

## Développement

```
node --test tests/*.test.mjs
```

`scripts/model.js` contient toute la logique des carnets en fonctions pures, testées hors de Foundry. Les schémas de `docs/images` se régénèrent avec `python tools/build-diagrams.py docs/images` (nécessite `cairosvg`).

## Licence

MIT
