# ============================================================
# UniERP Symlink Fixer for Windows Host
# ============================================================
# Replaces container-written relative symlinks (with forward slashes)
# with Windows-native Directory Junctions pointing to absolute paths.
# ============================================================

$packages = @{
  "auth"      = "packages/auth"
  "config"    = "packages/config"
  "database"  = "packages/database"
  "shared"    = "packages/shared"
  "framework" = "packages/framework"
  "ui"        = "packages/ui"
}

$locations = @(
  "apps/api/node_modules/@unerp",
  "apps/web/node_modules/@unerp",
  "packages/auth/node_modules/@unerp",
  "packages/database/node_modules/@unerp",
  "packages/shared/node_modules/@unerp",
  "packages/framework/node_modules/@unerp",
  "packages/ui/node_modules/@unerp"
)

Write-Host "Starting symlink repair on Windows host..." -ForegroundColor Cyan

foreach ($loc in $locations) {
  if (Test-Path $loc) {
    Write-Host "Repairing links in: $loc" -ForegroundColor Yellow
    foreach ($pkg in $packages.Keys) {
      $linkPath = Join-Path $loc $pkg
      
      # Determine if the target package folder actually exists
      $targetRelPath = $packages[$pkg]
      $targetAbsPath = Resolve-Path $targetRelPath -ErrorAction SilentlyContinue
      
      if ($targetAbsPath) {
        # If the link already exists (either as a file or folder), remove it first
        if (Test-Path $linkPath) {
          # Use cmd /c rmdir or Remove-Item to delete the reparse point
          # Windows has strict locks; rmdir is safest for junctions
          cmd /c "rmdir `"$linkPath`"" 2>$null
          Remove-Item -Path $linkPath -Force -ErrorAction SilentlyContinue
        }
        
        # Create a native Windows directory junction
        Write-Host "  -> Linking @unerp/$pkg to $targetRelPath"
        New-Item -ItemType Junction -Path $linkPath -Target $targetAbsPath.Path | Out-Null
      }
    }
  }
}

Write-Host "Symlink repair complete! You can now run build and test commands on the host." -ForegroundColor Green
