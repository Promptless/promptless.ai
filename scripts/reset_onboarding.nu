#!/usr/bin/env nu

# Reset onboarding state for a given org_id in the customer_info table.
# Requires DATABASE_URL environment variable to be set.

def main [
    org_id: string  # The org_id to reset onboarding for (e.g. "org_xxxxx")
    --dry-run       # Print the SQL without executing
] {
    let db_url = ($env | get -i DATABASE_URL)
    if ($db_url == null or $db_url == "") {
        print -e "ERROR: DATABASE_URL environment variable is not set"
        exit 1
    }

    let sql = $"UPDATE customer_info SET onboarding_completed = false, onboarding_info = '{}'::jsonb WHERE org_id = '($org_id)';"

    if $dry_run {
        print "Would execute:"
        print $sql
        return
    }

    print $"Resetting onboarding state for ($org_id)..."

    let result = (psql $db_url -c $sql)
    print $result

    if ($result | str contains "UPDATE 0") {
        print -e $"WARNING: No rows updated — org_id '($org_id)' not found in customer_info"
        exit 1
    }

    print "Done."
}
