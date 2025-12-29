---
description: Diretrizes de Design e Acessibilidade (Sênior & Premium)
---

Para evitar retrabalho e garantir que o SiG Remédios seja sempre acessível para o público sênior e leigo, siga estas regras em todas as implementações de UI:

### 1. Visibilidade Total (Sem Cortes)
- **NUNCA** use a classe `truncate` em nomes de medicamentos, pacientes ou instruções críticas.
- Use `break-words` e permita que o texto ocupe múltiplas linhas se necessário.
- Priorize `font-bold` ou `font-black` para informações cruciais (horários, nomes de remédios).

### 2. Layouts de Card (Full-Width)
- Cards internos dentro de alertas ou seções devem ocupar **100% da largura** disponível (`w-full`).
- Evite "cards dentro de cards" com margens excessivas que estrangulam o conteúdo.
- Use separadores sutis (`border-t`) e fundos contrastantes (`bg-white/80`) para distinguir itens em uma lista.

### 3. Linguagem Direta e Humanizada
- Evite termos técnicos ou vagos (ex: "Agora", "ID do Log", "Consumo").
- Use frases de ação claras:
    - "Horário chegou!" em vez de "Pendentes".
    - "Tomar Agora" em vez de "Confirmar".
    - "Pedido de ajuda enviado" em vez de "Alerta SOS criado".

### 4. Contraste e Toque (Touch Targets)
- Botões de ação devem ter **pelo menos 48px de altura** em mobile para facilitar o toque.
- Use cores vibrantes com alto contraste (Vermelhos para alertas, Azuis/Verdes para progresso).
- Sombras suaves (`shadow-md`) e bordas arredondadas (`rounded-2xl`) ajudam a destacar elementos clicáveis.

### 5. Responsividade Prioritária
- Sempre teste a visualização em telas pequenas.
- Empilhe elementos verticalmente (`flex-col`) em mobile se o espaço horizontal for insuficiente para o texto completo.
