# To-Do: auditoria do produto (2026-11-27)

Cada item tem um ID. Para pedir a execução, cite o ID (ex: "faz A1 e B4").
Itens com ✔ foram conferidos linha a linha no código. Os demais vieram da varredura e precisam ser conferidos antes de mexer.

## A. Bugs de fluxo

- [x] **A1 ✔ Teto real de prática é 36 por dia, não 60.**
  Onde: `src/core/limits.ts:19`, `src/lib/constants.ts:113` (`INTENSIVE_LIMIT = 60 - 24`).
  O que acontece: quase toda pergunta depois da primeira sai por `sendIntensiveQuestion`, que marca `intensiveUntil`. Então quase toda resposta conta como intensiva e bate no teto de 36. O usuário recebe "Você usou toda sua prática..." com 36 respostas. Product-Rules 8.2 diz que a divisão 24/36 não tem efeito hoje.
  Proposta: com `AUTO_QUESTION_ENABLED = false`, `canPracticeToday` ignora o teto intensivo e vale só o de 60. Citar no comentário da constante.

- [x] **A2 ✔ Falha da LLM na avaliação conta como resposta errada.**
  Onde: `src/services/message-service.ts:952` (`evaluation?.status ?? "wrong"`).
  O que acontece: se `generateAnswerEvaluation` devolve null, o usuário vê "Não foi possível avaliar essa resposta", mas a pergunta é gravada como wrong, entra no SM-2, no score, no contador do dia e no `interactionCount`. Erro nosso pune o usuário.
  Proposta: com `evaluation` nulo, manda `formatFeedbackFailed` e retorna sem gravar nada; a pergunta segue pendente.

- [x] **A3 Descartado. Choice e image_recognition têm certo/errado decidido pela LLM.**
  Motivo do descarte: `resolveSelectedButtonId` só resolve clique, número puro ou texto idêntico ao rótulo (sem tirar pontuação nem artigo); texto livre e voz cairiam fora e seriam julgados errado em código. A LLM é chamada de qualquer jeito para a frase e já recebe as opções numeradas. Sem evidência de erro no caso clique/número.
  Onde: `message-service.ts:891-934` (a pergunta vai com as opções numeradas e a LLM decide o status).
  O que acontece: a opção escolhida já é resolvida em código (`resolveSelectedButtonId`, `src/core/parser.ts`), mas o status sai do modelo. Pode errar uma comparação que é exata.
  Proposta: depois da avaliação, sobrescrever o status com a comparação opção escolhida x `answerKeys[0]` (right ou wrong). A LLM continua só gerando a frase de feedback.

- [x] **A4 Primeira pergunta da atividade falha em silêncio.**
  Onde: `src/services/new-activity-service.ts:232`, `src/services/merge-doc-service.ts:211` (ignoram o `false` de `sendFirstQuestionNow`).
  O que acontece: o usuário vê "Tudo pronto!" e depois nada. O Continuar não aparece porque não existe mensagem de estudo anterior (`practice-pill-service.ts:44-47`).
  Proposta: no `false`, mandar uma mensagem que leva ao Continuar (ou liberar `canContinue` quando há atividade ativa sem pergunta pendente).

- [x] **A5 "Estamos preparando sua próxima pergunta." promete algo que não chega.**
  Onde: `src/core/formatters.ts:785`, enviado em `message-service.ts:1550-1559` quando a geração falha.
  O que acontece: com a cadência pausada, nada tenta de novo em segundo plano. Também é 1a pessoa do plural.
  Proposta: texto impessoal dizendo que a pergunta não saiu e para tocar em Continuar.

- [x] **A6 Atividade pausada leva a orientação errada.**
  Onde: `message-service.ts:607` e `:791-793`; `activities.repo.ts:84` (só active) x `:120` (inclui paused).
  O que acontece: depois de `/pausar`, mandar texto responde "Você ainda não tem atividade ativa" com botão Criar atividade, e `/praticar` responde "Nenhuma atividade ativa". Nenhum aponta para `/retomar`. A pill continua visível (`practice-pill-service.ts:80,90`), contra Product-Rules 8.3.1.
  Proposta: quando a atual está `paused`, responder apontando `/retomar`; pill some.

- [x] **A7 Material: atividade anterior é arquivada antes de confirmar o conteúdo novo.**
  Onde: `merge-doc-service.ts:153-177` arquiva e cria; `:212-224` marca o doc como failed se o conteúdo veio vazio.
  O que acontece: usuário fica com atividade ativa ligada a um doc com falha. Product-Rules 15 diz que falha mantém a atividade atual.
  Proposta: arquivar só depois do conteúdo pronto, igual ao `createTextActivity`.

