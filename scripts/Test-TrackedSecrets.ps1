[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-IsPlaceholder {
    param([string]$Value)

    $candidate = $Value.Trim()
    return [string]::IsNullOrWhiteSpace($candidate) `
        -or $candidate -eq '...' `
        -or $candidate -match '^(?:YOUR_|CHANGE_|REPLACE_|EXAMPLE_|EN_AZ_)' `
        -or $candidate -match '^<[^>]+>$' `
        -or $candidate -match '^\$\{[^}]+\}$'
}

$textExtensions = @(
    '.cs', '.csproj', '.env', '.http', '.js', '.json', '.md', '.ps1', '.props',
    '.sh', '.sql', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml'
)

$trackedFiles = & git -C $RepositoryRoot ls-files --cached --others --exclude-standard
if ($LASTEXITCODE -ne 0) {
    throw 'İzlenen dosyalar Git üzerinden okunamadı.'
}

$findings = [System.Collections.Generic.List[object]]::new()
$structuredSecretPattern = '(?i)"(?:SecretKey|SigningKey|ClientSecret|ApiKey|AccessKey)"\s*:\s*"(?<value>[^"]+)"'
$connectionPasswordPattern = '(?i)(?:Password|Pwd)\s*=\s*(?<value>[^;"''\s]+)'
$knownTokenPatterns = @(
    @{ Name = 'GitHub token'; Pattern = 'github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}' },
    @{ Name = 'AWS access key'; Pattern = 'AKIA[0-9A-Z]{16}' },
    @{ Name = 'JWT'; Pattern = 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' },
    @{ Name = 'Private key'; Pattern = ('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?PRIVATE KEY-----') }
)

foreach ($relativePath in $trackedFiles) {
    $fullPath = Join-Path $RepositoryRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        continue
    }

    $extension = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $fileName = [IO.Path]::GetFileName($fullPath)
    if ($textExtensions -notcontains $extension -and $fileName -notmatch '^\.env(?:\.|$)') {
        continue
    }

    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $fullPath) {
        $lineNumber++

        $structuredMatch = [regex]::Match($line, $structuredSecretPattern)
        if ($structuredMatch.Success -and -not (Test-IsPlaceholder $structuredMatch.Groups['value'].Value)) {
            $findings.Add([pscustomobject]@{
                Path = $relativePath
                Line = $lineNumber
                Rule = 'Non-empty structured secret'
            })
        }

        $passwordMatch = [regex]::Match($line, $connectionPasswordPattern)
        if ($passwordMatch.Success -and -not (Test-IsPlaceholder $passwordMatch.Groups['value'].Value)) {
            $findings.Add([pscustomobject]@{
                Path = $relativePath
                Line = $lineNumber
                Rule = 'Connection-string password'
            })
        }

        foreach ($tokenRule in $knownTokenPatterns) {
            if ($line -match $tokenRule.Pattern) {
                $findings.Add([pscustomobject]@{
                    Path = $relativePath
                    Line = $lineNumber
                    Rule = $tokenRule.Name
                })
            }
        }
    }
}

if ($findings.Count -gt 0) {
    Write-Error 'Olası gizli bilgiler bulundu. Değerler güvenlik nedeniyle gösterilmiyor.'
    $findings | Sort-Object Path, Line, Rule | Format-Table -AutoSize
    exit 1
}

Write-Output ("Secret guard passed: {0} repository files checked." -f $trackedFiles.Count)
