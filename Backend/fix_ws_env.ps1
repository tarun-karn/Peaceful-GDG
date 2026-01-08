$path = "d:/Hacknova/MindMate/Backend/.env"
$key = "WEBSOCKET_SERVER"
$val = "ws://localhost:8802"

if (-not (Test-Path $path)) {
    Set-Content -Path $path -Value "$key=$val"
} else {
    $content = Get-Content $path
    $found = $false
    $newContent = @()
    
    foreach ($line in $content) {
        if ($line -match "^$key=") {
            $newContent += "$key=$val"
            $found = $true
        } else {
            $newContent += $line
        }
    }
    
    if (-not $found) {
        $newContent += "$key=$val"
    }
    
    $newContent | Set-Content $path
    Write-Host "Fixed $key in .env"
}