- [x] **A8 Timezone inválido derruba o cron de lembrete de todo mundo.**
  Onde: validação só `z.string().min(1)` em `api/app/account/daily-reminder/route.ts:12`, `api/auth/otp/verify/route.ts:17`, `api/auth/google/start/route.ts:10`. O SQL em `src/repo/users.repo.ts:336-347` usa `AT TIME ZONE u.timezone`.
  O que acontece: um valor ruim faz a query inteira falhar. Também quebra `getNearestReminderTimeSlot` no cadastro e `formatSubscriptionConfirmed` (`stripe-webhook-service.ts:156`); no retry da Stripe o "já aplicado" pula e a confirmação nunca sai.
  Proposta: validar com `Intl.supportedValuesOf("timeZone")` num helper em `src/core/`, usado nos 3 schemas; inválido cai no padrão.

- [x] **A9 Conta cortesia (sem `planExpiresAt`) nunca recebe lembrete.**
  Onde: `users.repo.ts:379` (`planExpiresAt: { gt: new Date() }`).
  O que acontece: `canPractice` (`src/core/access.ts:8`) aceita null, mas o filtro do lembrete não.
  Proposta: `OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }]`.

- [x] **A10 Usuário expirado ainda gasta IA.**
  Onde: `api/app/activities/material/extract` (OCR/visão), `api/app/messages/upload` (guarda áudio e roda Whisper antes do bloqueio, `voice-note-service.ts:168`), `api/app/activities/[id]/resume`. Também `items[].text` sem tamanho máximo em `api/app/activities/route.ts:49`.
  Proposta: checar `canPractice` nessas rotas e pôr `max` no texto.

- [x] **A11 ✔ Cron aceita `Bearer undefined` se `CRON_SECRET` não existir.**
  Onde: `api/cron/activity/route.ts:10`, `api/cron/daily-reminder/route.ts:9`, `api/cron/audio-cleanup/route.ts:33`.
  Proposta: rejeitar quando a env está vazia.

- [x] **A12 Comando com erro de digitação é avaliado como resposta.**
  Onde: `src/core/parser.ts:143` (`unknown_command` nunca é produzido), `message-service.ts:470-476`.
  O que acontece: `/praticr` com pergunta pendente vira resposta errada.
  Proposta: texto com `/` que não bate em comando responde a lista de comandos sem avaliar.
  Minha outra proposta é se tem barra / é um comando e retorna comando invalido. usuario pode ter errado o comando mas se tem barra ele queria um comando, só errou ao digitar.

- [x] **A13 `/praticar` grava a mensagem do usuário depois da resposta do bot.**
  Onde: `message-service.ts:719-751` (`saveUserMsg` em 744).
  Proposta: salvar a mensagem do usuário antes.

- [x] **A14 Sugestão de trocar de atividade (Product-Rules 6.3) quase nunca dispara.**
  Onde: `message-service.ts:1276` retorna cedo no intensivo com `!AUTO_QUESTION_ENABLED`, antes da chamada em `:1361-1371`, que ainda exige `!isIntensiveMode`.
  Proposta: decidir se a regra continua valendo; se sim, chamar no caminho do Continuar.

- [x] **A15 Guia depois do primeiro feedback pode não sair, e o modal de telefone nunca abre.**
  Onde: `guide_after_first_feedback` só sai no caminho não intensivo (`message-service.ts:1288-1330`); o cliente depende dele (`map-messages.ts:251`, Product-Rules 11.3.3).
  Proposta: disparar o guia pelo critério "primeiro feedback da conta", independente do modo.

- [x] **A16 Trava contra mensagem duplicada não é atômica e expira no meio do turno.**
  Onde: `message-service.ts:213-236`, `users.repo.ts:229`; `MESSAGE_SUPPRESSION_SEC = 10` (`constants.ts:239`).
  O que acontece: duas abas ou toque duplo passam juntos (duas avaliações, duas perguntas pendentes). O turno normal dura mais que 10s.
  Proposta: trava com update condicional (compare-and-set) e prazo igual a `PRACTICE_TURN_MAX_SEC`. Mudança maior.

