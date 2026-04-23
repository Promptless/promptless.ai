#!/usr/bin/env nu

# Visualize Doc Detective test results in a human-readable format.
# Usage:
#   nu scripts/dd-results.nu                          # latest results file
#   nu scripts/dd-results.nu <path-to-results.json>   # specific file

def main [file?: string] {
  let results_dir = ".doc-detective/results"

  let path = if $file != null {
    $file
  } else {
    # Pick the most recent results file by timestamp in filename
    let files = (glob $"($results_dir)/testResults-*.json" | sort)
    if ($files | is-empty) {
      print $"(ansi red_bold)No results files found in ($results_dir)(ansi reset)"
      exit 1
    }
    $files | last
  }

  let data = (open $path)

  # Extract epoch ms from filename and compute relative time
  let filename = ($path | path basename)
  let epoch_ms = ($filename | parse "testResults-{ts}.json" | get 0.ts | into int)
  let run_time = ($epoch_ms * 1_000_000 | into datetime) # ns -> datetime
  let ago = (date now) - $run_time
  let ago_str = (format_duration $ago)

  # Header
  print ""
  print $"(ansi white_bold)━━━ Doc Detective Results ━━━(ansi reset)"
  print $"(ansi white_dimmed)File: ($path)(ansi reset)"
  print $"(ansi white_dimmed)Run:  ($run_time | format date '%Y-%m-%d %H:%M:%S') (ansi yellow)\(($ago_str) ago\)(ansi reset)"
  print ""

  # Summary bar
  let s = $data.summary
  let total_steps = $s.steps.pass + $s.steps.fail + $s.steps.warning + $s.steps.skipped
  print $"(ansi white_bold)Summary(ansi reset)"
  print $"  Specs:  (pass_fail $s.specs.pass $s.specs.fail $s.specs.warning $s.specs.skipped)"
  print $"  Tests:  (pass_fail $s.tests.pass $s.tests.fail $s.tests.warning $s.tests.skipped)"
  print $"  Steps:  (pass_fail $s.steps.pass $s.steps.fail $s.steps.warning $s.steps.skipped)"
  print ""

  # Per-spec details
  for spec in $data.specs {
    let badge = (result_badge $spec.result)
    let rel = ($spec.specId)
    print $"(ansi white_bold)($badge) ($rel)(ansi reset)"

    for test in $spec.tests {
      let tbadge = (result_badge $test.result)
      print $"  ($tbadge) test: (ansi cyan)($test.testId)(ansi reset)"

      for ctx in $test.contexts {
        let browser = ($ctx.browser.name? | default "unknown")
        let platform = ($ctx.platform? | default "unknown")
        print $"    (ansi white_dimmed)($platform)/($browser)(ansi reset)"

        for step in $ctx.steps {
          let action = (step_action $step)
          if $step.result == "PASS" {
            print $"      ($action)"
          } else {
            let sbadge = (result_badge $step.result)
            let desc = ($step.resultDescription? | default "")
            print $"      ($sbadge) ($action)"
            if $desc != "" {
              print $"        (ansi yellow)→ ($desc)(ansi reset)"
            }
          }
        }
      }
    }
    print ""
  }

  # Files covered
  let spec_ids = ($data.specs | get specId)
  print $"(ansi white_bold)Files tested (($spec_ids | length)):(ansi reset)"
  for id in $spec_ids {
    print $"  • ($id)"
  }
  print ""

  # Warn if count seems low
  let mdx_count = (glob "src/content/docs/**/*.mdx" | length)
  if $mdx_count > ($spec_ids | length) {
    print $"(ansi yellow_bold)⚠ Only ($spec_ids | length) of ($mdx_count) .mdx files were tested.(ansi reset)"
    print $"(ansi yellow)  Check your .doc-detective.json 'input' array — only files listed there are scanned.(ansi reset)"
    print ""
  }
}

# Format a result badge with color
def result_badge [result: string]: nothing -> string {
  match $result {
    "PASS" => $"(ansi green_bold)✓ PASS(ansi reset)",
    "FAIL" => $"(ansi red_bold)✗ FAIL(ansi reset)",
    "WARNING" => $"(ansi yellow_bold)⚠ WARN(ansi reset)",
    "SKIPPED" => $"(ansi white_dimmed)○ SKIP(ansi reset)",
    _ => $"  ($result)"
  }
}

# Describe what a step does in a short string
def step_action [step: record]: nothing -> string {
  if ("goTo" in $step) {
    $"(ansi blue)goTo(ansi reset) ($step.goTo.url)"
  } else if ("find" in $step) {
    let target = if ($step.find | describe) == "string" {
      $step.find
    } else {
      ($step.find | to nuon)
    }
    $"(ansi magenta)find(ansi reset) \"($target)\""
  } else if ("click" in $step) {
    let target = if ($step.click | describe) == "string" {
      $step.click
    } else {
      ($step.click | to nuon)
    }
    $"(ansi magenta)click(ansi reset) \"($target)\""
  } else if ("checkLink" in $step) {
    $"(ansi blue)checkLink(ansi reset) ($step.checkLink.url)"
  } else if ("typeKeys" in $step) {
    $"(ansi magenta)typeKeys(ansi reset) ..."
  } else if ("wait" in $step) {
    $"(ansi white_dimmed)wait(ansi reset)"
  } else if ("saveScreenshot" in $step) {
    $"(ansi white_dimmed)screenshot(ansi reset)"
  } else if ("httpRequest" in $step) {
    let method = ($step.httpRequest.method? | default "GET")
    let url = ($step.httpRequest.url? | default "?")
    $"(ansi blue)httpRequest(ansi reset) ($method) ($url)"
  } else if ("runShell" in $step) {
    $"(ansi cyan)runShell(ansi reset)"
  } else if ("setVariables" in $step) {
    $"(ansi white_dimmed)setVariables(ansi reset)"
  } else {
    let keys = ($step | columns | where { |c| $c not-in ["stepId", "result", "resultDescription", "outputs"] })
    if ($keys | is-empty) {
      "(unknown step)"
    } else {
      ($keys | first)
    }
  }
}

# Format pass/fail/warn/skip counts
def pass_fail [pass: int, fail: int, warn: int, skip: int]: nothing -> string {
  let parts = [
    $"(ansi green)($pass) passed(ansi reset)",
    (if $fail > 0 { $"(ansi red_bold)($fail) failed(ansi reset)" } else { $"($fail) failed" }),
    (if $warn > 0 { $"(ansi yellow)($warn) warning(ansi reset)" } else { null }),
    (if $skip > 0 { $"(ansi white_dimmed)($skip) skipped(ansi reset)" } else { null }),
  ]
  $parts | compact | str join ", "
}

# Format a duration into a human-friendly relative string
def format_duration [d: duration]: nothing -> string {
  let total_sec = ($d / 1sec)
  if $total_sec < 60 {
    $"($total_sec | math round)s"
  } else if $total_sec < 3600 {
    let m = ($total_sec / 60 | math floor)
    $"($m)m"
  } else if $total_sec < 86400 {
    let h = ($total_sec / 3600 | math floor)
    let m = (($total_sec mod 3600) / 60 | math floor)
    if $m > 0 { $"($h)h ($m)m" } else { $"($h)h" }
  } else {
    let days = ($total_sec / 86400 | math floor)
    let h = (($total_sec mod 86400) / 3600 | math floor)
    if $h > 0 { $"($days)d ($h)h" } else { $"($days)d" }
  }
}
