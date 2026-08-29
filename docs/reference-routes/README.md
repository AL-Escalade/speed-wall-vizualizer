# Reference Route PDFs

These documents are the source PDFs used to verify the bundled reference routes.

Each route names its own plan in the `reference` field of `data/routes/*.json`;
that is the document the web app links to. The other rows corroborate a route
without being its plan.

| File | Route data | Downloaded from |
| --- | --- | --- |
| `ifsc-speed-licence-rules-walls-2022-02-01.pdf` | `ifsc` §1.2.4 | [images.ifsc-climbing.org](https://images.ifsc-climbing.org/ifsc/image/private/t_q_good/prd/urwl7n2hnnyvhiwiq0xg.pdf) |
| `ffme-u15-speed-route-2025-10-06.pdf` | `u15` | [ffme.fr](https://www.ffme.fr/wp-content/uploads/2025/10/Plan-voie-de-vitesse-U15.pdf) |
| `ffme-u11-u13-speed-route-2025-12-12.pdf` | `u11-u13` pp. 1-2, `u11-u13-comp` pp. 3-4 | [ffme.fr](https://www.ffme.fr/wp-content/uploads/2025/10/speed-U11.13-V3-20251212_compressed.pdf) |
| `ffme-u12-u14-speed-route-2024-10-16.pdf` | `u12-u14`, `u12-u14-comp` | [ffme.fr](https://www.ffme.fr/wp-content/uploads/2024/12/Voie-Vitesse-FFME-U12_U14_compressed-1.pdf) |
| `germany-u15-speed-route-2025.pdf` | `u15-de` | — |
| `germany-u11-u13-speed-route-2025.pdf` | `u11-u13-de` | — |
| `austria-climbing-speed-cup-u13-u15-mitterdorf-2026.pdf` | `u11-u13-de` topo U13, `u15-de` topo U15 | — |
| `india-imf-climbing-manual-2026.pdf` | `u13-u15-in` annex 1 | — |
| `usa-u15-10m-speed-route-2024-11-20.pdf` | `u13-de` | — |
| `cec-rules-amendment-2025-2026-board-approved-2025-12-09.pdf` | `u13-de` appendix A, `u15-de` appendix B | — |
| `fasi-regolamento-agonistico-giovanile-2026-v5.pdf` | `u15-it` allegato 2, `u11-u13-it` allegato 3 | — |
| `fasi-regolamento-agonistico-giovanile-2026-rev2.pdf` | Earlier FASI 2026 revision kept for traceability | — |

The Italian routes reuse the added holds of the Austrian/German ones but place
some of them differently, so `u15-it` / `u11-u13-it` are separate routes rather
than aliases of `u15-de` / `u11-u13-de`.

Two routes have no plan of their own and therefore no `reference`: `training`
combines the FFME U15 and IFSC routes, and `ifsc-10m` is the IFSC route
truncated to the 10 m record wall used from 2013 to 2019, whose plan the IFSC no
longer publishes.

When a document's coordinate table contradicts its own drawing, the route data
follows the drawing. One case so far: the FFME U15 table reads `Main9 L7/K10`
while the plan places that hold on row 8, so `u15` carries `SN4 BIG L8 K10`.
Every other hold of every bundled plan was measured against its drawing and
agrees with the table.

A separate difference is not a conflict: the German U15 table orients `dx9 E7`
towards E10 where the IFSC map reads E9. Both targets sit straight above the
hold, so the two documents describe the same orientation and the plans cannot
tell them apart.