- [x] **A17 Criar duas atividades ao mesmo tempo deixa uma "ativa" órfã e fura o limite de 5/dia.**
  Onde: `new-activity-service.ts:96-139` (checagem e marcação separadas por chamada de LLM; material sem marcação), `merge-doc-service.ts:153-156`.
  O que acontece: as duas arquivam a mesma anterior e criam uma nova cada; a mais velha fica ativa para sempre e infla revisões, banner e lembretes.
  Proposta: marcar "criando" antes da LLM nos dois caminhos e arquivar todas as ativas na troca. Mudança maior.

- [x] **A18 `/cancelar` no material não interrompe o processamento.**
  Onde: `message-service.ts:779-781` marca o doc como canceled; `merge-doc-service.ts:44` só checa no início e `:142-149` sobrescreve para active.
  Proposta: reler o status antes de criar a atividade.

- [x] **A19 Contadores do dia viram à meia-noite UTC (21h em Brasília).**
  Onde: `startOfDay(new Date())` em `message-service.ts:210`, `practice-pill-service.ts:25`, `new-activity-service.ts:102,303`, `merge-doc-service.ts:163`.
  O que acontece: limite de prática, 5 atividades/dia e "amanhã tem mais" viram às 21h.
  Proposta (decidir): usar `users.timezone` ou fixar `America/Sao_Paulo`. Mudança ampla.

- [x] **A20 Onboarding pode rodar duas vezes; `pendingIntent` antigo trava o início.**
  Onde: `markUserOnboarded` só depois do primeiro envio (`message-service.ts:1839`); `startConversationIfNeeded` retorna cedo com `pendingIntent` (`:1898`), que só é limpo com mensagem nova (`:435-441`).
  Proposta: marcar onboarding antes do envio; ignorar/limpar `pendingIntent` no início da conversa.

- [x] **A21 Continuar pode ser descartado sem resposta.** Resolvido pelo A16: Continuar descartado só acontece com outro turno rodando, que manda o fim dele.
  Onde: retorno antes do `try/finally` com a trava ativa (`message-service.ts:219`); retorno silencioso com `canContinue` false (`:1479`) ou sem atividade (`:458-467`).
  O que acontece: sem `notifyTypingStop`, o botão some até o timeout de 45s do cliente.
  Proposta: sempre fechar o turno (sinal de fim) nesses retornos.

- [x] **A22 Trial só vira `expired` quando o usuário manda mensagem.**
  Onde: `message-service.ts:296-304` (TODO). Lembretes param em silêncio (`users.repo.ts:378`).
  Proposta: ligado ao F2 (aviso de fim de trial).

- [x] **A23 Stripe: dois `invoice.paid` simultâneos mandam duas confirmações.**
  Onde: `stripe-webhook-service.ts:124-151` (checa e grava sem idempotência por event id).
  Proposta: gravar o event id e ignorar repetido.

- [x] **A24 Miúdos de concorrência e segurança.**
  `users.metadata` atualizado por leitura e escrita sem trava (`users.repo.ts:119-150`), idem `recordFeedbackAudioPlayed` (`activity-service.ts:450`) e `questionCount` (`activity-cron.service.ts:634`). Assinatura Meta comparada sem tempo constante (`src/lib/whatsapp-verify.ts:30`). `findNextUnansweredQuestion` filtra por doc, não por atividade (`questions.repo.ts:81-93`).

## B. Prompts (contradições que aumentam erro da LLM)

- [x] **B1 ✔ Regra compartilhada proíbe o que scenario e gap_fill pedem.**
  Onde: `prompts/answer-evaluation.md:42` ("A frase de uso nunca é a tradução do enunciado").
  Conflito: `scenario.md` manda o feedback ser "a mesma situação da pergunta, dita em EN" (no basic a pergunta é PT, então é a tradução). `gap_fill.md` manda ser a frase da pergunta completada.
  Proposta: acrescentar "salvo quando a fórmula do bloco de exemplos partir da frase da pergunta".

- [x] **B2 ✔ Exemplos de feedback do gap_fill e scenario violam a própria regra.**
  Onde: `prompts/examples/gap_fill.md` e `scenario.md`, seções `### feedback` dos 3 níveis.
  Conflito: a regra diz "nunca crie frase nova, vem da pergunta", mas os exemplos de feedback são frases novas sem relação com os exemplos de pergunta (pergunta "______ arrives at eight every day.", feedback "The bus was late again."). O modelo copia o exemplo, não a regra.
  Proposta: trocar os exemplos de feedback pelas versões completas dos exemplos de pergunta.

