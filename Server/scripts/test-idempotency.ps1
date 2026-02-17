param(
  [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"

$uri = "$BaseUrl/api/participant/attendance/scan"
$key = [guid]::NewGuid().ToString()

# NOTE: This test demonstrates idempotency behavior (same Idempotency-Key).
# It does not require a valid event/session to show the mechanism; you can plug real values if you want.
$body = @{ eventId="bad"; email="test@example.com"; sessionId="x" } | ConvertTo-Json

Write-Host "Idempotency-Key: $key" -ForegroundColor Cyan

for ($i=1; $i -le 5; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri $uri -Method POST -ContentType "application/json" -Headers @{ "Idempotency-Key" = $key } -Body $body -TimeoutSec 10
    "$i -> $($resp.StatusCode) Remaining=$($resp.Headers['X-RateLimit-Remaining'])"
    $resp.Content
  } catch {
    $r = $_.Exception.Response
    if ($null -eq $r) {
      "$i -> ERROR $($_.Exception.Message)"
      continue
    }

    $statusCode = $r.StatusCode.value__
    $retryAfter = $r.Headers['Retry-After']
    "$i -> $statusCode Retry-After=$retryAfter Remaining=$($r.Headers['X-RateLimit-Remaining'])"

    try {
      $sr = New-Object System.IO.StreamReader($r.GetResponseStream())
      $sr.ReadToEnd()
    } catch {
      "(no body)"
    }
  }

  Start-Sleep -Milliseconds 200
}
