# Sequential test runner to bypass Node worker memory leaks
$ErrorActionPreference = "Stop"
$files = Get-ChildItem -Path "src" -Filter "*.spec.ts" -Recurse

Write-Host "Found $($files.Count) test files."
$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace("C:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\api\", "")
    Write-Host "==> Running test: $relativePath"
    
    # Run vitest on single file
    npx cross-env NEXTAUTH_SECRET=test_secret_for_vitest_unit_runs NODE_OPTIONS=--max-old-space-size=4096 vitest run "$relativePath"
    
    if ($LASTEXITCODE -eq 0) {
        $successCount++
    } else {
        $failCount++
        Write-Error "Test failed: $relativePath"
        exit 1
    }
}

Write-Host "All tests completed successfully: $successCount passed."