- [x] **B3 ✔ Exemplos do gap_fill com parêntese que não é tradução literal.**
  Onde: `gap_fill.md:12` "bus" → "(o ônibus)"; `:96` "let's wrap this up" → "(resolver de uma vez)"; `:99` "hit the sweet spot" → "(acertamos o ponto ideal)". A validação do próprio arquivo exige tradução literal do primeiro answerKey.
  Proposta: corrigir os exemplos.

- [x] **B4 ✔ Negrito duplo no exemplo do tip.**
  Onde: `prompts/answer-evaluation-tip.md:50` exemplo `**voltar**`; a regra da mesma linha e a `:68` dizem `*negrito*`.
  Proposta: `*voltar*`.

- [x] **B5 ✔ Tip: "uso mostra o termo correto" x "nunca repete o termo já citado".**
  Onde: `answer-evaluation-tip.md:55` x `:56`. Se a dica já citou o termo em negrito, o uso não pode contê-lo, mas `:55` diz que o uso mostra o termo.
  Proposta: tirar "o termo já citado na dica" da `:56`; continua proibido repetir resposta, pergunta e feedback_text.

- [x] **B6 ✔ Tip: nomenclatura gramatical proibida em todos os níveis ou só no basic?**
  Onde: `:52` e `:61` proíbem só no basic; `:60` "Linguagem de aluno, sem nomenclatura gramatical" proíbe em todos.
  Proposta: `:60` vira "Linguagem de aluno, sem jargão de linguística". Decidir qual é a intenção.

- [x] **B7 ✔ "dont" é certo ou erro?**
  Onde: `answer-evaluation.md:11` manda ignorar pontuação e contrações (então "dont" = "don't" = right); `answer-evaluation-tip.md:22` lista "dont no lugar de don't" como erro structure.
  Proposta: tirar o exemplo `dont` do tip (mantém "can not" e "alot").

- [x] **B8 ✔ Voz "nunca elogia" x feedback_note com elogio.**
  Onde: `prompts/voice.md` ("Nunca elogia"), injetado em `answer-evaluation-image.md`, que em `:24` e `:32` pede "elogio aos elementos extras". Notas do `image_transcription.md` também.
  Proposta: trocar "elogio" por "cita os elementos extras corretos" (registro neutro).

- [x] **B9 ✔ Regra de formato no prompt compartilhado.**
  Onde: `answer-evaluation.md:34` (right_answer do recall invertido, choice e image_recognition).
  Proposta: mover cada frase para o `### feedback` do arquivo do formato.

- [x] **B10 ✔ Scenario: validação fala de "pergunta final" que a fórmula proíbe.**
  Onde: `scenario.md:25` ("O termo em parêntese deve aparecer na situação, nunca na pergunta final") e equivalentes nos outros níveis; a fórmula diz "Apenas a frase, sem pergunta".
  Proposta: remover a linha.

- [x] **B11 ✔ Recall invertido: "único formato sem correspondência de grafia".**
  Onde: `recall_inverted.md:28`. Falso: audio_translation e os de imagem também não têm.
  Proposta: remover a frase.

- [x] **B12 ✔ Choice: menções a coisas que não existem.**
  Onde: `choice.md:29,74,119` "por número, por letra ou por texto" (não há letra) e "Vale mesmo quando a pergunta pede a opção errada ou identifica exceção" (estilo que o formato não gera).
  Proposta: remover as duas partes.

- [x] **B13 ✔ gen-vocabulary: "omita o campo" x schema com string.**
  Onde: `gen-vocabulary.md:49` ("Omita o campo quando não houver") x `:33` (`"warning": ""`).
  Proposta: "string vazia quando não houver inconsistência".

- [x] **B14 ✔ Lista de conteúdo proibido diferente em cada prompt.**
  Onde: `activity-request.md:21` (tem violência e menores), `topic-validation.md:16` (sem os dois), `doc-extraction.md:56` (sem os dois), `ocr-document.md:5` (tem menores, animais, violência explícita).
  Proposta: alinhar topic-validation com activity-request (mesmo fluxo). doc-extraction ganha só menores (material real pode falar de guerra ou crime).

- [x] **B15 ✔ doc-extraction pode manter travessão do material na lista.**
  Onde: `doc-extraction.md:76` ("content preserva a formatação da lista").
  Proposta: deixar explícito que o separador do content é sempre hífen, nunca travessão.

- [x] **B16 ✔ Avaliação recebe dado que nenhuma regra usa.**
  Onde: `src/vendors/llm.vendor.ts:688` ("Tentativas: {attempt_count}") e `:698-700` (bloco `open_text`, formato sem uso, colado sem quebra de linha).
  Proposta: remover os dois.

