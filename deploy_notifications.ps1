# Script de Automação para Migração FCM v1
# Projeto: sig-remedios

$jsonContent = '{
  "type": "service_account",
  "project_id": "sig-remedios",
  "private_key_id": "ef0bcb07066047c78380a6792294c530b1ed95f4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJVTedxI7TQbjx\ngWOM/HeDacbTkgLdzg5UHiYouJyL7CV5j5+SoUP5EL4egpSzUEw3/a8t5tV/Qdyp\nS3e+J+XfuIdsN3tbr0nvvsWTwE4w85dgx52ukMwY72dKQ3Kr6Glc6WfhYYswlibB\nbmr6BgXzynRjY/+ntLIFsGsupRubQo9fBjycFCeEftAHosTcjFjCpw/39wvyW24r\nFInxNGONlKtbk04FmVe8lVXJYTb3j5paK0Dhdjg5gPruKjsWvc9x3Rvt3Z3/1m1a\nFaiEvtp9rtbmDZHa9o+UzhtwOXJrORE7RWAeBXly4ZnP8sP5MizMz5RGVR5AdGCM\ntttCcM4d3AgMBAAECggEAP8KoKWO9Y7QVsQ4sC9NMuiZ+nDRKihoeuY8OwKiukzWH\nLLdKbvJ5h2BBBYKPOzZ73OOPXfcTuAiQrGDFHEigaTiUUrZDb+bUgIOnKMKnQKN0\nVmcBTe53ZJI04PT5VO32qEEW7+6nWQzEW0/vuxy7N9jvAScDKQZ1to2HdC8/zew3\ncuzbDLoRp6Jwaq/N03j8vxAO2QB3ejF2yJ0xI6TA082q1SWtth0+AenrDts4cSbX\nEIrexv2zECkeH8CcFsjOhbKGgirpq9lWV95VJfEW+h6FKmEpMhXnSiRqq0VO9vUv\nP5prQudRsJ5BPwFnEEFalUVktUlXYRbGcuYtwvXX8QKBgQDtEmpZJQAq1EuKpi4K\nZBCboOpTIF7iy9Z11riUVWq7iW7UZh6CZJDscb6SHDk23TsZARUt2KvInq1rPeCU\nCjc3CeaDrKx+3Kp5dlKbHA5wO61TIrqi08AFx38H2Lp6X35QlPfbsefDm++w6Sn2\n+C/w2/G3TrJNVRPEG1ufiWLNjwKBgQDZaFIOJbHDgoAQcKMJpD9+uB7SXWsiZTpl\njKp7rESM3ILoNF4aFy84uC8g0OkBS3EuFhMJQUBtCny/mNGUTuLQ0TyQrDybX0bp\nzDHmtm4FJn5+1JmzhitodiuOTEsmOPILhZvEqwn0paUnlONxNBFh/Bdam/dfU6zL\nPlI3aWIDmQKBgBmPdLvry1rSzNpEFI62PzwoW1tfEBvv0k2eOwRzOTDDHpnz8LIq\WZ3EncFvHZQWwjpt7XSl+c+FnDkF0OLlPxLGFH557Zc3/4FdCocCvWPIa2WdRvYr\nUnbNDZsw+Noc1aemiBq90bk7ZNp0KTwhgjm73RHggETqOVlZgcVvsKFtAoGAfxfl\nIDAZA1o+012FchV6qPGp0wCZqLnUsZjR8Qp76Hzgai5y9H2pNVc29dAq5n7b4z00\nU6y5pQUEeF0156VWIwyug0StCYdhRTwB0AXFu20NdceDMte0eJTcUYt4Qxf3J5Ur\nwoTahRJwwfrgG0V9A/MDFA0pR6j60rXUCmCo08ECgYEAlk9CDp1+N/t67Xn23hse\n0u5RZXCc3eIRRqPThgmcUANW838zkrcxpwU6yDX3EfdM/Q209CCcBYTC77aBxVAb\nkzBxSfw0xwqrADEBpyBCjEBwTHju4Sen/q/D1IAe2z9h5/AXBVdJMp9FzwUgRTdv\ntwVgYpKgeLMj81Prp6q0/fw=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@sig-remedios.iam.gserviceaccount.com",
  "client_id": "108822080367247912835",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sig-remedios.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'

Write-Host "--- 1. Configurando Secrets no Supabase ---" -ForegroundColor Cyan
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$jsonContent" --project-ref ahjywlsnmmkavgtkvpod

Write-Host "`n--- 2. Fazendo Deploy da Função check-missed-doses ---" -ForegroundColor Cyan
supabase functions deploy check-missed-doses --project-ref ahjywlsnmmkavgtkvpod

Write-Host "`n--- TUDO PRONTO! O sistema FCM v1 está ativo. ---" -ForegroundColor Green
