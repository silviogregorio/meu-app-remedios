---
description: Workflow de manutenção de segurança e dependências
---

# Manutenção de Segurança - SiG Remédios

Execute este workflow periodicamente (recomendado: 1x por mês) para manter o projeto seguro.

## 1. Auditar Dependências NPM
```powershell
# Na raiz do projeto
npm audit

# No server
cd server && npm audit && cd ..
```

Se vulnerabilidades forem encontradas:
```powershell
npm audit fix          # Correção automática
npm audit fix --force  # Forçar correção (pode ter breaking changes)
```

## 2. Verificar Headers de Segurança
Acesse: https://securityheaders.com/?q=https://sigremedios.vercel.app
- Resultado esperado: **A ou A+**

## 3. Atualizar Dependências
```powershell
# Ver dependências desatualizadas
npm outdated

# Atualizar minor/patch (geralmente seguro)
npm update

# Atualizar major (revisar changelog antes!)
npx npm-check-updates -u
npm install
```

## 4. Rodar Testes
```powershell
npm run test
```
- Resultado esperado: **Todos passando**

## 5. Backup
```powershell
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$excludes = @("node_modules", ".git", "dist", "backup_*", "*.zip")
Get-ChildItem -Path . -Exclude $excludes | Compress-Archive -DestinationPath ".\backup_completo_$timestamp.zip" -CompressionLevel Optimal
```

## 6. Limpar Cache (se necessário)
```powershell
# Limpar cache npm
npm cache clean --force

# Limpar node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
npm install
```

## Checklist Mensal
- [ ] `npm audit` sem vulnerabilidades
- [ ] Headers de segurança nota A+
- [ ] Testes passando
- [ ] Backup criado
- [ ] Deploy funcionando