- [x] **B17 ✔ Validação duplicada no gen-vocabulary.**
  Onde: `gen-vocabulary.md:20` e `:58` repetem "verifique cada critério... regenere até cumprir".
  Proposta: manter só uma.

## C. Textos que o usuário lê

- [x] **C1 1a pessoa e "tu" em mensagem real.** `src/services/activity-cron.service.ts:104` e `:132`: "Não consegui processar seu conteúdo. Tenta mandar de novo." Também fora do `formatters.ts`. Proposta: formatter impessoal ("Não foi possível processar o conteúdo. Tente enviar de novo.").
- [x] **C2 1a pessoa do plural.** `formatters.ts:785` "Estamos preparando" (ver A5), `:195` "falar com a gente".
- [x] **C3 "Tenta" x "Tente".** `pt.json:110`, `:120`, `:131`, `:611` usam "Tenta"; o resto usa "Tente".
- [x] **C4 Plurais quebrados.** `formatters.ts:482` e `:485` "Ficaram 1 perguntas sem resposta"; `:553` "(1 certas e 1 erradas)", e partial conta como errada; `pt.json:76` "1 dias restantes" (usar ICU plural).
- [x] **C5 Frases com problema.**
  `formatters.ts:411` "Poucas perguntas nessa rodada, a leitura fica mais precisa seguindo." (frase quebrada);
  `:413`/`:461` "Poucas respostas saíram erradas." aparece com 100% de acerto;
  `:1003` "a opção que mais descreve" → "melhor descreve";
  `:312` "Você ainda pode enviar mais 1 atividade" → "criar";
  `:459` "firmar" → "fixar", e "troca de material" também em atividade por tema (`:463-469`);
  `:210` "...nível do seu inglês. atual: básico" (minúscula depois de ponto);
  `:343` "Encerre respondendo a última pergunta em aberto."; `:585` "Pare usando /pausar..." com espaços sobrando em `:580-583`;
  `:375` vírgula sobrando em "Retomando *X*, de onde parou";
  `src/core/validate-content.ts:26` (espaços antes de `\n`, "tente" duas vezes, fala de "exercícios", tipo que não existe);
  `llm.vendor.ts:172` "Não foi possível usar esse assunto. Tente outro assunto.";
  `pt.json:127` "Começa refletindo apenas nas próximas atividades." → "A mudança vale a partir da próxima atividade.";
  `pt.json:262` "Não foi enviado." → "Áudio não enviado.";
  `pt.json:452` fragmento "Não cenários genéricos..."; `:404` "do jeito idêntico"; `:551` faltam dois-pontos antes da lista.
