# PlantUML Source Files

Render each `.puml` to PNG and upload the PNG to your Overleaf project root (alongside `.tex` files).

## Class Diagrams

| Source file        | Output PNG       | Used in `class-diagram.tex`            |
|--------------------|------------------|----------------------------------------|
| `CD-layers.puml`   | `CD-layers.png`  | Architecture overview (§ Kiến trúc)    |
| `CD1.puml`         | `CD1.png`        | Entity – User & Access Management      |
| `CD2.puml`         | `CD2.png`        | Entity – Catalog, Trial & Membership   |
| `CD3.puml`         | `CD3.png`        | Entity – Session, Finance, Review      |
| `CD-repo.puml`     | `CD-repo.png`    | Repository Layer                       |
| `CD-service.puml`  | `CD-service.png` | Service Layer                          |

## Sequence Diagrams (Illustrate Data Flow)

| Source file        | Output PNG       | Use Case & Purpose                     |
|--------------------|------------------|----------------------------------------|
| `SD-CHECKIN.puml`  | `SD-CHECKIN.png` | UC-MEMBER-03: Member self check-in — atomic transaction: weight log + class_attendance, DB trigger decrements sessions_remaining |
| `SD-POS.puml`      | `SD-POS.png`     | UC-POS-01/02/03: Create invoice → record payment → auto-activate membership/course enrollment via invoice_line_items |
| `SD-HEALTH.puml`   | `SD-HEALTH.png`  | UC-HEALTH: View progress (health profile + weight logs + body measurements), update health profile (upsert), log weight manually |

**Why Sequence Diagrams?**
- Show layer-to-layer interaction: Controller → UseCase → Repository → Database
- Clarify error handling, RBAC branch-scope validation (CROSS_BRANCH_ACCESS)
- Demonstrate atomic transactions (BEGIN/COMMIT) for data integrity
- Help with thesis defense: "When member checks in, here's exactly what happens..."

## How to render

### Option A — PlantUML JAR (offline)

```bash
java -jar plantuml.jar -tpng docs/plantuml/*.puml -o ../plantuml/out/
```

Download JAR: https://plantuml.com/download

### Option B — VS Code extension

Install **PlantUML** (jebbs.plantuml), open any `.puml` file, press `Alt+D` to preview,
then right-click → **Export Current Diagram** → PNG.

### Option C — Online

Paste file contents into https://www.plantuml.com/plantuml/uml/ and export PNG.

## Overleaf preamble requirements

Make sure these packages are in your Overleaf `.tex` preamble:

```latex
\usepackage{graphicx}
\usepackage{longtable}
\usepackage{multirow}
\usepackage{array}
\usepackage{booktabs}
```
