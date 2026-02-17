param(
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$EventId,
  [Parameter(Mandatory=$true)][string]$OrganizerId,
  [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"

# This script tests CERTIFICATE BULK GENERATION idempotency.
# Run the same request twice with the same Idempotency-Key.
# Expected:
# - First call: does the work (may take time)
# - Second call: returns the cached response OR 409 if first is still running

$key = [guid]::NewGuid().ToString()
$uri = "$BaseUrl/api/organizer/certificates/$EventId/generate"

$body = @{
  organizerId = $OrganizerId
  template = "default"
  achievement = "Participation"
} | ConvertTo-Json

Write-Host "Idempotency-Key: $key" -ForegroundColor Cyan
Write-Host "POST $uri" -ForegroundColor Cyan

function CallOnce($label) {
  Write-Host "\n--- $label ---" -ForegroundColor Yellow
  try {
    $resp = Invoke-WebRequest -Uri $uri -Method POST -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $Token"; "Idempotency-Key" = $key } -Body $body -TimeoutSec 120
    Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
    Write-Host "X-RateLimit-Remaining: $($resp.Headers['X-RateLimit-Remaining'])"
    $resp.Content
  } catch {
    $r = $_.Exception.Response
    if ($null -eq $r) {
      Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
      return
    }
    $statusCode = $r.StatusCode.value__
    $retryAfter = $r.Headers['Retry-After']
    Write-Host "Status: $statusCode Retry-After=$retryAfter" -ForegroundColor Red
    try {
      $sr = New-Object System.IO.StreamReader($r.GetResponseStream())
      $sr.ReadToEnd()
    } catch {
      "(no body)"
    }
  }
}

CallOnce "First call"
CallOnce "Second call (same key)"