- [x] **C6 Mistura de idioma e gênero na boas-vindas.** `formatters.ts:44` "Hi 👋 Bem-vindo ao *Fluizer*."; `pt.json:361` "ser avisado".
- [x] **C7 "Praticar" x "Continuar".** `formatters.ts:382-383` e `:741-742` "Toque em Praticar"; `pt.json:71` e `:159` "Praticar"; `commands.ts:38` "/praticar: Prática intensiva". O botão do fluxo é Continuar.
- [x] **C8 "Continuar" usado para tudo.** Botão de prática, link de pagamento (`formatters.ts:163`), envio da nova atividade (`pt.json:294`), pós-pagamento (`:567`), "Continuar com Google" (`:582`). Avaliar trocar o da nova atividade e do pagamento.
- [x] **C9 Nomes de criar atividade.** "Criar atividade" (`formatters.ts:76,133`), "Nova atividade" (`pt.json:68,276`), "Nova Atividade" em título (`commands.ts:64`), e `commands.ts:73` "tema gerado por você" → "escolhido por você".
- [x] **C10 A unidade de prática tem vários nomes.** atividade, "prática" (`pt.json:62`), "rodada" (`formatters.ts:411`), "sessão" (`pt.json:384,509`).
- [x] **C11 "Trial" x "teste" x "grátis".** `pt.json:76-77` "Trial" em inglês; `formatters.ts:146` "período de teste".
- [x] **C12 Outros nomes inconsistentes.** "Sem título" (`formatters.ts:257,266,366,375`) x "Atividade sem título" (`pt.json:57`); "Atividade ativa" (`pt.json:65`) x "Atividade atual" (`formatters.ts:254`); e-mail de lembrete manda para "Lembrete de prática, no menu" (`formatters.ts:679`), mas o item do menu é "Lembrete" (`pt.json:88`); `formatters.ts:512` "Clique" onde o resto usa "Toque".
- [x] **C13 Formatos de material listados de jeitos diferentes.** "Imagem, PDF ou TXT" (`pt.json:311`), "foto, PDF ou texto" (`:399,461,551`), "texto, imagem ou PDF" (`formatters.ts:50,223`); `formatters.ts:114` chama foto de "arquivo de texto".
- [x] **C14 Aberturas EN parecidas entre wrong e partial.** `formatters.ts:805-806`: "Not quite!" (wrong) e "Not quite there!" (partial). Também "Hmmm, errou!" x "Humm, não!" (`:797-798`).
- [x] **C15 Números fixos que deveriam vir de constante.** `pt.json:166` "Restam apenas 10s" (`VOICE_MAX_SEC - VOICE_WARN_SEC`); `pt.json:512` e `:577` "7 dias" (`TRIAL_DAYS`); economia formatada como "96" e preços como "29,90" (`pricing-display.ts:25`, `pt.json:541`).
- [x] **C16 Acessibilidade em inglês.** "Close" (`src/components/ui/dialog.tsx:93`, `sheet.tsx:70`), "Toggle theme" (`theme-switcher.tsx:26`).
- [x] **C17 Código morto com texto velho.** `src/components/shared/upgrade-modal.tsx` (namespace `upgrade_modal` não existe, planos lite/essential, não é importado). Formatters sem uso: `formatUpgradePrompt` ("Envio de imagem é exclusivo do plano Pro", falso), `formatShortTextWithDocs`, `formatShortTextNoDocs`, `formatVideoUnsupported`, `formatAudioUnsupported`, `formatAllQuestionsAnswered`, `formatUnsupportedFileType`, `formatInvalidMessageType`. `formatDailyPracticeLimitReached` e `formatIntensiveDailyLimitReached` (`:350,:360`) com texto idêntico ("toda sua prática" → "toda a sua prática").
- [x] **C18 Simulador da home mostra texto que o produto não manda.** `src/components/home/simulator/roteiro-data.ts:53` "Qual opção descreve a imagem?" (nenhum prompt real usa); `:70` "Você está indo bem, continue assim." (o resumo real não diz isso, e é elogio).
- [x] **C19 Miúdos.** "Score:" em frase PT (`formatters.ts:441,567`); emojis fora da lista de Product-Rules 16 (⏳ 🔒 👋 💡); carregando com e sem reticências ("Criando", "Lendo arquivo" x "Enviando..."); "Seu acesso encerrou." (`pt.json:303`, `formatters.ts:146-147`) → "terminou"; títulos dos cards da home em Title Case (`pt.json:414-428`); `pt.json:432-433` título "meses" x descrição "semanas".

## D. Site (home), SEO e blog

- [x] **D1 ✔ robots bloqueia o ícone do app.** `src/app/robots.ts:18-19`: `disallow: "/app"` casa por prefixo com `/apple-touch-icon.png`. Não bloqueia `/api`, `/login`, `/r/`, `/payment`, `/open-whatsapp`. Os dois grupos são idênticos. Proposta: `["/app/", "/app$", "/api/", "/login", "/r/", "/payment"]` num grupo só.
- [x] **D2 Canonical da home vaza para outras páginas.** `src/app/layout.tsx:51-53` define `canonical: SITE_URL`; `/privacy`, `/terms`, `/login` não sobrescrevem, então dizem ao Google que são a home.
- [x] **D3 Sem `title.template`.** Posts do blog têm título sem a marca; privacy e terms sem description.
- [x] **D4 FAQ e home prometem mais do que o produto entrega.**
  `pt.json:497` "Todo feedback vem com áudio" e `:477` "o áudio da pronúncia" (áudio de feedback depende de `AUDIO_ROLLOUT_FRACTION`, padrão 0, `feedback-audio-service.ts:18`; `:394` "pode chegar em áudio" está certo);
  FAQ lista imagem, tradução e transcrição como sempre presentes (dependem de `IMAGE_/AUDIO_QUESTION_ROLLOUT_FRACTION`, padrão 0);
  `:432-433` "Resumo de progresso a qualquer momento" (não existe);
  `:501` "O acesso é feito com o seu número de telefone" (Google é a primeira opção);
  `:389` "Um comando muda o ritmo: as perguntas passam a chegar em sequência" (hoje é o Continuar).
  Depende do valor das envs em produção.
