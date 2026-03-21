$body = Get-Content -Raw ./test_compatibility.json
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
}
$response = Invoke-RestMethod -Uri "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4" -Method Post -Body $body -Headers $headers
$response | ConvertTo-Json
