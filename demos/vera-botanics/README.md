# Vera Botanics — sitio cinematográfico (demo)

Concepto de marca **ficticia** de suplementos: un recorrido por scroll del ritual de la mañana
(canvas fijado con scroll nativo y reversible) seguido de producto, ingredientes, rutina con
timeline, preguntas frecuentes, compra de demostración y sistema de marca. Todo el CSS, el JS,
las fuentes y los fotogramas quedan dentro de un solo HTML (límite del artefacto: 16 MB).

No forma parte del agente de WhatsApp; vive aquí solo para no perder el pipeline.

## Estado

- Artefacto publicado: https://claude.ai/artifact/3yWfBsS6HKFqoLEVBLxduW
- Hoy corre en **modo storyboard**: el entorno de la sesión no pudo descargar los archivos de
  Higgsfield (`d8j0ntlcm91z4.cloudfront.net` bloqueado por la política de red), así que el
  recorrido muestra un estudio de luz rotulado como provisional y las imágenes salen como
  marcos "pendiente de descarga".
- Todo lo generado está en Higgsfield (proyecto "Vera Botanics — sitio cinematográfico").
  Los IDs y la cadena final del recorrido están en `ledger.md`.

## Terminar con el material real

Con el dominio permitido en *Network access* del entorno:

```bash
./fetch_fonts.sh                     # Albert Sans + Ibarra Real Nova (OFL)
./download.sh                        # 6 tramos + fotograma E1 + 4 macros de ingredientes
python3 process.py                   # revisa uniones, arma master/master.mp4, extrae frames/ y cfg.json
python3 build.py --frames frames --cfg cfg.json --poster assets/poster.webp \
                 --product assets/product.webp --ing assets
```

Luego republicar `dist/vera-botanics.html` en la misma URL del artefacto.

`process.py` baja la calidad WebP hasta que los fotogramas quepan en `--budget` MB (9 por
defecto) y reparte fotogramas por capítulo con `--frames` (44,38,56,36,44,44 por defecto).

## Revisar

```bash
python3 build.py ... --qa            # misma página envuelta como la envuelve el artefacto
node qa.mjs dist/vera-qa.html qa/run # 7 configuraciones: escritorio, móvil, tableta, oscuro, movimiento reducido
python3 sheet.py qa/run desk qa/run/sheet-desk.jpg
```

`qa.mjs` usa el Playwright global de la imagen (`/opt/node22/lib/node_modules/playwright`).

## Modos del recorrido

- `film`: secuencia de fotogramas en canvas, caché LRU de `ImageBitmap`, precarga en la
  dirección del scroll y fundido entre fotogramas vecinos. En móvil usa un fotograma de cada dos.
- `stills`: un fotograma representativo por capítulo con fundidos. Se activa con movimiento
  reducido, ahorro de datos, poca memoria o decodificación lenta en móvil.
- `board`: storyboard provisional cuando el HTML no trae fotogramas (`build.py --board`).
