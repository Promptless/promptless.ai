#!/usr/bin/env python3
"""Grade generate-article skill eval outputs."""
import json
import os
import re
import sys

def count_words(text):
    """Count words in the article body (excluding frontmatter and imports)."""
    # Remove frontmatter
    parts = text.split('---', 2)
    if len(parts) >= 3:
        body = parts[2]
    else:
        body = text
    # Remove import lines
    body = re.sub(r'^import .*$', '', body, flags=re.MULTILINE)
    # Remove component tags
    body = re.sub(r'<[^>]+/>', '', body)
    # Count words
    words = body.split()
    return len(words)

def grade_article(filepath):
    """Grade a single article against assertions. Returns list of {text, passed, evidence}."""
    with open(filepath, 'r') as f:
        content = f.read()

    results = []

    # 1. Complete frontmatter
    fm_fields = ['title:', 'subtitle:', 'description:', 'date:', 'author:', 'section:', 'hidden:']
    missing = [f for f in fm_fields if f not in content]
    results.append({
        "text": "has_complete_frontmatter",
        "passed": len(missing) == 0,
        "evidence": f"All fields present" if not missing else f"Missing: {', '.join(missing)}"
    })

    # 2. Imports components
    has_newsletter_import = "import BlogNewsletterCTA from" in content
    has_demo_import = "import BlogRequestDemo from" in content
    results.append({
        "text": "imports_components",
        "passed": has_newsletter_import and has_demo_import,
        "evidence": f"Newsletter import: {has_newsletter_import}, Demo import: {has_demo_import}"
    })

    # 3. Uses BlogNewsletterCTA
    has_cta = "<BlogNewsletterCTA />" in content
    results.append({
        "text": "uses_newsletter_cta",
        "passed": has_cta,
        "evidence": "Found <BlogNewsletterCTA />" if has_cta else "Missing <BlogNewsletterCTA />"
    })

    # 4. Uses BlogRequestDemo
    has_demo = "<BlogRequestDemo />" in content
    results.append({
        "text": "ends_with_request_demo",
        "passed": has_demo,
        "evidence": "Found <BlogRequestDemo />" if has_demo else "Missing <BlogRequestDemo />"
    })

    # 5. Hidden is true
    has_hidden_true = "hidden: true" in content
    results.append({
        "text": "hidden_is_true",
        "passed": has_hidden_true,
        "evidence": "hidden: true found" if has_hidden_true else "hidden: true NOT found (may be hidden: false)"
    })

    # 6. No em dashes
    # Get body text only (after frontmatter)
    parts = content.split('---', 2)
    body = parts[2] if len(parts) >= 3 else content
    em_dash_count = body.count('\u2014')  # — character
    results.append({
        "text": "no_em_dashes",
        "passed": em_dash_count == 0,
        "evidence": f"Found {em_dash_count} em dashes" if em_dash_count > 0 else "No em dashes found"
    })

    # 7. Word count >= 800
    wc = count_words(content)
    results.append({
        "text": "word_count_800_plus",
        "passed": wc >= 800,
        "evidence": f"Word count: {wc}"
    })

    # 8. Word count <= 1400
    results.append({
        "text": "word_count_1400_max",
        "passed": wc <= 1400,
        "evidence": f"Word count: {wc}"
    })

    # 9. Author is Frances
    has_author = "author: Frances" in content
    results.append({
        "text": "author_is_frances",
        "passed": has_author,
        "evidence": "author: Frances found" if has_author else "author: Frances NOT found"
    })

    # Extra: check for tricolon patterns (informational, not a hard pass/fail)
    # Look for "X, Y, and Z" patterns in the body
    tricolon_matches = re.findall(r'\b\w+,\s+\w+,\s+and\s+\w+\b', body)
    if tricolon_matches:
        results.append({
            "text": "tricolon_check_info",
            "passed": len(tricolon_matches) <= 2,  # Allow a couple
            "evidence": f"Found {len(tricolon_matches)} potential tricolons: {tricolon_matches[:3]}"
        })

    return results, wc

def main():
    base = "/Users/user/src/docs/generate-article-workspace/iteration-1"
    evals = [
        ("specific-keyword-documentation-debt", "with_skill"),
        ("specific-keyword-documentation-debt", "without_skill"),
        ("random-keyword-selection", "with_skill"),
        ("random-keyword-selection", "without_skill"),
    ]

    for eval_name, variant in evals:
        article_path = os.path.join(base, eval_name, variant, "outputs", "article.mdx")
        grading_path = os.path.join(base, eval_name, variant, "grading.json")

        if not os.path.exists(article_path):
            print(f"SKIP: {eval_name}/{variant} - no article found")
            continue

        results, wc = grade_article(article_path)
        passed = sum(1 for r in results if r["passed"])
        total = len(results)

        grading = {
            "eval_name": eval_name,
            "variant": variant,
            "word_count": wc,
            "expectations": results,
            "summary": f"{passed}/{total} assertions passed"
        }

        with open(grading_path, 'w') as f:
            json.dump(grading, f, indent=2)

        status = "PASS" if passed == total else "MIXED"
        print(f"{status}: {eval_name}/{variant} - {passed}/{total} ({wc} words)")
        for r in results:
            icon = "  ✓" if r["passed"] else "  ✗"
            print(f"  {icon} {r['text']}: {r['evidence']}")
        print()

if __name__ == "__main__":
    main()
