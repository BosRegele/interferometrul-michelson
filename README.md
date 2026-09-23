# Interferometrul lui Michelson

Proiect interactiv de fizică pentru clasa a XII-a — optică ondulatorie.

**Live:** https://bosregele.github.io/interferometrul-michelson/

## Povestea, în ordine

Pagina urmează întrebarea, nu manualul. Fiecare formulă apare abia după ce fenomenul a fost văzut.

1. **Povestea** — valurile au apa, sunetul are aerul; prin ce se propagă lumina? Eterul, de ce ar fi și pe Pământ, vântul de eter, analogia râului, cum cronometrezi lumina.
2. **Aparatul** — construit pas cu pas, recombinarea razelor, suprapunerea, faza în trei stări (0°, 90°, 180°), lanțul oglindă → drum → fază → intensitate → franjă, factorul 2, franjele.
3. **1887** — de ce se rotea aparatul, predicția înaintea rezultatului, comparația cu datele originale, ce a însemnat rezultatul, contextul Einstein.
4. **Explore more** — rigla interferometrică, coerența, indicele de refracție al gazelor, LIGO, provocări.

Douăsprezece carduri „Stai puțin…” răspund la întrebările naturale exact acolo unde apar.

Bara de sus are **ƒ Formule** (cu valorile curente înlocuite numeric) și **Prezentare** — mod pentru clasă: săgeți pentru scene, Space pauză, R reset.

## Structura codului

```
src/physics/   motorul fizic: funcții pure, fără DOM
  phase.js  opticalPath.js  interference.js
  coherence.js  refractiveIndex.js  etherModel.js
src/state.js   sursa unică de adevăr; toate vizualizările citesc de aici
src/sims/      desenatorii (canvas), câte unul pe subiect
src/ui.js      navigație, sertarul de formule, Presenter și Challenge Mode
src/main.js    leagă comenzile de stare
test/          teste automate
build.js       împachetează modulele într-un singur index.html
```

```bash
npm test         # 24 de teste
npm run build    # produce site/index.html
```

Testele acoperă fizica (ΔL = 2Δx, faza la λ/2, maxime și minime, numărul de franje, drumul optic prin gaz, coerența, modelul din 1887) și verifică static că orice culoare folosită în desene există în paletă — canvasul ignoră în tăcere o culoare nedefinită.

## Fotografii, filmări și date originale

Toate provin de pe Wikimedia Commons și sunt păstrate local, în `img/` și `vid/`.

| Imagine | Autor | Licență |
|---|---|---|
| Aparatul din 1887 | Case Western Reserve University | domeniu public |
| Portretul lui Michelson | via Smithsonian Institution | domeniu public |
| Figura 6 din lucrarea din 1887 | Michelson & Morley | domeniu public |
| Interferometru pe masă optică | FL0 | CC BY-SA 3.0 |
| Inele Newton, laser 650 nm | Robert D. Anderson | CC BY-SA 3.0 |
| LIGO Hanford, vedere aeriană | Caltech/MIT/LIGO Laboratory | domeniu public |
| Semnalul GW150914 | Caltech/MIT/LIGO Laboratory | CC0 |
| Placa comemorativă | Alan Migdall | CC BY-SA 3.0 |
| Filmare: vântul de eter, model cu valuri | Rhetos | CC BY-SA 4.0 |
| Animație: interferometrul Virgo | Thuiop | CC BY-SA 4.0 |
| Animație: unde gravitaționale pe Pământ | LIGO Lab Caltech/MIT, R. Hurt | CC BY 3.0 |

## Surse bibliografice

- A. A. Michelson, E. W. Morley — *On the Relative Motion of the Earth and the Luminiferous Ether*, American Journal of Science 34, 1887
- E. Hecht — *Optics*, ed. a 5-a, cap. 9
- Nagel et al. — *Direct terrestrial test of Lorentz symmetry in electrodynamics*, Nature Communications 6, 2015
- BIPM — istoricul definițiilor metrului
