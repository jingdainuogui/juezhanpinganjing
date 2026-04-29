param(
  [string]$BilibiliUid = "689060205",
  [string]$DouyinHandle = "xhcynjh",
  [string]$DouyinSecUid = "MS4wLjABAAAAN7_ojbX4gwxLwND8g08YulTwitH6n34NiV7yOtN5yQo"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $root "data\fans.json"
$jsDataPath = Join-Path $root "data\fans.js"

$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36"

function Get-BilibiliFollowers {
  param([string]$Uid)

  $url = "https://api.bilibili.com/x/relation/stat?vmid=$Uid"
  $response = & curl.exe -s -L -H "User-Agent: $userAgent" $url

  if (-not $response) {
    throw "Bilibili returned an empty response."
  }

  $json = $response | ConvertFrom-Json

  if ($json.code -ne 0) {
    throw "Bilibili API returned code $($json.code)."
  }

  return [int]$json.data.follower
}

function Get-DouyinFollowers {
  param([string]$Handle)

  $url = "https://www.iesdouyin.com/web/api/v2/user/info/?sec_uid=$DouyinSecUid"

  for ($i = 1; $i -le 3; $i++) {

    $response = & curl.exe -s -L `
      -H "User-Agent: $userAgent" `
      -H "Referer: https://www.douyin.com/user/$DouyinSecUid" `
      -H "Accept: application/json, text/plain, */*" `
      $url

    if (-not $response) {
      continue
    }

    $start = $response.IndexOf("{")
    if ($start -lt 0) {
      continue
    }

    $jsonStr = $response.Substring($start)

 
    try {
      $json = $jsonStr | ConvertFrom-Json
    } catch {
      continue
    }

    $count = $json.user_info.mplatform_followers_count

    if ($null -ne $count) {
      return @{
        followers = [int]$count
        displayText = ([int]$count).ToString("N0")
        note = "ok"
      }
    }

    Start-Sleep -Seconds 2
  }

  return @{
    followers = $null
    displayText = "Pending"
    note = "fetch failed"
  }
}
$oldData = $null
if (Test-Path $dataPath) {
  try {
    $oldData = Get-Content $dataPath -Raw | ConvertFrom-Json
  } catch {}
}
$bilibiliFollowers = Get-BilibiliFollowers -Uid $BilibiliUid
$douyinData = Get-DouyinFollowers -Handle $DouyinHandle

if ($douyinData.followers -eq $null -and $oldData) {
  $douyinData = @{
    followers = $oldData.platforms.douyin.followers
    displayText = $oldData.platforms.douyin.displayText
    note = "fallback"
  }
}

$payload = [ordered]@{
  lastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm")
  platforms = [ordered]@{
    bilibili = [ordered]@{
      followers = $bilibiliFollowers
      displayText = $bilibiliFollowers.ToString("N0")
      source = "uid: $BilibiliUid"
    }
    douyin = [ordered]@{
      followers = $douyinData.followers
      displayText = $douyinData.displayText
      source = "handle: $DouyinHandle"
      note = $douyinData.note
      secUid = $DouyinSecUid
      shareUrl = "https://v.douyin.com/4Tc5aBTnxho/"
    }
  }
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $dataPath -Encoding UTF8

$jsContent = "window.FANS_DATA = " + ($payload | ConvertTo-Json -Depth 6 -Compress) + ";"
$jsContent | Set-Content -Path $jsDataPath -Encoding UTF8

Write-Output "Fans data updated at $($payload.lastUpdated)"