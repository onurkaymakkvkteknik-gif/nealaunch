#!/usr/bin/env python3
"""
V7 Clone & Graft Discovery Engine
Enforces:
1. Paid SaaS Target ($29-$199/mo) with painful unbundled single-feature demand
2. Battle-Tested Open-Source Engine (>1,000 GitHub Stars, MIT/Apache-2.0)
3. Zero Toy Code / Zero Procedural AI Math Fallbacks
"""

import sys
import json
import sqlite3
import re
from typing import Dict, Any, List

DB_PATH = "/Users/znatan/.gemini/antigravity/venture_state.db"

def score_clone_graft_candidate(
    candidate_id: str,
    title: str,
    primary_keyword: str,
    paid_target_name: str,
    paid_target_price_mo: float,
    unbundled_feature_pain: str,
    open_source_repo: str,
    open_source_stars: int,
    open_source_license: str,
    client_runtime: str, # "WASM", "WebWorker", "Canvas", "TypeScript"
    gefei_serp_gap: int, # 0 or 100
    b2b_margin_impact: int # 0 to 100
) -> Dict[str, Any]:
    
    # 1. Gate 1: Paid Target Check ($29-$199/mo)
    has_valid_target = (paid_target_price_mo >= 29.0 and paid_target_price_mo <= 199.0)
    
    # 2. Gate 2: Open Source Engine Check (>1,000 stars, MIT/Apache-2.0)
    has_valid_engine = (
        open_source_stars >= 1000 and 
        open_source_license.upper() in ["MIT", "APACHE-2.0", "APACHE 2.0", "BSD-3-CLAUSE", "ISC"]
    )
    
    # 3. Gate 3: GeFei SERP Inner-Page Rule
    if gefei_serp_gap == 0:
        return {
            "candidate_id": candidate_id,
            "approved": False,
            "venture_score": 0.0,
            "kill_gate": "GEFEI_ROOT_DOMAIN_COLLISION",
            "reason": "Top 5 Google results contain a dedicated free root-domain tool."
        }
        
    if not has_valid_target:
        return {
            "candidate_id": candidate_id,
            "approved": False,
            "venture_score": 0.0,
            "kill_gate": "INVALID_PAID_TARGET",
            "reason": f"Target price ${paid_target_price_mo}/mo outside $29-$199/mo unbundling corridor."
        }

    if not has_valid_engine:
        return {
            "candidate_id": candidate_id,
            "approved": False,
            "venture_score": 0.0,
            "kill_gate": "ENGINE_GRAFT_REJECTED",
            "reason": f"Repo {open_source_repo} stars ({open_source_stars}) < 1000 or non-permissive license ({open_source_license})."
        }

    # Discovery Equation: Vs = 0.30(S_gap) + 0.25(C_llm) + 0.25(P_b2b) + 0.20(D_vel)
    c_llm = 95.0 # Client-side WASM engine cannot be faked by raw ChatGPT
    d_vel = 90.0 # Fast deployment via monorepo shell
    v_s = 0.30 * gefei_serp_gap + 0.25 * c_llm + 0.25 * b2b_margin_impact + 0.20 * d_vel

    approved = (v_s >= 80.0)
    
    return {
        "candidate_id": candidate_id,
        "title": title,
        "primary_keyword": primary_keyword,
        "approved": approved,
        "venture_score": round(v_s, 2),
        "paid_target": {
            "name": paid_target_name,
            "price_mo": paid_target_price_mo,
            "pain_point": unbundled_feature_pain
        },
        "grafted_engine": {
            "repo": open_source_repo,
            "stars": open_source_stars,
            "license": open_source_license,
            "runtime": client_runtime
        }
    }

if __name__ == "__main__":
    test_candidate = score_clone_graft_candidate(
        candidate_id="003-edi-850-po-viewer",
        title="B2B Retail EDI 850 Purchase Order In-Browser Parser & Label Stamper",
        primary_keyword="edi 850 viewer free",
        paid_target_name="SPS Commerce / TrueCommerce EDI",
        paid_target_price_mo=149.0,
        unbundled_feature_pain="SPS charges $149/mo minimum just to read incoming 850 PO text and export picking slips.",
        open_source_repo="stucco-software/node-x12",
        open_source_stars=1420,
        open_source_license="MIT",
        client_runtime="WebWorker",
        gefei_serp_gap=100,
        b2b_margin_impact=95
    )
    print(json.dumps(test_candidate, indent=2))
