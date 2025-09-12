param([switch]$DryRun)

function Fix-MojibakeDeep([string]$s, [int]$rounds = 3) {
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
$skip    = '\\(node_modules|\.next|\.git)\\'

# Regex that finds typical mojibake WITHOUT using mojibake chars:
#   \u00C3 (Ã), \u00C2 (Â), sequences starting with \u00E2 (â) followed by 1–2 continuation bytes
$badPat  = '\u00C3|\u00C2|\u00E2[\u0080-\u00BF]{1,2}'

$scanned = 0; $fixed = 0

Get-ChildItem -Recurse -File -Include $targets |
  Where-Object { $_.FullName -notmatch $skip } |
  ForEach-Object {
    $scanned++
    $p   = $_.FullName
    $raw = Get-Content $p -Raw
    if ($raw -match $badPat) {
      $re = Fix-MojibakeDeep $raw 3
      if ($re -ne $raw) {
        if ($DryRun) {
          Write-Host "[DRY] would fix $p"
        } else {
          if (-not (Test-Path ($p + ".bak"))) { Copy-Item $p ($p + ".bak") }
          [IO.File]::WriteAllText($p, $re, (New-Object System.Text.UTF8Encoding $false))
          Write-Host "• fixed $p"
          $fixed++
        }
      }
    }
  }

Write-Host "Scanned $scanned file(s); fixed $fixed file(s)."
