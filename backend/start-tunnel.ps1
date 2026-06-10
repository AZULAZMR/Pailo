$url = & npx localtunnel --port 3000 2>&1 | Out-String
$url > C:\Users\manal\AppData\Local\Temp\opencode\tunnel-url.txt
