$lines = Get-Content -Path "script.js" -Encoding UTF8

$newLines = @()
$skip = $false

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -eq 3523) {
        $skip = $true
    }
    
    if (-not $skip) {
        $newLines += $lines[$i]
    }

    if ($i -eq 3554) {
        $skip = $false
    }
}

$newLines | Set-Content -Path "script.js" -Encoding UTF8
Write-Host "Lines 3524-3555 deleted."