- [x] **D5 "Perguntas ao longo do dia" (cadência pausada).** `llms.txt` (rota, `:13`) e CTA de 4 posts: `expressoes-em-ingles-de-series.mdx:50`, `ingles-para-entrevista-de-emprego.mdx:64`, `ingles-para-intercambio-primeiro-mes.mdx:59`, `ingles-para-viagem-frases-essenciais.mdx:59`.
- [x] **D6 Headline começa por IA.** "Pratique inglês com IA..." (`pt.json:336`) e título de SEO. Product-Brief 12 diz que IA entra só como qualificador.
- [x] **D7 Footer com strings fixas.** `src/components/home/footer.tsx:35,42` em vez de `home.footer.terms/privacy` (`pt.json:525-526`); ano 2026 fixo; quatro grafias diferentes para os nomes das páginas legais.
- [x] **D8 Sem mudança: links atuais confirmados pelo dev (X já está comentado).** `src/components/shared/footer-social.tsx:9-39`: `facebook.com/fluizer` não bate com `usefluizer`; link de X conflita com "Sem Twitter/X" do Brief.
- [x] **D9 Nav sem links de seção.** `src/components/home/nav.tsx:38-47` só tem tema e Entrar; sem Preços, FAQ, Blog (blog só pelo footer).
- [ ] **D10 Sem prova social.** Aberto: depende de depoimento ou número real. Nenhum depoimento, número ou história do fundador; `public/images/avatars/avatar-1..5.png` sem uso.
- [x] **D11 Imagem de compartilhamento quadrada.** `/images/fluizer.png` 1200x1200 com card `summary`; alt "Fluizer". Ideal 1200x630 com `summary_large_image`.
- [x] **D12 Dados estruturados incompletos.** `src/lib/structured-data.ts:28-70`: sem Organization com `sameAs` na home, ofertas sem período de cobrança (262,80 parece pagamento único), sem oferta de trial.
- [x] **D13 Sitemap muda a data a cada request.** `src/app/sitemap.ts:12,30,35` usa `new Date()` em home, terms e privacy.
- [ ] **D14 Home, terms e privacy renderizadas a cada request.** Adiado pelo dev. `force-dynamic` no root layout (`layout.tsx:25`) por causa do cookie de tema.
- [ ] **D15 `/open-whatsapp` sem saída.** Adiado pelo dev. `src/app/open-whatsapp/route.ts` abre wa.me com "quero começar a praticar", mas o webhook não cria mais usuário. Nada linka para lá.
- [x] **D16 Blog: todos os posts com a mesma data e sem `updated`.** Todos `date: "2026-11-03"`; índice parece despejo em lote.
- [x] **D17 Blog: quase sem link interno.** Só `aprender-ingles-sem-intercambio.mdx:20` linka outro post; nenhum linka home ou `/#pricing`. Proposta: 2-3 links por post (repetição/curso/entendo; viagem/intercâmbio).
- [x] **D18 Blog: descrições longas.** Ex: `curso-de-ingles-e-pratica-diaria` com ~220 caracteres (ideal ~155).
- [x] **D19 Blog: `domain` só em 4 de 10 posts.** Os outros 6 levam ao `/app` genérico.
- [x] **D20 Blog: dados do EF EPI.** `nivel-de-ingles-no-brasil` cita posição 75/123, nota 482 etc. Conferido: os números de 2025 batem com a EF; o texto deixou de chamar 2025 de "mais recente". Pendente: o EF EPI 2026 saiu em 18/11/2026 (Brasil 73º de 117, nota 469 no relatório, fontes ainda divergem); atualizar o post para 2026 quando confirmado na página da EF.
- [x] **D21 Blog: áudio de um post vem do simulador.** `expressoes-em-ingles-de-series` usa `/audio/simulator/daily_life-1.ogg` (`practice-examples.ts:86`); o script de áudio do blog não cobre esse post.
- Conferido e ok: todos os posts de `BLOG_POST_ORDER` existem e vice-versa, capas e `pratica.webp` existem, nenhum travessão nos posts, todos com 2 CTAs, FAQ e prática.

## E. Legal

