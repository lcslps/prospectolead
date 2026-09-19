$ErrorActionPreference = "Stop"

$profile = "C:\projetos\prospectolead\.browser-profile"
$port = 9222
$url = "http://localhost:5173/dashboard"

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) {
    throw "Chrome nao encontrado em: $($chromeCandidates -join ', ')"
}

$already = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $already) {
    $old = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like '*prospectolead\.browser-profile*' }
    foreach ($p in $old) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2

    Start-Process -FilePath $chrome -ArgumentList `
        "--user-data-dir=$profile", `
        "--remote-debugging-port=$port", `
        "--no-first-run", `
        "--no-default-browser-check", `
        $url

    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/version" -UseBasicParsing -TimeoutSec 2 | Out-Null
            break
        } catch {}
    }
}

$ok = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $ok) {
    throw "CDP não abriu na porta $port"
}

$tabs = (Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/list" -UseBasicParsing).Content | ConvertFrom-Json |
    Where-Object { $_.type -eq 'page' }

"CHROME_ABERTO"
"Perfil: $profile"
"CDP: http://127.0.0.1:$port"
$tabs | ForEach-Object { "ABA: $($_.title) | $($_.url)" }