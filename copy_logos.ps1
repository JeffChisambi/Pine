# Run this script to copy all the company logos into the Pine app.
# Open a new PowerShell window and run: .\copy_logos.ps1

$src = "C:\Users\nick\Desktop\pine\attached_assets"
$dst = "C:\Users\nick\Desktop\pine\artifacts\Pine\assets\images"

$copies = @(
  @{ From = "BHL logo.png";                    To = "bhl.png" },
  @{ From = "FDHLogo_1782606637497.webp";      To = "fdh.webp" },
  @{ From = "icon-logo.png";                   To = "icon_logo.png" },
  @{ From = "ilovo.png";                       To = "illovo.png" },
  @{ From = "mpiko.jpg";                       To = "mpico.jpg" },
  @{ From = "nationalbanklogo_1782606637497.jpg"; To = "nationalbank.jpg" },
  @{ From = "nbs-banklogo_1782606637497.png";  To = "nbs.png" },
  @{ From = "nico.png";                        To = "nico.png" },
  @{ From = "nitl.png";                        To = "nitl.png" },
  @{ From = "oldmutuallogo_1782606637497.jpg"; To = "oldmutual.jpg" },
  @{ From = "plc.png";                         To = "pcl.png" },
  @{ From = "standard bank.png";              To = "standard.png" },
  @{ From = "sunbird.png";                     To = "sunbird.png" },
  @{ From = "tnm.png";                         To = "tnm.png" },
  @{ From = "nbs-banklogo_1782606637497.png";  To = "fmbch.png" }
)

foreach ($c in $copies) {
  $from = Join-Path $src $c.From
  $to   = Join-Path $dst $c.To
  if (Test-Path $from) {
    Copy-Item $from $to -Force
    Write-Host "Copied: $($c.To)"
  } else {
    Write-Warning "Source not found: $($c.From)"
  }
}

Write-Host "`nDone! Reload the Expo app (press 'r' in the terminal)."
