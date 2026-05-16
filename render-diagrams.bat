@echo off
REM Batch script to render PlantUML diagrams to PNG
REM Requires: PlantUML installed and in PATH, or Java + plantuml.jar available

echo.
echo ========================================
echo MYFIT - PlantUML Sequence Diagram Rendering
echo ========================================
echo.

REM Set input and output directories
set INPUT_DIR=docs\plantuml
set OUTPUT_DIR=docs\plantuml\rendered

REM Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Input directory: %INPUT_DIR%
echo Output directory: %OUTPUT_DIR%
echo.

REM Check if plantuml is in PATH
where plantuml >nul 2>&1
if %errorlevel% equ 0 (
    echo Found plantuml in PATH
    echo Rendering diagrams...
    echo.
    
    REM Render all sequence diagrams
    plantuml -tpng "%INPUT_DIR%\SD-*.puml" -o "..\plantuml\rendered"
    
    echo.
    echo ✓ Sequence diagrams rendered successfully
) else (
    echo PlantUML not found in PATH
    echo.
    echo Option 1: Install PlantUML via Chocolatey
    echo   choco install plantuml
    echo.
    echo Option 2: Use online renderer at https://www.plantuml.com/plantuml/uml/
    echo   1. Copy content from docs\plantuml\SD-*.puml
    echo   2. Paste into online editor
    echo   3. Save PNG files
    echo.
    echo Option 3: Use VS Code Extension
    echo   1. Install "PlantUML" extension (jebbs.plantuml)
    echo   2. Open SD-*.puml files
    echo   3. Press Alt+D for preview
    echo   4. Right-click to export as PNG
    echo.
)

echo.
echo Expected output files:
echo   - %OUTPUT_DIR%\SD-CHECKIN.png
echo   - %OUTPUT_DIR%\SD-POS.png  
echo   - %OUTPUT_DIR%\SD-HEALTH.png
echo.
echo Next steps:
echo   1. Use these PNG files in your LaTeX document
echo   2. Update docs/usecases-consolidated.tex
echo   3. Include diagrams in presentation slides
echo.
pause
