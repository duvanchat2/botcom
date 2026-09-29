# Higgsfield job ledger (project 8d8a4117-0f16-4817-b733-d8a60b310d79)
0  anchor hero 16:9      f59c723b-95ba-46d6-9aef-2bb5b9981d13
1  hero vertical 9:16    3f98e9a8-f8bc-4db6-be7b-26d8c4449660
2  ritual1 serve 9:16    a96854fe-3a26-4525-a5f0-564ad190594b
3  ritual2 dissolve 9:16 e1346ce4-15ce-4314-88d6-36cc1a9bb62e
4  ritual3 lift 9:16     595945bb-23e5-4336-a345-e8d415b17c6f
5  collagen 4:5          bfce9c67-25a4-43bc-bcab-1d4cdd1848ad
6  probiotics 4:5        29184304-3265-471c-8380-9f675cf48307
7  ginger 4:5            bef4d42b-8a40-4bff-95a2-6f4a22d69513
8  mint 4:5              b703de3f-5da3-4aca-8861-b4fc536739b3
9  kitchen 16:9          b767c6d7-c800-42e0-9242-d2d0e4cb1e92
10 closing 16:9          b903d9c8-bba1-4f16-8b71-dc090a13d630
# videos, pass 1 (kling3_0 pro, sound off)
20 hero 16:9 8s          e5464d08-df7d-487d-a40d-e0a943fbf487  (start: 0)
21 hero 9:16 8s          918954b5-6bf6-468d-8305-4a2a2989f3e6  (start: 1)
22 ritual1 9:16 5s       79615b3d-34aa-4b16-8430-902394bba9e2  (start: 2)
23 ritual2 9:16 5s       987c797e-822c-4e0a-9f5d-c974edaec9b8  (start: 3)
24 ritual3 9:16 5s       4b919b92-fd44-4567-b03b-4dac36c4ff06  (start: 4)
25 closing 16:9 6s       1d4be316-c3dc-4ddb-be6e-4cb9f03e421c  (start=end: 10)
# NEW BRIEF — continuous journey keyframes (nano_banana_pro 2K 16:9)
100 K0 window/dawn         acbfbd59-c035-42d4-8bff-7e3287ba578b
101 E1 jar foreground      f8b7385c-9056-4ccb-a909-b81db5fc9e93
102 E2 hand+scoop          64c7dfaa-474d-4fbd-82e0-001ca8ddedb7
103 E3 dissolve            97edce8c-1b4b-4b93-8302-6a041cb051ac
104 E4 ingredients tray    2d121678-bbcd-4b6f-bc27-24ee8060db5c
105 E5 window table        4f35e465-86ff-4532-a08a-b5bd9544af4d
106 K_end reveal           9517d354-3676-4fe7-a592-f6b40bfc8017
# journey segments (seedance_2_5 1080p, no audio)
201 S1 llegada K0->E1 7s   5662c3f0-f7f5-4edc-a324-9d597ceee7a9
202 S2 gesto ext(S1) 6s    3893e164-bb90-4f55-b7c9-a566397aec26  (video_extension; img ref E2 — extension mode rejects end_image)
203 S3 disolucion ext(S2) 8s 91762b48-a7ab-4a7f-85f0-4af7ff9ed358
# analyses: S1 9e2acaca (ok: continuous push-in, jar focal, no people/cuts)
204 S4 ingredientes ext(S3) 6s fe5b66d1-b841-4197-9c64-561813e1c7d6
# analyses: S2 71d02da0 (ok: hand unscrews lid, scoops powder; extension output = new part only)
205 S5 ritual ext(S4) 7s   79afee56-4942-4211-a6b9-4a8db8fa07b0
# analyses: S3 15dfb1f1 (ok: follow scoop to glass, powder blooms & swirls; note: water turns opaque)
# analyses: S4 3a96afa1 (FLAG: two static scenes -> likely hidden cut glass->tray; image ref may have induced it)
214 S4b ingredientes ext(S3) 6s, no image ref, explicit path  0ce33350-5638-4614-b78b-1d523b5966c0
# S5 79afee56 done (chained on S4); analysis 39b7bd4c queued
# S6 submit (ext of S5, img ref K_end) -> 503 Service Unavailable twice (no job created)
# analyses: S5 39b7bd4c (FLAG: starts with ghostly superimposed bowls = dissolve from tray) -> branch S4/S5 discarded
# S4b 0ce33350 analysis a34ea873
215 S5b ritual ext(S4b) 7s, no image ref   3804e3e0-aa4f-4245-86f5-2d262e762818
# analyses: S4b a34ea873 (OK: slow continuous pan right from glass to tray, no cut)
216 S6b revelacion ext(S5b) 7s, no image ref   a14399e6-3678-4761-a0de-1bd6c01f6cc1
# analyses: S5b e4f860af (OK: continuous pan tray->glass, hand carries glass to window table)
# S6b a14399e6 done. FINAL CHAIN: S1 5662c3f0 > S2 3893e164 > S3 91762b48 > S4b 0ce33350 > S5b 3804e3e0 > S6b a14399e6
# discarded: S4 fe5b66d1 (hidden cut), S5 79afee56 (dissolve start). Credits this brief: 3581.7 -> 2919.7 (662)

# DOYPACK JOURNEY (brief 3) — reference upload fea3df2a-cbc6-49d3-b97c-3efef6b84fa8
400 start frame (nano_banana_pro)   f8937374-d238-4b85-8dd2-f9cd408a5d33
401 seg1 El sello 6s (omni_reference) 2408ddeb-9af7-4c0b-9304-9c76f6865b21  approved by user
402 seg2 La apertura 6s (ext 401)    7f0937a5-6f44-4da2-946a-37fd5cfc5ad4  checked: joins 1, text crisp
403 seg3 El origen 8s (ext 402)      8d2624bb-4be7-4555-b1cf-6dfb1736cb3d
