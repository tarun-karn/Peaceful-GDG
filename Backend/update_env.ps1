$path = "d:/Hacknova/MindMate/Backend/.env"
$key = "GEMINI_KEY"
$val = "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"

if (-not (Test-Path $path)) {
    # If .env doesn't exist, create it
    Set-Content -Path $path -Value "$key=$val"
    Write-Host "Created .env with $key"
} else {
    # If .env exists, read and update/append
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
    Write-Host "Updated $key in .env"
}
