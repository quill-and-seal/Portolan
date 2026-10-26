"""Génère les schémas de conception de Portolan (SVG -> PNG). Usage : python tools/build-diagrams.py docs/images"""
import cairosvg, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)

INK = "#3a2a1c"
SEPIA = "#7a5c3e"
PAPER = "#f7efdf"
CARD = "#fffaf0"
LINE = "#c9b28c"
WAX = "#8e2f2a"
TEAL = "#2f5d62"
MUTED = "#8a7560"

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def svg(w, h, body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="{SEPIA}"/></marker>
  <marker id="arrw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="{WAX}"/></marker>
  <marker id="arrt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="{TEAL}"/></marker>
</defs>
<rect width="{w}" height="{h}" fill="{PAPER}"/>
<rect x="8" y="8" width="{w-16}" height="{h-16}" fill="none" stroke="{LINE}" stroke-width="1.5" rx="6"/>
{body}
</svg>'''

def box(x, y, w, h, title, lines=(), accent=SEPIA, fill=CARD, title_size=20):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{accent}" stroke-width="2"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="6" rx="3" fill="{accent}"/>'
    s += f'<text x="{x+w/2}" y="{y+34}" text-anchor="middle" font-family="Lora" font-weight="700" font-size="{title_size}" fill="{INK}">{esc(title)}</text>'
    for i, ln in enumerate(lines):
        s += f'<text x="{x+w/2}" y="{y+62+i*24}" text-anchor="middle" font-family="Inter" font-size="15" fill="{MUTED}">{esc(ln)}</text>'
    return s

def arrow(x1, y1, x2, y2, label="", color=SEPIA, marker="arr", dash=False, lx=None, ly=None, anchor="middle"):
    d = ' stroke-dasharray="7 6"' if dash else ""
    s = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2.2"{d} marker-end="url(#{marker})"/>'
    if label:
        lx = (x1 + x2) / 2 if lx is None else lx
        ly = (y1 + y2) / 2 - 10 if ly is None else ly
        s += f'<text x="{lx}" y="{ly}" text-anchor="{anchor}" font-family="Inter" font-style="italic" font-size="15" fill="{color}">{esc(label)}</text>'
    return s

def path(d, color=SEPIA, marker="arr", dash=False):
    da = ' stroke-dasharray="7 6"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2"{da} marker-end="url(#{marker})"/>'

def text(x, y, t, size=15, color=MUTED, weight="400", anchor="middle", family="Inter", italic=False):
    st = ' font-style="italic"' if italic else ""
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{family}" font-weight="{weight}" font-size="{size}" fill="{color}"{st}>{esc(t)}</text>'

def title(w, t, sub):
    return text(w/2, 52, t, 26, INK, "700", family="Lora") + text(w/2, 80, sub, 15, MUTED, italic=True)

def render(name, w, h, body):
    s = svg(w, h, body)
    open(f"{OUT}/{name}.svg", "w").write(s)
    cairosvg.svg2png(bytestring=s.encode(), write_to=f"{OUT}/{name}.png", output_width=w*2, output_height=h*2)

# 1. Modèle d'objets ---------------------------------------------------------
W, H = 1200, 640
b = title(W, "Les objets de Portolan", "Tout vit dans l'inventaire dnd5e du personnage")
b += box(470, 115, 260, 90, "Personnage", ["acteur dnd5e du joueur"], accent=INK)
b += box(60, 290, 330, 210, "Carnet", ["style (apparence + tampons)", "capacité : 25 pages (défaut)", "pages dessinées / vierges", "feuilles glissées dedans", "poids natif dnd5e"], accent=TEAL)
b += box(435, 290, 330, 165, "Feuille volante", ["une copie figée d'une carte", "auteur + date de copie", "ne compte pas comme une page"], accent=WAX)
b += box(810, 290, 330, 165, "Pages vierges", ["achetées à la papeterie", "ajoutées à un carnet,", "dans la limite de sa capacité"], accent=SEPIA)
b += arrow(530, 205, 260, 288, "possède 1..n", TEAL, "arrt", lx=360, ly=238)
b += arrow(600, 205, 600, 288, "possède 0..n", WAX, "arrw", lx=660, ly=255)
b += arrow(670, 205, 940, 288, "possède 0..n", SEPIA, lx=850, ly=238)
b += path("M 600 455 C 600 545, 330 560, 300 505", WAX, "arrw", dash=True)
b += text(615, 492, "glissée dans un carnet,", 15, WAX, italic=True, anchor="start")
b += text(615, 512, "sans prendre de page", 15, WAX, italic=True, anchor="start")
b += path("M 975 455 C 975 640, 250 640, 225 505", SEPIA, dash=True)
b += text(990, 492, "consommées pour", 15, SEPIA, italic=True, anchor="start")
b += text(990, 512, "agrandir un carnet", 15, SEPIA, italic=True, anchor="start")
render("01-objets", W, H, b)

# 2. Cycle de vie ------------------------------------------------------------
W, H = 1200, 560
b = title(W, "Le cycle de vie d'une carte", "De la première ligne à la revente chez le cartographe")
ys = 150
b += box(40, ys, 210, 110, "Dessiner", ["sur une page", "du carnet"], accent=TEAL)
b += box(330, ys, 210, 110, "Copier", ["arrache une page", "vierge du copiste"], accent=WAX)
b += box(620, ys, 230, 110, "Feuille volante", ["copie figée,", "auteur signé"], accent=WAX)
b += box(930, ys, 230, 110, "Donner", ["à un autre", "joueur"], accent=SEPIA)
b += arrow(250, ys+55, 328, ys+55, color=TEAL, marker="arrt")
b += arrow(540, ys+55, 618, ys+55, color=WAX, marker="arrw")
b += arrow(850, ys+55, 928, ys+55, color=SEPIA)
yb = 370
b += box(40, yb, 260, 120, "Vendre", ["original (perd la page)", "ou copie (page arrachée)"], accent=INK)
b += box(390, yb, 260, 120, "Estimation MJ", ["voit la carte, fixe le prix", "Mint paie (optionnel)"], accent=INK)
b += box(740, yb, 260, 120, "Cartographe", ["PNJ qui garde la carte", "et en revend des copies"], accent=INK)
b += arrow(145, ys+110, 160, yb-2, "vente", INK, lx=110, ly=330)
b += arrow(300, yb+60, 388, yb+60, color=INK)
b += arrow(650, yb+60, 738, yb+60, color=INK)
b += path(f"M 1000 {yb+60} C 1110 {yb+60}, 1110 340, 1045 {ys+112}", WAX, "arrw", dash=True)
b += text(1100, 330, "revente", 15, WAX, italic=True, anchor="start")
b += text(1100, 350, "de copies", 15, WAX, italic=True, anchor="start")
render("02-cycle", W, H, b)

# 3. Flux de copie (séquence) --------------------------------------------------
W, H = 1200, 600
b = title(W, "Copier une carte", "Le copiste paie le papier : une page vierge de son carnet")
cols = [(200, "Joueur A (copiste)", TEAL), (600, "Portolan", INK), (1000, "Joueur B", SEPIA)]
for x, t, c in cols:
    b += f'<rect x="{x-140}" y="110" width="280" height="54" rx="10" fill="{CARD}" stroke="{c}" stroke-width="2"/>'
    b += text(x, 144, t, 18, INK, "700", family="Lora")
    b += f'<line x1="{x}" y1="164" x2="{x}" y2="560" stroke="{LINE}" stroke-width="2" stroke-dasharray="4 6"/>'
steps = [
    (200, 600, "1. « Copier » sur une page dessinée", TEAL, "arrt"),
    (600, 600, "2. vérifie : au moins 1 page vierge ?", INK, None),
    (600, 200, "3. retire 1 page vierge du carnet de A", WAX, "arrw"),
    (600, 600, "4. crée la feuille volante (traits figés, auteur, date)", INK, None),
    (200, 600, "5. choisit le destinataire", TEAL, "arrt"),
    (600, 1000, "6. transfère la feuille dans l'inventaire de B", SEPIA, "arr"),
    (1000, 1000, "7. garde volante, ou glisse dans un carnet", SEPIA, None),
]
y = 205
for x1, x2, lab, c, m in steps:
    if x1 == x2:
        b += f'<rect x="{x1-12}" y="{y-14}" width="24" height="28" rx="4" fill="{c}" opacity="0.85"/>'
        b += text(x1 + 24, y + 5, lab, 15, c, "600", anchor="start") if x1 < 900 else text(x1 - 24, y + 5, lab, 15, c, "600", anchor="end")
    else:
        b += arrow(x1, y, x2 - (6 if x2 > x1 else -6), y, color=c, marker=m)
        b += text((x1 + x2) / 2, y - 10, lab, 15, c, "600")
    y += 50
render("03-copie", W, H, b)

# 4. Flux de vente (séquence) ------------------------------------------------
W, H = 1200, 680
b = title(W, "Vendre une carte au cartographe", "Le MJ ne voit la carte qu'ici, en lecture seule")
cols = [(170, "Joueur", TEAL), (470, "Portolan (socket)", INK), (770, "MJ", WAX), (1040, "Mint (optionnel)", SEPIA)]
for x, t, c in cols:
    b += f'<rect x="{x-120}" y="110" width="240" height="54" rx="10" fill="{CARD}" stroke="{c}" stroke-width="2"/>'
    b += text(x, 144, t, 18, INK, "700", family="Lora")
    b += f'<line x1="{x}" y1="164" x2="{x}" y2="640" stroke="{LINE}" stroke-width="2" stroke-dasharray="4 6"/>'
steps = [
    (170, 470, "1. propose : original ou copie", TEAL, "arrt"),
    (470, 770, "2. demande d'estimation (aperçu figé)", INK, "arr"),
    (770, 770, "3. compare à la vraie carte", WAX, None),
    (770, 470, "4. propose un prix", WAX, "arrw"),
    (470, 170, "5. affiche l'offre", INK, "arr"),
    (170, 470, "6. accepte ou refuse", TEAL, "arrt"),
    (470, 1040, "7. paiement au joueur", SEPIA, "arr"),
    (470, 470, "8. original : page retirée / copie : page vierge arrachée", INK, None),
    (470, 470, "9. la carte rejoint l'inventaire du cartographe", INK, None),
]
y = 205
for x1, x2, lab, c, m in steps:
    if x1 == x2:
        b += f'<rect x="{x1-12}" y="{y-14}" width="24" height="28" rx="4" fill="{c}" opacity="0.85"/>'
        b += text(x1 + 24, y + 5, lab, 15, c, "600", anchor="start")
    else:
        b += arrow(x1, y, x2 - (6 if x2 > x1 else -6), y, color=c, marker=m)
        b += text((x1 + x2) / 2, y - 10, lab, 15, c, "600")
    y += 50
render("04-vente", W, H, b)

# 5. Architecture ------------------------------------------------------------
W, H = 1200, 700
b = title(W, "Architecture du module", "Trois couches, un adaptateur système, une intégration optionnelle")
def layer(y, h, name, color):
    s = f'<rect x="40" y="{y}" width="1120" height="{h}" rx="12" fill="none" stroke="{color}" stroke-width="1.5" stroke-dasharray="6 5"/>'
    s += f'<text x="60" y="{y+28}" font-family="Lora" font-weight="700" font-size="18" fill="{color}">{esc(name)}</text>'
    return s
b += layer(110, 170, "Interface (ApplicationV2)", TEAL)
b += box(70, 150, 320, 110, "Atelier du carnet", ["liste des pages, feuilles", "navigation, copier, vendre"], accent=TEAL, title_size=18)
b += box(440, 150, 320, 110, "Table à dessin", ["canvas vectoriel : trait,", "gomme, texte, tampons"], accent=TEAL, title_size=18)
b += box(810, 150, 320, 110, "Fenêtre de vente", ["joueur : proposition", "MJ : estimation du prix"], accent=TEAL, title_size=18)
b += layer(305, 170, "Services", INK)
b += box(70, 345, 240, 110, "Carnets", ["pages, capacité,", "feuilles glissées"], accent=INK, title_size=18)
b += box(340, 345, 240, 110, "Copie", ["arrachage, feuille", "volante, transfert"], accent=INK, title_size=18)
b += box(610, 345, 240, 110, "Vente", ["négociation par", "socket, cartographe"], accent=INK, title_size=18)
b += box(880, 345, 250, 110, "Socket", ["actions du joueur", "exécutées par le MJ"], accent=INK, title_size=18)
b += layer(500, 170, "Données et intégrations", SEPIA)
b += box(70, 540, 340, 110, "Adaptateur dnd5e", ["type d'objet « loot »,", "poids, prix, inventaire"], accent=SEPIA, title_size=18)
b += box(440, 540, 320, 110, "Flags portolan.*", ["traits vectoriels compressés", "dans l'objet lui-même"], accent=SEPIA, title_size=18)
b += box(790, 540, 340, 110, "Mint (optionnel)", ["paiement si actif,", "sinon montant manuel"], accent=WAX, title_size=18)
render("05-architecture", W, H, b)

print("ok", os.listdir(OUT))
