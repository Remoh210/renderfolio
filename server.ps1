$port = 8000

function Test-Command($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  return $null -ne $cmd
}

Write-Host "Serving on http://localhost:$port"

if (Test-Command "python") {
  python -m http.server $port
  exit $LASTEXITCODE
}

if (Test-Command "py") {
  py -3 -m http.server $port
  exit $LASTEXITCODE
}

if (Test-Command "npx") {
  npx serve . -l $port
  exit $LASTEXITCODE
}

Write-Host "No server found. Install Python or Node (npx), then rerun."
exit 1