- [x] **E1 Privacidade diz que nenhum arquivo é guardado.** `src/app/privacy/page.tsx:117-120`. Falso: voz, imagens de material, imagens e áudios de pergunta ficam em `Media`, e a limpeza está pausada.
- [x] **E2 Privacidade: coleta desatualizada.** `:30-48` só fala de telefone e navegação. Falta e-mail e nome (Google), Stripe, lembrete por e-mail, cookie de atribuição, voz processada por Whisper/TTS.
- [x] **E3 Privacidade: itens de LGPD.** Base legal (art. 7), encarregado, transferência internacional (fornecedores de IA nos EUA), retenção depois de encerrar a conta, como excluir a conta, seção de cookies.
- [x] **E4 Sem consentimento de cookies.** GTM carrega sempre (`layout.tsx:93-104`) e a política cita Clarity (gravação de sessão) e GA.
- [x] **E5 Termos descrevem o produto antigo.** `src/app/terms/page.tsx:29-31` só upload (sem atividade por tema); `:75-77` cadastro só por telefone/WhatsApp; `:100` e `:190` suporte "via WhatsApp"; `:47` "7 dias" fixo; `:30` hífens como travessão; sem foro, idade mínima, contato.
- [x] **E6 Sem página de contato.** Único contato é o mailto dentro das páginas legais.

## F. Negócio (pequenos e com retorno)

- [x] **F1 Funil sem eventos.** `src/lib/analytics.ts:21-31` só tem `sign_up`, `login`, `begin_checkout`, `purchase`. Faltam: clique de CTA da home (domain, posição), troca de aba do simulador, `activity_created` (texto/material, domain), primeira resposta, `paywall_view` / trial expirado, ver planos, telefone confirmado / lembrete ativado, CTA do blog. Sem eles não dá para medir trial → Pro (meta de 5-8% no Brief).
- [ ] **F2 Trial acaba em silêncio.** Sem aviso de "termina amanhã", sem aviso de expirou, lembrete só para. Proposta: mensagem/e-mail D-1 e no dia, com link de planos, pelo cron de lembrete que já existe. Ligado ao A22.
- [ ] **F3 `purchase` só no navegador.** Disparado em `payment-success-toast.tsx:25`; perdido se fechar a aba; renovações nunca contam. Proposta: evento server-side a partir do webhook da Stripe.
- [x] **F4 Gatilhos de upgrade dentro do trial.** Brief 13 lista como pendente. Hoje só aparece texto depois de bloquear. Ex: "faltam N dias" na pill do trial.
- [x] **F5 Plano anual como padrão.** Brief diz anual por padrão; conferir no `PricingCard` da home.
- [ ] **F6 Indicação e captura de e-mail.** Não existe indicação (só o rótulo `USER_SOURCE.REFERRAL`), nem newsletter no blog. Waitlist coleta nome e telefone, mas o model é por e-mail (`waitlist-modal.tsx:36`).

## G. Docs e código morto

- [ ] **G1 CLAUDE.md desatualizado.** Diz PT-BR e EN-US, mas `src/locales/en.json` não existe e `src/i18n/request.ts` sempre carrega `pt.json`. Diz que o inbound passa por chat-dispatch → chat-compute, que hoje são stubs.
- [x] **G2 Rotas mortas.** `api/queue/chat-dispatch` e `chat-compute` (sempre sucesso), `api/queue/process-doc` + `process-doc-service.ts` (nada chama `publishDocProcessing`), `api/users/route.ts` (ecoa o body, protegido por `NEXT_PUBLIC_API_KEY`, que é pública).
- [x] **G3 Resto da cadência.** `AUTO_QUESTION_ENABLED` checado em `message-service.ts:1235,1254,1265,1276`, `practice-pill.ts:43`; `nextMessageAt` e `intervalMinutes` gravados sem efeito; branch `doc.status === "processing"` inalcançável (`activity-cron.service.ts:124`); `pause` com número parseado e ignorado (`parser.ts:125-131`); `confirm`/`cancel_no` só respondem "Nenhuma ação pendente".
- [ ] **G4 Product-Rules x código.**
  8.2 diz que checa o limite antes de avaliar; o código avalia e checa depois (`message-service.ts:1090`);
  1 lista só active/archived/cancelled; existe `paused`, `completed`, `abandoned`;
  1 diz resumo gerado uma vez por atividade; os dois caminhos passam `forceRegenerate: true`;
  2 diz que retomar reexibe a pergunta pendente; retomar convida a usar `/praticar` (`activity-service.ts:200-207`);
  11.1 diz que pagamento fora da Stripe vai para histórico; não existe model de pagamento;
  14 classifica tipos de mensagem (vídeo, figurinha); o webhook manda o mesmo redirecionamento para tudo.
- [x] **G5 Limpeza de doc travado só para quem já tem atividade.** `activity-cron.service.ts:95-116` percorre atividades e sempre pega as mesmas 100 (`activities.repo.ts:103-111`).
