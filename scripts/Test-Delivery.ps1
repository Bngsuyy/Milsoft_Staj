[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$apiProject = Join-Path $repositoryRoot 'Backend\TaskManagement.API\TaskManagement.API.csproj'
$testProject = Join-Path $repositoryRoot 'Backend\TaskManagement.API.Tests\TaskManagement.API.Tests.csproj'
$frontendRoot = Join-Path $repositoryRoot 'Frontend\TaskManagement.Web'

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        [Parameter(Mandatory)]
        [scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name başarısız oldu (çıkış kodu: $LASTEXITCODE)."
    }
}

function Get-VulnerabilityCount {
    param([object]$Value)

    if ($null -eq $Value -or $Value -is [string] -or $Value.GetType().IsPrimitive) {
        return 0
    }

    $count = 0
    foreach ($property in $Value.PSObject.Properties) {
        if ($property.Name -eq 'vulnerabilities') {
            $count += @($property.Value).Count
            continue
        }

        if ($property.Value -is [System.Collections.IEnumerable] -and $property.Value -isnot [string]) {
            foreach ($item in $property.Value) {
                $count += Get-VulnerabilityCount -Value $item
            }
        }
        else {
            $count += Get-VulnerabilityCount -Value $property.Value
        }
    }

    return $count
}

Push-Location $repositoryRoot
try {
    Invoke-CheckedCommand 'Depodaki gizli bilgiler' {
        & (Join-Path $repositoryRoot 'scripts\Test-TrackedSecrets.ps1')
    }

    Invoke-CheckedCommand 'Backend testleri' {
        dotnet test $testProject --nologo --verbosity minimal
    }

    Invoke-CheckedCommand 'Backend Release derlemesi' {
        dotnet build $apiProject -c Release --no-restore --nologo
    }

    $previousJwtKey = $env:JwtSettings__SecretKey
    try {
        $env:JwtSettings__SecretKey = 'delivery-check-only-secret-key-at-least-32-bytes'
        Invoke-CheckedCommand 'EF migration modeli' {
            dotnet ef migrations has-pending-model-changes --project $apiProject --no-build
        }
    }
    finally {
        $env:JwtSettings__SecretKey = $previousJwtKey
    }

    Write-Host "`n==> NuGet güvenlik taraması" -ForegroundColor Cyan
    $auditOutput = dotnet list $apiProject package --vulnerable --include-transitive --format json
    if ($LASTEXITCODE -ne 0) {
        throw "NuGet güvenlik taraması çalıştırılamadı (çıkış kodu: $LASTEXITCODE)."
    }

    $audit = $auditOutput | Out-String | ConvertFrom-Json
    $vulnerabilityCount = Get-VulnerabilityCount -Value $audit
    if ($vulnerabilityCount -gt 0) {
        throw "NuGet güvenlik taraması $vulnerabilityCount açık buldu."
    }
    Write-Host 'NuGet güvenlik taraması temiz.' -ForegroundColor Green

    Push-Location $frontendRoot
    try {
        Invoke-CheckedCommand 'Frontend temiz kurulumu' { npm ci }
        Invoke-CheckedCommand 'Frontend testleri' { npm run test }
        Invoke-CheckedCommand 'Frontend lint' { npm run lint }
        Invoke-CheckedCommand 'Frontend production build' { npm run build }
        Invoke-CheckedCommand 'npm production güvenlik taraması' { npm audit --omit=dev }
    }
    finally {
        Pop-Location
    }

    Write-Host "`nTüm teslim kontrolleri başarılı." -ForegroundColor Green
}
finally {
    Pop-Location
}
