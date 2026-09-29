#!/bin/bash
# Google Fonts (SIL Open Font License) embedded by build.py as base64.
set -e
mkdir -p "$(dirname "$0")/fonts" && cd "$(dirname "$0")/fonts"
curl -sS -o albert.woff2 https://fonts.gstatic.com/s/albertsans/v4/i7dOIFdwYjGaAMFtZd_QA1ZbYFc.woff2
curl -sS -o ibarra.woff2 https://fonts.gstatic.com/s/ibarrarealnova/v30/sZlfdQiA-DBIDCcaWtQzL4BZHoiDkHtYEQ.woff2
curl -sS -o ibarra-italic.woff2 https://fonts.gstatic.com/s/ibarrarealnova/v30/sZlsdQiA-DBIDCcaWtQzL4BZHoiDkH5CH9yb5n3ZFmKopyiubzx7XA.woff2
ls -la
