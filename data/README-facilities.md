# Sourced facility integration notes
Access date: 2026-11-07 (WITA / Asia/Makassar).

`facilities.json` is the requested canonical array; 3 records: TPA Suwung, TPS3R Cemara, TPS3R Sesetan. `verified:true` means **published geographic point matched to named facility**, NOT operational status, survey accuracy, public drop-off access, or a verified road entrance. Third-party directory points are used, not invented or geocoded centroids. Detailed source/caveat records: `../data/facilities-sourced.json`.

## Depot warning
TPA Suwung (-8.7193435, 115.2205973) is a **demo depot reference only**. Maptons publishes the pair; Exa corroborates to six decimals. Neither proves a truck entrance or current waste acceptance. Exa says Open but contains closure-related reviews; 29 Dec 2025 IDN Times reporting described a future closure deadline. Do NOT infer today's operation from either. Obtain authority/operator confirmation before actual routing or dispatch. A demo route may start at this geographic point only with an explicit simulated-depot label.

## TPS3R points
Cemara: official 13 Jan 2022 village notice names Jalan Tukad Nyali No. 1; Exa publishes matching address and coordinate. Exa category is unreliable (water treatment), so type comes from official source, not directory.
Sesetan: official 20 Jan 2022 notice names Jalan Gurita; Exa gives Gurita IV No.201 and point. NusaBali 11 Apr 2026 photo report confirms TPS3R on Jalan Gurita IV and operation on 10 Apr 2026, NOT current operation: https://www.nusabali.com/berita/217891/memilah-sampah . Directory category manufacturer is ignored.

Any future record with null lat/lng must have verified:false and MUST NOT enter the router. Bank sampah are separate because the integration enum excludes them: `../data/bank-sampah-sourced.json` (8 historical/undated sourced listings; coordinates null). Do not route to these or imply they accept mixed waste.

Official location sources:
- https://www.sanurkaja.denpasarkota.go.id/berita/informasi-pemilahan-sampah-tps-3r-cemara-desa-sanur-kaja
- https://www.sesetan.denpasarkota.go.id/berita/mlaspas-tps3r-sesetan
Coordinate sources (all opened):
- https://id.maptons.com/p/5282207436
- https://exa.ai/library/place/q4dlkmmg6c9
- https://exa.ai/library/place/yc4mf6qkjlh
- https://exa.ai/library/place/wl22tkly45g
