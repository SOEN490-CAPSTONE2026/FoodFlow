# use-java17.ps1
# Switch current PowerShell session to Java 17

# CHANGE THIS PATH to your actual Java 17 location!
$JAVA17_HOME = "C:\Program Files\Java\jdk-17"

# Check if path exists
if (-not (Test-Path $JAVA17_HOME)) {
    Write-Host "ERROR: Java 17 not found at $JAVA17_HOME" -ForegroundColor Red
    Write-Host "Please update the path in this script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Searching for Java installations..." -ForegroundColor Cyan
    Get-ChildItem "C:\Program Files\Java" -Directory 2>$null
    Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory 2>$null
    exit 1
}

# Set environment variables for current session
$env:JAVA_HOME = $JAVA17_HOME
$env:PATH = "$JAVA17_HOME\bin;$env:PATH"

# Verify
Write-Host "Java 17 activated!" -ForegroundColor Green
Write-Host "JAVA_HOME: $env:JAVA_HOME"
java -version
javac -version
