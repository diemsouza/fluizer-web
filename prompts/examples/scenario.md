## BASIC

### question
fórmula: situação curta em PT (até 15 palavras) que termina no termo em PT entre parênteses. O parêntese é o último elemento, nada depois dele além de pontuação. Apenas a frase, sem pergunta, comando ou observação ao final.

nota: A resposta é sempre o primeiro termo de answerKeys, os demais são variações aceitas na avaliação e não influenciam a situação. O parêntese traz a tradução literal desse primeiro termo, sozinha ou dentro da fala, e faz parte da frase, nunca a descreve ao lado. A situação descreve o contexto e termina na fala, nunca dá ordem de fala ao usuário (diga, peça, avise, responda): o fechamento da pergunta já é a instrução. O limite de palavras é rígido. Se a situação não couber, simplifique o cenário até caber, nunca ultrapasse o limite. Em conectivos sem referente concreto (de qualquer forma, entretanto, embora), siga o terceiro exemplo, sem reescrever a frase com outra palavra no lugar. Nunca nomeie categoria gramatical. Se mais de um termo resolve a situação, adicione detalhe concreto até sobrar só um.

exemplos:
- Começou a chover no caminho e você percebe que esqueceu o (guarda-chuva).
- Seus amigos te chamam para sair, mas sua mãe manda você (lavar a louça).
- Estava chovendo muito, mas você saiu (de qualquer forma).
- O sistema bloqueou você e você fala com o suporte: (eu preciso de acesso)
- Você explica ao amigo por que não vai à festa: (não vou, a menos que você vá comigo)

exemplo ruim:
- Diga (eu preciso de acesso) ao suporte.

validação:
- Situação toda em PT, terminando no termo entre parêntese.
- O parêntese traz a tradução literal do primeiro termo de answerKeys, sozinha ou dentro da fala, não uma descrição, paráfrase ou explicação.
- O parêntese é o último elemento da situação, sem nada depois dele além de pontuação.
- A situação não dá ordem de fala ao usuário (diga, peça, avise, responda).
- O termo em inglês não aparece em nenhum ponto da situação.
- A situação aponta para um único termo possível.
- Situação com no máximo 15 palavras, sem contar termo em parêntese.
- Se qualquer critério falhar, gere outra pergunta com a correção.

### feedback
fórmula: a mesma situação da pergunta, dita em EN simples, com o termo de right_answer.

nota: Nunca crie cenário novo nem acrescente elementos que não estavam nele. A frase narra a situação, nunca é imperativa dirigida ao usuário. Grafia idêntica à de right_answer. O corpo do feedback não varia por status, apenas a abertura, resolvida fora deste prompt. Banda de nível A1-A2: em vez de traduzir todos os detalhes, mantenha só o essencial da situação, em até 8 palavras e com vocabulário elementar.

exemplo (late):
- pergunta: Ela perdeu a apresentação porque chegou (atrasada).
- feedback: She showed up late and missed the introduction.

exemplo (borrow):
- pergunta: Você está sem caneta para a prova e precisa (pegar emprestado).
- feedback: You have no pen, so you borrow one.

exemplo (anyway):
- pergunta: A fila estava longa, mas ela esperou (de qualquer forma).
- feedback: The line was long, but she waited anyway.

validação:
- A frase de uso emprega o termo, nunca o define ou o explica.
- A frase narra a situação, nunca é uma ordem no imperativo dirigida ao usuário.
- Não pode ser reescrita como "X significa Y" ou "X refere-se a Y".
- A frase resume a situação da pergunta, nunca cria uma nova.
- Se qualquer critério falhar, gere outro feedback com a correção.

## INTERMEDIATE

### question
fórmula: situação em EN A2-B1 (até 15 palavras) que termina no termo em PT entre parênteses. O parêntese é o último elemento, nada depois dele além de pontuação. Apenas a frase, sem pergunta, comando ou observação ao final.

nota: A resposta é sempre o primeiro termo de answerKeys, os demais são variações aceitas na avaliação e não influenciam a situação. O parêntese traz a tradução literal desse primeiro termo, sozinha ou dentro da fala, e faz parte da frase, nunca a descreve ao lado. A situação descreve o contexto e termina na fala, nunca dá ordem de fala ao usuário (diga, peça, avise, responda): o fechamento da pergunta já é a instrução. Fora do parêntese, nenhuma palavra em português. A frase de estímulo fica um passo abaixo do termo em foco, o esforço do aluno é o termo, não decodificar a frase ao redor. O limite de palavras é rígido. A situação é uma única frase, nunca duas orações separadas por ponto. Se a situação não couber, simplifique o cenário até caber, nunca ultrapasse o limite. Em conectivos sem referente concreto (anyway, however, although, instead, unless), siga o terceiro exemplo, sem reescrever a frase com outra palavra no lugar. Nunca nomeie categoria gramatical. Se mais de um termo resolve a situação, adicione detalhe concreto até sobrar só um.

exemplos:
- It started raining on the way and you realized you forgot your (guarda-chuva).
- Your friends invited you out, but your mom told you to (lavar a louça).
- It was raining hard, but you went out (de qualquer forma).
- The system locked you out, so you call support: (eu preciso de acesso)
- You explain to a friend why you're skipping the party: (não vou, a menos que você vá comigo)

exemplo ruim:
- Tell support (eu preciso de acesso).

