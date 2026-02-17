param(
  [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"

function Invoke-RateTest {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$false)][string]$JsonBody,
    [int]$Count = 15,
    [int]$TimeoutSec = 10
  )

  Write-Host "Testing: $Method $Url ($Count requests)" -ForegroundColor Cyan

  for ($i=1; $i -le $Count; $i++) {
    try {
      if ($JsonBody) {
        $resp = Invoke-WebRequest -Uri $Url -Method $Method -ContentType "application/json" -Body $JsonBody -TimeoutSec $TimeoutSec
      } else {
        $resp = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec $TimeoutSec
      }

      $remaining = $resp.Headers["X-RateLimit-Remaining"]
      $limit = $resp.Headers["X-RateLimit-Limit"]
      "$i -> $($resp.StatusCode) Limit=$limit Remaining=$remaining"
    } catch {
      $r = $_.Exception.Response
      if ($null -eq $r) {
        "$i -> ERROR $($_.Exception.Message)"
        continue
      }

      $statusCode = $r.StatusCode.value__
      $retryAfter = $r.Headers["Retry-After"]
      $remaining = $r.Headers["X-RateLimit-Remaining"]
      $limit = $r.Headers["X-RateLimit-Limit"]

      "$i -> $statusCode Retry-After=$retryAfter Limit=$limit Remaining=$remaining"
    }
  }

  Write-Host "" 
}

# 1) Quick sanity: server health
try {
  $health = Invoke-RestMethod "$BaseUrl/api/health" -TimeoutSec 10
  Write-Host "Health: $($health.status)" -ForegroundColor Green
} catch {
  Write-Host "Health check failed. Is the server running on $BaseUrl ?" -ForegroundColor Red
  throw
}

# 2) Attendance scan (strict limiter: 10/min per ip+email+eventId)
$scanUrl = "$BaseUrl/api/participant/attendance/scan"
$scanBody = @{ eventId = "bad"; email = "test@example.com"; sessionId = "x" } | ConvertTo-Json
Invoke-RateTest -Method "POST" -Url $scanUrl -JsonBody $scanBody -Count 15

# 3) Public certificate verify (looser limiter: 60/min per ip)
$verifyUrl = "$BaseUrl/api/verify/aaaaaaaaaa"  # 10 chars (passes basic validation)
Invoke-RateTest -Method "GET" -Url $verifyUrl -Count 80
