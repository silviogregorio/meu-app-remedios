export const quotesReserve = [
    // FAITH / ESPIRITUALIDADE
    { text: "A fé não torna as coisas mais fáceis, a fé torna as coisas possíveis.", period: "any", category: "faith" },
    { text: "Onde há fé, há amor; onde há amor, há paz; onde há paz, há Deus.", period: "any", category: "faith" },
    { text: "Tudo posso naquele que me fortalece.", period: "any", category: "faith" },
    { text: "Acredite: Deus coloca as coisas no lugar certo, na hora certa.", period: "any", category: "faith" },
    { text: "Não tenha medo, tenha fé.", period: "any", category: "faith" },
    { text: "A oração é a chave do céu e a fé é a mão que abre a porta.", period: "morning", category: "faith" },
    { text: "Entregue, confie, aceite e agradeça.", period: "night", category: "faith" },

    // HEALTH / SAUDE
    { text: "Cuidar do corpo é cuidar do templo do Espírito Santo.", period: "morning", category: "health" },
    { text: "A saúde é o resultado do equilíbrio entre corpo, mente e espírito.", period: "any", category: "health" },
    { text: "Cada passo em direção à saúde é uma vitória.", period: "afternoon", category: "health" },
    { text: "Seu corpo escuta tudo o que sua mente diz. Pense positivo.", period: "morning", category: "health" },
    { text: "A cura começa quando você decide se colocar em primeiro lugar.", period: "any", category: "health" },

    // MOTIVATION / FORÇA
    { text: "Não importa a velocidade, o importante é continuar caminhando.", period: "afternoon", category: "motivation" },
    { text: "Você é mais forte do que sua dor e maior do que seus desafios.", period: "any", category: "motivation" },
    { text: "Dias difíceis preparam pessoas fortes para destinos extraordinários.", period: "night", category: "motivation" },
    { text: "A tempestade vai passar e o sol vai voltar a brilhar.", period: "any", category: "motivation" },
    { text: "Seja a mudança que você quer ver na sua saúde.", period: "morning", category: "motivation" },

    // NIGHT / PAZ
    { text: "Acalma o teu coração, o amanhã a Deus pertence.", period: "night", category: "faith" },
    { text: "O descanso é sagrado. Durma com a consciência tranquila.", period: "night", category: "health" },
    { text: "Apague as luzes, acenda as estrelas da esperança.", period: "night", category: "inspiration" },

    // More generic...
    { text: "A gratidão transforma o que temos em suficiente.", period: "any", category: "inspiration" },
    { text: "Respire fundo. O agora é o único momento que você tem.", period: "any", category: "health" },
    { text: "A paciência é uma árvore de raiz amarga, mas de frutos muito doces.", period: "afternoon", category: "motivation" },
    { text: "Cuide-se hoje para que o amanhã seja ainda melhor.", period: "afternoon", category: "health" },
    { text: "Sua vida é um milagre. Valorize-a.", period: "morning", category: "faith" },
    { text: "Nunca é tarde para começar a cuidar de si mesmo.", period: "morning", category: "motivation" }
];

export const getRandomBatch = (count = 5) => {
    const shuffled = [...quotesReserve].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
