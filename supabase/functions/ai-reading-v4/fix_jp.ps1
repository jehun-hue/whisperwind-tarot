$file = "c:\Users\제헌\OneDrive\바탕 화면\코딩\whisperwind-tarot\supabase\functions\ai-reading-v4\interactivityLayer.ts"
$content = Get-Content $file -Raw -Encoding UTF8

# 수정 1: waite
$content = $content.Replace('伝統적인 解釈', '伝統적인 解釈')

# 수정 2: e7l3
$content = $content.Replace('共感적인 アドバイス', '共感적인 アドバイス')

# 수정 3: e5l5 - 스タイル입니다 → 스タイル입니다
$content = $content.Replace('スタイル입니다.', 'スタイル입니다.')

# 수정 4: e5l5 - 반각 쉼표를 전각으로
$content = $content.Replace('（カード別解釈, 카드 흐름, 運명학 크로스 분석, 総合結論）', '（カード別解釈、カードの流れ、運명학 크로스 분석、総合結論）')

Set-Content $file -Value $content -Encoding UTF8 -NoNewline

# 확인
Select-String -Path $file -Pattern '적인|입니다|를 |의 ' -AllMatches | ForEach-Object { $_.LineNumber.ToString() + ": " + $_.Line.Substring(0, [Math]::Min(120, $_.Line.Length)) }
