#!/usr/bin/env python3
"""Build the capital research content (src/content/capital/filings/*.json) from saved SEC EDGAR responses.

Input (read-only): the paracosm-studio 13F fixtures, which are raw EDGAR responses saved by its verified 13F
pipeline (server/tests/fixtures/13f/<fund>/edgar/*, with manifest.json mapping each file to its SEC URL).
Company facts (CIK, SIC code, exchange) live in ../companies.json and come from SEC submissions JSON.

Every number written here is copied from a raw SEC information table or cover page. Nothing is rounded.
Weights, concentration and quarter-over-quarter changes are derived at runtime by src/lib/capital.

Run (stdlib only, any CPython >= 3.10 with a working expat):
  uv run --no-project python src/content/capital/tools/build_13f_content.py \
      --fixtures <paracosm-studio>/server/tests/fixtures/13f
"""
from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path(__file__).resolve().parents[1]

# Fund definitions: which filer CIKs make up each tracked portfolio, and which quarters to publish.
FUNDS = {
    "thiel-macro": {
        "fixture": "thiel",
        "ciks": ["0001562087"],
        "periods": ["2025-06-30", "2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30"],
    },
    "pershing-square": {
        "fixture": "pershing",
        # Pershing Square Capital Management, L.P. and Pershing Square Inc. (formerly Pershing Square Holdco, L.P.)
        "ciks": ["0001336528", "0002026053"],
        "periods": ["2025-06-30", "2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30"],
    },
}

# Issuer (first six CUSIP characters) -> company slug. Every issuer in a published table must be listed.
ISSUERS = {
    "023135": "amazon", "92837L": "vista-energy", "92840M": "vistra", "025537": "american-electric-power",
    "233331": "dte-energy", "337932": "firstenergy", "125896": "cms-energy", "98386P": "x-energy",
    "90353T": "uber", "11271J": "brookfield", "594918": "microsoft", "44267T": "howard-hughes",
    "76131D": "restaurant-brands-international", "30303M": "meta", "92826C": "visa", "57636Q": "mastercard",
    "78409V": "sp-global", "64110L": "netflix", "71531T": "pershing-square-usa", "812215": "seaport-entertainment",
    "42806J": "hertz", "02079K": "alphabet", "169656": "chipotle", "43300A": "hilton", "037833": "apple",
    "88160R": "tesla", "67066G": "nvidia",
}


def text(node, path, ns):
    found = node.find(path, ns)
    return found.text.strip() if found is not None and found.text else None


def parse_cover(path: Path) -> dict:
    raw = path.read_text()

    def tag(name):
        match = re.search(rf"<(?:\w+:)?{name}>([^<]*)<", raw)
        return match.group(1).strip() if match else None

    others = []
    for block in re.findall(r"<(?:\w+:)?otherManager2>(.*?)</(?:\w+:)?otherManager2>", raw, re.S):
        def inner(name, block=block):
            match = re.search(rf"<(?:\w+:)?{name}>([^<]*)<", block)
            return match.group(1).strip() if match else None
        others.append({"sequence": int(inner("sequenceNumber") or 0), "name": inner("name"), "cik": inner("cik")})
    notice = []
    for block in re.findall(r"<(?:\w+:)?otherManager>(.*?)</(?:\w+:)?otherManager>", raw, re.S):
        match = re.search(r"<(?:\w+:)?name>([^<]*)<", block)
        cik = re.search(r"<(?:\w+:)?cik>([^<]*)<", block)
        if match:
            notice.append({"name": match.group(1).strip(), "cik": cik.group(1).strip() if cik else None})
    total = tag("tableValueTotal")
    entries = tag("tableEntryTotal")
    return {
        "reportType": tag("reportType"),
        "period": tag("periodOfReport"),
        "manager": tag("name"),
        "declaredTotalUsd": int(total) if total is not None else None,
        "declaredEntries": int(entries) if entries is not None else None,
        "otherManagers": sorted(others, key=lambda o: o["sequence"]),
        "noticeManagers": notice,
    }


def parse_table(path: Path) -> list[dict]:
    root = ET.parse(path).getroot()
    ns = {"n": root.tag.split("}")[0].strip("{")}
    rows = []
    for item in root.findall("n:infoTable", ns):
        rows.append({
            "issuer": text(item, "n:nameOfIssuer", ns),
            "title": text(item, "n:titleOfClass", ns),
            "cusip": text(item, "n:cusip", ns).upper(),
            "value": int(text(item, "n:value", ns)),
            "shares": int(text(item, "n:shrsOrPrnAmt/n:sshPrnamt", ns)),
            "shareType": text(item, "n:shrsOrPrnAmt/n:sshPrnamtType", ns),
            "putCall": text(item, "n:putCall", ns),
        })
    return rows


def mmddyyyy(value: str) -> str:
    month, day, year = value.split("-")
    return f"{year}-{month}-{day}"


def quarter_key(period: str) -> str:
    year, month, _ = period.split("-")
    return f"{year}-q{(int(month) - 1) // 3 + 1}"


