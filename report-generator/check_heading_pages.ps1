try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = (Get-Item "Hydrogen_Storage_Safety_System_Project_Report.docx").FullName
    $doc = $word.Documents.Open($docPath)
    
    foreach ($p in $doc.Paragraphs) {
        $txt = $p.Range.Text.Trim()
        if ($txt -match "^(CHAPTER|ABSTRACT|ACKNOWLEDGEMENT|TABLE OF CONTENTS|APPENDIX|SCREENSHOTS|REFERENCES|\d+\.\d+)") {
            $page = $p.Range.Information(1) # 1 = wdActiveEndAdjustedPageNumber
            $section = $p.Range.Information(2) # 2 = wdActiveEndSectionNumber
            Write-Host "$page (Sec $section): $txt"
        }
    }
    
    $doc.Close([ref]$false)
    $word.Quit()
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
