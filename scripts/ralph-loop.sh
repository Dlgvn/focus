#!/bin/bash
# Ralph loop runner
# Usage: ./scripts/ralph-loop.sh [--max N]

MAX=20
while [[ $# -gt 0 ]]; do
  case $1 in
    --max) MAX="$2"; shift 2 ;;
    *) shift ;;
  esac
done

COUNT=0
while [ $COUNT -lt $MAX ]; do
  COUNT=$((COUNT + 1))
  echo ""
  echo "=== Ralph iteration $COUNT / $MAX ==="
  claude --continue --prompt "Read ralph/prompt.md and ralph/goals.json. Work the next pending goal."

  # Check if all goals are passed
  ALL_PASSED=$(python3 -c "
import json
data = json.load(open('ralph/goals.json'))
all_passed = all(g['status'] == 'passed' for g in data['goals'])
print('yes' if all_passed else 'no')
" 2>/dev/null)

  if [ "$ALL_PASSED" = "yes" ]; then
    echo ""
    echo "=== All goals passed! Loop complete. ==="
    exit 0
  fi

  echo "--- Waiting 5 seconds ---"
  sleep 5
done

echo "=== Reached max iterations ($MAX) ==="
