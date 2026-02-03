# Fix auth() calls script
$files = @(
    "c:\College\remo2\app\api\enhance\route.ts",
    "c:\College\remo2\app\api\fill-room\route.ts",
    "c:\College\remo2\app\api\generate\route.ts",
    "c:\College\remo2\app\api\inpaint\route.ts",
    "c:\College\remo2\app\api\remove-object\route.ts",
    "c:\College\remo2\app\api\replace\route.ts",
    "c:\College\remo2\app\api\sketch-to-render\route.ts",
    "c:\College\remo2\app\api\vastu\route.ts",
    "c:\College\remo2\app\api\cost\route.ts",
    "c:\College\remo2\app\api\payment\credits\route.ts",
    "c:\College\remo2\app\api\payment\verify\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'const \{ userId \} = auth\(\);', 'const { userId } = await auth();'
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "Done!"
