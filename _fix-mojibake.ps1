# --- Fix mojibake by re-encoding as if mis-decoded CP1252; only write if content changes ---

function Fix-MojibakeDeep([string]$s, [int]$rounds=3) {
  $cur = $s
  for ($i=0; $i -lt $rounds; $i++) {
    $bytes = [Text.Encoding]::GetEncoding(1252).GetBytes($cur)
    $next  = [Text.Encoding]::UTF8.GetString($bytes)
    if ($next -eq $cur) { break }
    $cur = $next
  }
  return $cur
}

$targets = @("*.tsx","*.ts","*.jsx","*.js","*.json","*.md","*.html","*.css")
$scan=0; $fixed=0

Get-ChildItem -Recurse -File -Include $targets |
  Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git)\\' } |
  ForEach-Object {
    $scan++
    $p = $_.FullName
    $raw = Get-Content $p -Raw
    $re  = Fix-MojibakeDeep $raw 3
    if ($re -ne $raw) {
      if (-not (Test-Path ($p + ".bak"))) { Copy-Item $p ($p + ".bak") }
      [IO.File]::WriteAllText($p, $re, (New-Object System.Text.UTF8Encoding $false))
      Write-Host "• fixed $p"
      $fixed++
    }
  }

Write-Host "Scanned $scan file(s); fixed $fixed file(s)."

# Restart Next dev if anything is listening on :3000
$pidOn3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
             Select-Object -ExpandProperty OwningProcess -Unique
if ($pidOn3000) { foreach ($p in $pidOn3000) { try { Stop-Process -Id $p -Force } catch {} } }
Start-Sleep -Seconds 1
npm run dev
