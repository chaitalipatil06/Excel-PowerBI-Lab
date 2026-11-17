# Lumi's Data Lab: Excel + Power BI 🫧

A hands-on, ADHD-friendly course that teaches **Excel** (8 lessons) and **Power BI** (7 lessons) from beginner to job-ready. Learners practise in a working spreadsheet and a Power BI simulator right in the browser, then repeat each skill in real Excel and Power BI Desktop with the included practice files.

**Live site:** https://chaitalipatil06.github.io/Excel-PowerBI-Lab/ (replace REPO-NAME with your repository's name)

## What's inside

| Track | Lessons | Hands-on in the browser |
| --- | --- | --- |
| Excel | Grid basics · Formulas & fill down · SUM/AVERAGE/MIN/MAX · IF/AND/IFERROR · VLOOKUP/XLOOKUP/INDEX-MATCH · SUMIFS & text cleaning · Sort/filter/conditional formatting · PivotTables & charts | A real formula engine (40+ functions, `$` references, Fill Down / Ctrl+D), sortable/filterable table, PivotTable builder, chart builder |
| Power BI | Workflow & interface · Power Query · Star-schema modeling · DAX measures · CALCULATE & filter context · Visuals & slicers · Dashboard design, publishing & RLS | Power Query "Applied Steps" simulator, Model view (draw relationships), DAX editor that evaluates measures in filter context, report builder with slicers |

Every lesson ends with a **"Try it for real"** checklist using the files in `practice/`:

- `Lumi_Excel_Practice.xlsx`: one sheet per lesson, yellow task cells, and an Answers sheet
- `LumiBoba_PowerBI_Data.xlsx`: Sales (834 rows), Products, Stores, Calendar, ready for Power BI Desktop
- `Messy_Customers.csv`: deliberately messy data for Power Query practice

## Designed for focus (ADHD-friendly)

- **One idea or one action per screen:** micro-steps of 1 to 2 minutes, with segmented progress at the top
- **Doing over reading:** about 70% of steps are interactive, and explanations are kept to 60 words or fewer
- **Instant feedback** with friendly, specific hints, a "Stuck?" hint, and "Show me" after two tries
- **Focus timer** (10 to 25 min) that pauses when the tab is hidden and offers **guided 2-minute breaks** (box breathing, stretch, water, one song)
- **Parking lot** to jot down distracting thoughts without leaving the lesson
- **Small, frequent rewards:** XP, streaks, an adjustable daily goal ("low-energy day" counts too), and a short brain-break game every 2 lessons
- **Resume exactly** where you left off, and "Done for now" is always an option
- **Calm mode** (no animation or confetti), bigger text, read-aloud, keyboard support (Enter = next, A to D = answers), and the Lexend font, which was designed for readability
- No background animation and no ads: one clear call to action per screen

## Tech

Plain HTML, CSS and JavaScript in one self-contained `index.html`, with no frameworks and no server.

- `src/engine-excel.js`: a small spreadsheet engine (tokenizer, parser, evaluator, relative/absolute reference shifting)
- `src/engine-pbi.js`: a mini Power BI engine (relationships with one-to-many filter propagation, a DAX subset including CALCULATE/ALL/SUMX/RELATED/DIVIDE, and Power Query step replay)
- `src/content.js`: all lessons, quizzes, tasks and their answer checks
- `src/app.js`: the lesson player, simulators, focus tools, games and progress (saved in `localStorage`)
- Python (build-time only): `gen_data.py` makes the dataset, `gen_practice.py` builds the practice files with openpyxl, `build.py` bundles `src/` into `index.html`, and `tests/e2e.py` (Playwright) completes every step of every lesson automatically

```bash
cd src && python3 gen_data.py && python3 gen_practice.py && python3 build.py
python3 tests/e2e.py
```

## Deploy

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. `index.html` must be at the top level of the repository.
