param([string]$DocName = "Hydrogen_Storage_Safety_System_Project_Report.docx")

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = (Get-Item $DocName).FullName
    $doc = $word.Documents.Open($docPath)
    $pages = $doc.ComputeStatistics(2)
    Write-Host "WORD_PAGES:$pages"
    $doc.Close(0)
    $word.Quit()
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