def build_fund(slug: str, spec: dict, fixtures: Path) -> dict:
    edgar = fixtures / spec["fixture"] / "edgar"
    manifest = json.loads((edgar / "manifest.json").read_text())
    by_url = {meta["url"]: edgar / name for name, meta in manifest.items()}
    fetched = sorted(meta["fetched_at"] for meta in manifest.values())

    filings = []  # every 13F filing of the fund's filers for the tracked periods
    for cik in spec["ciks"]:
        subs = json.loads(by_url[f"https://data.sec.gov/submissions/CIK{cik}.json"].read_text())
        recent = subs["filings"]["recent"]
        for accession, form, filed, period in zip(recent["accessionNumber"], recent["form"], recent["filingDate"],
                                                 recent["reportDate"]):
            if not form.startswith("13F") or period not in spec["periods"]:
                continue
            base = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession.replace('-', '')}/"
            primary = by_url.get(base + "primary_doc.xml")
            table_url = next((u for u in by_url if u.startswith(base) and u.endswith(".xml")
                              and not u.endswith("primary_doc.xml")), None)
            if primary is None:
                raise SystemExit(f"{accession}: primary_doc.xml is not in the saved EDGAR responses")
            cover = parse_cover(primary)
            filings.append({
                "accession": accession,
                "form": form,
                "reportType": cover["reportType"],
                "filerName": subs["name"] if cover["manager"] is None else cover["manager"],
                "cik": cik,
                "periodOfReport": period,
                "filedAt": filed,
                "declaredTotalUsd": cover["declaredTotalUsd"],
                "declaredEntries": cover["declaredEntries"],
                "otherManagers": [o for o in cover["otherManagers"] if o["name"]],
                "noticeManagers": cover["noticeManagers"],
                "urls": {
                    "index": base + f"{accession}-index.htm",
                    "primaryDoc": base + "primary_doc.xml",
                    **({"infoTable": table_url} if table_url else {}),
                },
                "_table": by_url.get(table_url) if table_url else None,
            })

    quarters = []
    for period in spec["periods"]:
        here = sorted((f for f in filings if f["periodOfReport"] == period), key=lambda f: (f["filedAt"], f["accession"]))
        if any(f["form"].endswith("/A") for f in here):
            raise SystemExit(f"{slug} {period}: amendments are not handled by this builder")
        reports = [f for f in here if f["form"] == "13F-HR"]
        notices = [f for f in here if f["form"] == "13F-NT"]
        rows, placeholders = [], 0
        for report in reports:
            table_rows = parse_table(report["_table"])
            if len(table_rows) != report["declaredEntries"]:
                raise SystemExit(f"{report['accession']}: {len(table_rows)} rows, cover says {report['declaredEntries']}")
            if sum(r["value"] for r in table_rows) != report["declaredTotalUsd"]:
                raise SystemExit(f"{report['accession']}: rows do not sum to the cover-page total")
            for row in table_rows:
                if row["value"] == 0 and row["shares"] == 0 and set(row["cusip"]) <= {"0"}:
                    placeholders += 1
                    continue
                rows.append({**row, "accession": report["accession"]})
        groups: dict[str, list[dict]] = {}
        excluded = []
        for row in rows:
            if row["putCall"] or (row["shareType"] or "SH") != "SH":
                excluded.append(row)
                continue
            groups.setdefault(row["cusip"][:6], []).append(row)
        if excluded:
            raise SystemExit(f"{slug} {period}: option or principal-amount rows need a reviewed display first")
        holdings = []
        for key6, group in groups.items():
            if key6 not in ISSUERS:
                raise SystemExit(f"{slug} {period}: issuer {key6} ({group[0]['issuer']}) has no company slug")
            classes: dict[str, dict] = {}
            for row in group:
                item = classes.setdefault(row["cusip"], {"cusip": row["cusip"], "titleOfClass": row["title"],
                                                         "valueUsd": 0, "shares": 0})
                item["valueUsd"] += row["value"]
                item["shares"] += row["shares"]
            biggest = max(group, key=lambda r: r["value"])
            holdings.append({
                "cusip6": key6,
                "issuer": biggest["issuer"],
                "company": ISSUERS[key6],
                "valueUsd": sum(r["value"] for r in group),
                "shares": sum(r["shares"] for r in group),
                "rows": len(group),
                "classes": sorted(classes.values(), key=lambda c: -c["valueUsd"]),
            })
        holdings.sort(key=lambda h: (-h["valueUsd"], h["issuer"]))
        quarters.append({
            "quarter": quarter_key(period),
            "periodOfReport": period,
            "reports": [{k: v for k, v in r.items() if not k.startswith("_") and k != "noticeManagers"} for r in reports],
            "notices": [{k: v for k, v in n.items() if k in ("accession", "form", "filerName", "cik", "periodOfReport",
                                                              "filedAt", "noticeManagers", "urls")} for n in notices],
            "placeholderRows": placeholders,
            "holdings": holdings,
        })
    return {"slug": slug, "secRetrievedAt": fetched[-1], "quarters": quarters}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixtures", type=Path, required=True)
    args = parser.parse_args()
    for slug, spec in FUNDS.items():
        data = build_fund(slug, spec, args.fixtures)
        path = OUT / "filings" / f"{slug}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"wrote {path.relative_to(OUT)}: {len(data['quarters'])} quarters")


if __name__ == "__main__":
    main()
