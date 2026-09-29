#!/bin/bash
# Pull the final journey chain and stills into raw/ (needs d8j0ntlcm91z4.cloudfront.net allowed),
# then: python3 process.py && python3 build.py --frames frames --cfg cfg.json --poster assets/poster.webp --product assets/product.webp --ing assets
set -e
mkdir -p "$(dirname "$0")/raw" && cd "$(dirname "$0")/raw"
get() { curl -sS --fail --retry 3 -o "$1" "$2" && echo "ok $1 $(stat -c%s "$1")"; }
get seg1.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_002043_5662c3f0-f7f5-4edc-a324-9d597ceee7a9.mp4
get seg2.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_002734_3893e164-bb90-4f55-b7c9-a566397aec26.mp4
get seg3.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_003120_91762b48-a7ab-4a7f-85f0-4af7ff9ed358.mp4
get seg4.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_005054_0ce33350-5638-4614-b78b-1d523b5966c0.mp4
get seg5.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_005535_3804e3e0-aa4f-4245-86f5-2d262e762818.mp4
get seg6.mp4 https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_010121_a14399e6-3678-4761-a0de-1bd6c01f6cc1.mp4
get k1.png   https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_001705_f8b7385c-9056-4ccb-a909-b81db5fc9e93.png
get k0.png   https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_001403_acbfbd59-c035-42d4-8bff-7e3287ba578b.png
get kend.png https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260929_001650_9517d354-3676-4fe7-a592-f6b40bfc8017.png
get s_collagen.png   https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260928_234236_bfce9c67-25a4-43bc-bcab-1d4cdd1848ad.png
get s_probiotics.png https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260928_234236_29184304-3265-471c-8380-9f675cf48307.png
get s_ginger.png     https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260928_234241_bef4d42b-8a40-4bff-95a2-6f4a22d69513.png
get s_mint.png       https://d8j0ntlcm91z4.cloudfront.net/user_3HIdJMoIF49VsebmtXYffU9GhGG/hf_20260928_234241_b703de3f-5da3-4aca-8861-b4fc536739b3.png
