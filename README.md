# Lumi's Data Lab: Excel + Power BI 🫧

A hands-on, ADHD-friendly course that teaches **Excel** (13 lessons) and **Power BI** (13 lessons) from beginner to job-ready, covering what business analytics, BI and data analyst roles expect. Learners practise in a working spreadsheet and a Power BI simulator right in the browser, then repeat each skill in real Excel and Power BI Desktop with the included practice files.

**Live site:** https://chaitalipatil06.github.io/Excel-PowerBI-Lab/

## What's inside

| Track | Lessons | Hands-on in the browser |
| --- | --- | --- |
| Excel | Grid basics · Formulas & fill down · SUM/AVERAGE/MIN/MAX · IF/AND/IFERROR · VLOOKUP/XLOOKUP/INDEX-MATCH · SUMIFS & text cleaning · Sort/filter/conditional formatting · PivotTables & charts · Dates & TEXT formats · Dynamic arrays (FILTER/SORT/UNIQUE, SUMPRODUCT) · Named ranges, LET, Goal Seek & what-if · Dashboards & Power Query in Excel · a job-style Skills Test | A real formula engine (70+ functions including dates, dynamic arrays that spill, LET and named ranges, `$` references, Fill Down / Ctrl+D, Goal Seek), sortable/filterable table, PivotTable builder, chart builder |
| Power BI | Workflow & interface · Power Query · Star-schema modeling · DAX measures · CALCULATE & filter context · Visuals & slicers · Dashboard design & publishing · Power Query Pro (unpivot/append/merge/group) · Time intelligence (YTD, LY, YoY, MoM) · Advanced DAX (row vs filter context, calculated columns, VAR, FILTER) · Drill-down, bookmarks & storytelling · Service, gateways, RLS & deployment · Capstone business review | Power Query simulator (clean, unpivot, append, merge, group by), Model view (draw relationships), DAX editor with filter context, VAR, FILTER and time intelligence, calculated columns, row-level security, report builder with Region and Year slicers |

Every lesson ends with a **"Try it for real"** checklist using the files in `practice/`:

- `Lumi_Excel_Practice.xlsx`: one sheet per lesson (16 sheets), yellow task cells, a dashboard brief, a 20-minute skills test, and an Answers sheet with 100 formulas
- `LumiBoba_PowerBI_Data.xlsx`: Sales (1,777 rows over 2024 and 2025), Products, Stores, Calendar, ready for Power BI Desktop
- `Budget_Wide.csv`, `Orders_Q1.csv`, `Orders_Q2.csv`: for unpivot and append practice
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
- `src/engine-pbi.js`: a mini Power BI engine (relationships with one-to-many filter propagation, a DAX subset including CALCULATE, ALL, FILTER, SUMX, RELATED, DIVIDE, VAR/RETURN, TOTALYTD, SAMEPERIODLASTYEAR and DATEADD, calculated columns, row-level security, and Power Query step replay)
- `src/content.js` and `src/content-adv.js`: all lessons, quizzes, tasks and their answer checks
- `src/app.js`: the lesson player, simulators, focus tools, games and progress (saved in `localStorage`)
- Python (build-time only): `gen_data.py` makes the dataset, `gen_practice.py` builds the practice files with openpyxl, `build.py` bundles `src/` into `index.html`, and `tests/e2e.py` (Playwright) completes every step of every lesson automatically

```bash
cd src && python3 gen_data.py && python3 gen_practice.py && python3 build.py
python3 tests/e2e.py
```

## Deploy

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. `index.html` must be at the top level of the repository.