validação:
- Situação toda em EN, terminando no termo em PT entre parêntese.
- O parêntese traz a tradução literal do primeiro termo de answerKeys, sozinha ou dentro da fala, não uma descrição, paráfrase ou explicação.
- O parêntese é o último elemento da situação, sem nada depois dele além de pontuação.
- A situação não dá ordem de fala ao usuário (diga, peça, avise, responda).
- O termo em inglês não aparece em nenhum ponto da situação.
- A situação aponta para um único termo possível.
- Situação com no máximo 15 palavras, sem contar termo em parêntese.
- Se qualquer critério falhar, gere outra pergunta com a correção.

### feedback
fórmula: a mesma situação da pergunta, dita em EN, com o termo de right_answer no lugar do parêntese.

nota: Nunca crie cenário novo nem acrescente elementos que não estavam nele. A frase narra a situação, nunca é imperativa dirigida ao usuário. Grafia idêntica à de right_answer. O corpo do feedback não varia por status, apenas a abertura, resolvida fora deste prompt.

exemplo (exhausted):
- pergunta: After the double shift at work, he felt (exausto).
- feedback: After the double shift at work, he felt exhausted.

exemplo (postpone):
- pergunta: With the storm getting worse, we had no choice but to (adiar).
- feedback: With the storm getting worse, we had no choice but to postpone.

exemplo (give up):
- pergunta: Even after three failed attempts, she refused to (desistir).
- feedback: Even after three failed attempts, she refused to give up.

validação:
- A frase de uso emprega o termo, nunca o define ou o explica.
- A frase narra a situação, nunca é uma ordem no imperativo dirigida ao usuário.
- Não pode ser reescrita como "X significa Y" ou "X refere-se a Y".
- A frase é a mesma da pergunta gerada, com o termo no lugar do parêntese, nunca uma frase nova.
- Se qualquer critério falhar, gere outro feedback com a correção.

## ADVANCED

### question
fórmula: situação em EN B1-B2 (até 15 palavras) que termina no termo em PT entre parênteses. O parêntese é o último elemento, nada depois dele além de pontuação. Apenas a frase, sem pergunta, comando ou observação ao final.

nota: A resposta é sempre o primeiro termo de answerKeys, os demais são variações aceitas na avaliação e não influenciam a situação. O parêntese traz a tradução literal desse primeiro termo, sozinha ou dentro da fala, e faz parte da frase, nunca a descreve ao lado. A situação descreve o contexto e termina na fala, nunca dá ordem de fala ao usuário (diga, peça, avise, responda): o fechamento da pergunta já é a instrução. Fora do parêntese, nenhuma palavra em português. A frase de estímulo fica um passo abaixo do termo em foco, o esforço do aluno é o termo, não decodificar a frase ao redor. O limite de palavras é rígido. A situação é uma única frase, nunca duas orações separadas por ponto. Se a situação não couber, simplifique o cenário até caber, nunca ultrapasse o limite. Em conectivos sem referente concreto (anyway, however, although, instead, unless), siga o terceiro exemplo, sem reescrever a frase com outra palavra no lugar. Nunca nomeie categoria gramatical. Se mais de um termo resolve a situação, adicione detalhe concreto até sobrar só um.

exemplos:
- Halfway to the office the sky opened up, and you realized you'd left your (guarda-chuva).
- You were already running late, but your mom insisted that you (lavar a louça).
- The forecast promised heavy rain all day, but you went for a long walk (de qualquer forma).
- The system locked you out right before the deadline, so you message support: (eu preciso de acesso)
- You explain to a friend why you're skipping the party: (não vou, a menos que você vá comigo)

exemplo ruim:
- Tell support (eu preciso de acesso) before the deadline.

validação:
- Situação toda em EN, terminando no termo em PT entre parêntese.
- O parêntese traz a tradução literal do primeiro termo de answerKeys, sozinha ou dentro da fala, não uma descrição, paráfrase ou explicação.
- O parêntese é o último elemento da situação, sem nada depois dele além de pontuação.
- A situação não dá ordem de fala ao usuário (diga, peça, avise, responda).
- O termo em inglês não aparece em nenhum ponto da situação, incluindo a oração que vem antes do parêntese na mesma frase de duas cláusulas.
- A situação aponta para um único termo possível.
- Situação com no máximo 15 palavras, sem contar termo em parêntese.
- Se qualquer critério falhar, gere outra pergunta com a correção.

### feedback
fórmula: a mesma situação da pergunta, dita em EN, com o termo de right_answer no lugar do parêntese.

nota: Nunca crie cenário novo nem acrescente elementos que não estavam nele. A frase narra a situação, nunca é imperativa dirigida ao usuário. Grafia idêntica à de right_answer. O corpo do feedback não varia por status, apenas a abertura, resolvida fora deste prompt.

exemplo (reluctant):
- pergunta: The offer came after a long delay, so she felt (relutante).
- feedback: The offer came after a long delay, so she felt reluctant.

exemplo (workload):
- pergunta: Since the merger was announced, he can barely handle his (carga de trabalho).
- feedback: Since the merger was announced, he can barely handle his workload.

exemplo (bite the bullet):
- pergunta: After months of hesitation, he finally decided to (encarar de vez).
- feedback: After months of hesitation, he finally decided to bite the bullet.

validação:
- A frase de uso emprega o termo, nunca o define ou o explica.
- A frase narra a situação, nunca é uma ordem no imperativo dirigida ao usuário.
- Não pode ser reescrita como "X significa Y" ou "X refere-se a Y".
- A frase é a mesma da pergunta gerada, com o termo no lugar do parêntese, nunca uma frase nova.
- Se qualquer critério falhar, gere outro feedback com a correção.