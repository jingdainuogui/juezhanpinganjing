$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $root "ss"
$targetPath = Join-Path $root "data\\gallery.js"

$images = Get-ChildItem -Path $sourceDir -File |
  Sort-Object Name |
  Select-Object -ExpandProperty Name

$content = "window.SHIKIGAMI_IMAGES = " + ($images | ConvertTo-Json -Compress) + ";"
$content | Set-Content -Path $targetPath -Encoding UTF8

Write-Output "Gallery manifest rebuilt with $($images.Count) images."
