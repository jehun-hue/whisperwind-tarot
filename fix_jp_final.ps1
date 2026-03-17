$file = "c:\Users\제헌\OneDrive\바탕 화면\코딩\whisperwind-tarot\supabase\functions\ai-reading-v4\interactivityLayer.ts"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# --- JP tarotStyle.third 전체 교체 ---
$oldThird = '象徴적・構造적 분석의 시점에서 써주세요' # Expected state from previous turn
$newThird = '象徴的・構造的分析の視点で書いてください'
$content = $content.Replace($oldThird, $newThird)

# --- JP tarotStyle.e5l5 전체 교체 ---
$oldE5 = '[統合페르소나：感5론5]'
$newE5 = '[統合ペルソナ：感5論5]'
$content = $content.Replace($oldE5, $newE5)

# --- JP tarotStyle.l7e3 전체 교체 ---
$oldL7 = '데이터 분석 중심의 지적인 스타일입니다. 4단계의 구조（카드별 해설, 카드 흐름 연결, 운명학 교차 분석、総合結論）에 沿어서 記述してください。'
$newL7 = '感情的配慮(30%)のスタイルで、構造적인 アドバイス를 提供하는 스타일입니다. 4단계의 구조（카드별 해설, 카드 흐름 연결, 운명학 교차 분석, 総合結論）에 沿어서 記述してください。'
$content = $content.Replace($oldL7, $newL7)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)

# 검증: JP 블록(대략 77~98행) 출력
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
for ($i = 76; $i -lt 98; $i++) {
    Write-Host ("{0}: {1}" -f ($i+1), $lines[$i])
}
