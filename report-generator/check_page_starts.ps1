$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open((Get-Item "Hydrogen_Storage_Safety_System_Project_Report.docx").FullName)
$totalPages = $doc.ComputeStatistics(2)

for ($i = 1; $i -le $totalPages; $i++) {
    $range = $doc.Range()
    $range = $range.GoTo(1, 1, $i)
    $line = $range.Paragraphs(1).Range.Text.Trim()
    if ($line.Length -gt 60) { $line = $line.Substring(0, 60) + "..." }
    Write-Host "Page $i : $line"
}

$doc.Close(0)
$word.Quit()
