#!/bin/bash
# Push environment variables from local config to Vercel for all environments with a strict timeout

KEYS=("DATABASE_URL" "AUTH_SECRET" "NEXTAUTH_URL" "GOOGLE_API_KEY" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")

export VERCEL_TELEMETRY_DISABLED=1
CLI="./node_modules/.bin/vercel"

# Timeout function using Perl alarm (exits after 15 seconds)
run_with_timeout() {
  perl -e '
    my $timeout = shift;
    local $SIG{ALRM} = sub { die "TIMEOUT\n" };
    alarm $timeout;
    my $pid = fork();
    if ($pid == 0) {
      exec @ARGV;
      die "exec failed: $!\n";
    }
    waitpid($pid, 0);
    alarm 0;
  ' 15 "$@"
}

# Read from .env.local
for key in "${KEYS[@]}"; do
  # Extract value from .env.local
  value=$(grep "^${key}=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  
  if [ -z "$value" ]; then
    echo "Warning: Key $key has no value in .env.local, skipping."
    continue
  fi

  echo "Adding $key to Vercel environments..."
  for env in production preview development; do
    echo " -> $env..."
    run_with_timeout $CLI env add "$key" "$env" --value "$value" --yes --force --non-interactive 2>&1
  done
done

echo "Done adding environment variables!"
