#!/usr/bin/env nu

# check .doc-detective/.env exists and has real values

let f = ".doc-detective/.env"

if not ($f | path exists) {
    error make {msg: $"($f): no such file; cp .doc-detective/.env.example ($f) and edit"}
}

let vars = (open $f
    | lines
    | where {|l| $l !~ '^\s*#' and $l =~ '='}
    | each {|l| $l | parse "{k}={v}" | get 0}
    | reduce -f {} {|it, acc| $acc | merge {($it.k): $it.v}}
)

for want in [PROMPTLESS_TEST_EMAIL PROMPTLESS_TEST_PASSWORD] {
    if $want not-in $vars {
        error make {msg: $"($f): ($want) not set"}
    }
    if ($vars | get $want) in ["" "your-test-user@example.com" "your-test-password"] {
        error make {msg: $"($f): ($want) still has placeholder value"}
    }
}

print "env ok"
