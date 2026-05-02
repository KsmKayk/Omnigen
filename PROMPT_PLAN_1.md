## Prompt 1 — Plano de desenvolvimento (sem gerar imagem/vídeo por IA, usando assets online)

Você é um Arquiteto de Software Sênior e Tech Lead. Sua tarefa é criar um plano de desenvolvimento extremamente detalhado, técnico e executável para uma aplicação web fullstack em Node.js + TypeScript.

O nome do projeto é **Omnigen**.

Você NÃO deve implementar código ainda.
Seu objetivo é criar um plano técnico completo de arquitetura, estrutura, fluxo, decisões técnicas, organização de pastas, integrações, contratos e setup.

Quero que você atue como um arquiteto experiente e escreva um plano de desenvolvimento real, como se fosse preparar um projeto profissional para produção.

---

## Contexto do projeto

O nome oficial do projeto é **Omnigen**.

Este nome deve ser usado:

* no planejamento
* na arquitetura
* na documentação
* no README
* na estrutura do projeto
* na identidade do produto

Além disso, existe um arquivo chamado `DESIGN.md`.

Este arquivo contém instruções de design e identidade visual do produto.

O plano deve considerar `DESIGN.md` como fonte oficial para:

* decisões visuais
* direção estética
* consistência de UI
* componentes visuais
* linguagem visual
* estilo da interface
* identidade do produto

Toda a arquitetura de frontend deve respeitar `DESIGN.md`.

---

## Objetivo da aplicação

Quero criar uma aplicação web onde o usuário digita um tema de vídeo (ex: “Zeus”) e a aplicação gera automaticamente conteúdo completo para vídeo curto ou vídeo longo.

Exemplo de fluxo:

* Usuário digita um tema (ex: Zeus)
* Usuário escolhe o tipo de vídeo:

  * vídeo curto
  * vídeo longo
* Usuário clica em “Gerar”
* Sistema retorna 3 sugestões de títulos
* Usuário escolhe 1 título
* Sistema gera automaticamente:

  * roteiro completo
  * assets visuais (buscar imagens e vídeos online, NÃO gerar por IA)
  * dublagem (TTS)
  * legendas
  * thumbnails
  * vídeo final
  * tags
  * descrição

Ao final, o sistema deve retornar ao usuário:

* título do vídeo
* 3 thumbnails
* vídeo final
* roteiro
* tags sugeridas
* descrição sugerida

---

## Regra crítica de arquitetura

A arquitetura deve ser **simples, síncrona e linear**.

Não quero uma arquitetura complexa com:

* filas
* workers
* processamento paralelo
* jobs assíncronos
* filas distribuídas
* orquestração complexa
* cache de assets
* cache de pipeline

Nesta V1, tudo deve acontecer em **tempo real**, em fluxo linear e síncrono.

O sistema deve processar a geração ponta a ponta de forma sequencial:

1. gerar títulos
2. gerar roteiro
3. buscar assets
4. gerar TTS
5. gerar legendas
6. compor vídeo
7. gerar thumbnails
8. gerar tags
9. gerar descrição
10. retornar resultado

Sem paralelismo.
Sem filas.
Sem workers.
Sem cache.

A prioridade é:

* simplicidade
* previsibilidade
* facilidade de implementação
* facilidade de debug
* menor complexidade operacional

A arquitetura deve ser planejada para funcionar bem dessa forma.

---

## Regra crítica de progresso no frontend

Como toda a pipeline ocorrerá em tempo real e de forma síncrona, o frontend deve obrigatoriamente exibir uma barra de progresso durante toda a execução.

Essa barra de progresso é obrigatória.

O usuário precisa acompanhar visualmente cada etapa da geração em tempo real.

O frontend deve exibir:

* progresso atual
* etapa atual
* percentual
* status da etapa
* possíveis erros
* etapa concluída
* etapa em execução

Exemplo de etapas:

1. Gerando títulos
2. Gerando roteiro
3. Buscando imagens
4. Buscando vídeos
5. Gerando narração
6. Gerando legendas
7. Renderizando vídeo
8. Gerando thumbnails
9. Gerando descrição
10. Finalizando

O plano deve explicar:

* como o backend emitirá progresso
* como o frontend receberá progresso
* como modelar estados
* como exibir progresso por etapa
* como tratar falhas por etapa
* como permitir retry
* como manter UX clara durante processamento longo

Essa barra de progresso substitui a necessidade de jobs, filas e processamento em paralelo.

---

## Regra crítica de design

O visual do produto deve ter aparência **comercial, moderna e profissional**.

Não quero aparência de MVP genérico.
Não quero aparência de dashboard improvisado.
Não quero aparência de protótipo técnico.

Quero aparência de produto comercial real.

A interface deve transmitir:

* produto premium
* produto confiável
* produto profissional
* produto comercializável
* produto pronto para cliente

O frontend deve ser planejado com foco em:

* visual comercial
* UI moderna
* UX limpa
* hierarquia visual forte
* clareza
* consistência
* legibilidade
* sensação de produto SaaS premium

Toda decisão de frontend deve respeitar:

1. aparência comercial
2. consistência com `DESIGN.md`
3. qualidade visual de produto real

---

## Regra crítica de documentação

O projeto deve possuir um `README.md` impecável.

O README deve ser tratado como parte crítica do produto.

Não quero um README genérico.
Não quero um README técnico mínimo.
Não quero um README incompleto.

Quero um README impecável, profissional e comercial.

O plano deve prever a criação de um `README.md` de alta qualidade contendo:

* visão do produto
* proposta de valor
* overview da arquitetura
* stack
* setup local
* instalação
* configuração
* execução
* testes
* estrutura de pastas
* fluxo da aplicação
* decisões técnicas
* observabilidade
* troubleshooting
* roadmap
* convenções
* documentação de ambiente
* instruções de desenvolvimento
* instruções de contribuição

O `README.md` deve ser:

* profissional
* claro
* bonito
* bem estruturado
* fácil de navegar
* excelente para onboarding
* excelente para portfólio
* excelente para uso comercial

O plano deve tratar o README como artefato obrigatório de alta prioridade.

---

## Regra crítica de linguagem

Todo o código do projeto deve ser escrito em **inglês**.

Isso inclui obrigatoriamente:

* nomes de arquivos
* nomes de pastas
* nomes de variáveis
* nomes de funções
* nomes de classes
* nomes de tipos
* nomes de interfaces
* nomes de tabelas
* nomes de colunas
* nomes de testes
* nomes de logs
* nomes de commits
* nomes de branches
* comentários de código
* documentação técnica no repositório

Tudo no código e na camada técnica deve ser escrito em inglês.

Exceções:

* interfaces visuais para o usuário podem estar em português
* textos exibidos ao usuário podem estar em português
* outputs finais para o usuário podem estar em português

Regra obrigatória:

* camada técnica em inglês
* camada de produto/interface em português

Essa separação deve ser tratada como regra arquitetural obrigatória.

---

## Regra crítica de versionamento

O projeto deve seguir **commits semânticos (Conventional Commits)** obrigatoriamente.

Todo desenvolvimento deve ser dividido em pequenas entregas incrementais com commits semânticos.

Cada funcionalidade implementada deve gerar seus próprios commits semânticos.

Os commits devem:

* ser atômicos
* representar uma única responsabilidade
* seguir padrão semântico
* ser escritos em inglês
* ser legíveis
* documentar claramente a evolução do projeto

Formato obrigatório:

* `feat:`
* `fix:`
* `refactor:`
* `test:`
* `docs:`
* `chore:`

---

## Regra crítica de qualidade para commits

Nenhum commit pode ser realizado se todos os testes não estiverem passando.

Essa regra é obrigatória.

Commit só pode acontecer quando:

* todos os testes passaram
* lint passou
* typecheck passou
* build passou (quando aplicável)

---

## Regra crítica de desenvolvimento

Todo o projeto deve ser planejado e implementado com **TDD (Test Driven Development)**.

Isso é obrigatório.

Toda feature deve seguir:

1. escrever teste
2. validar falha
3. implementar mínimo necessário
4. validar sucesso
5. refatorar

TDD deve ser tratado como regra arquitetural obrigatória.

---

## Regra crítica de formato do vídeo

O usuário deve obrigatoriamente escolher o formato do vídeo antes da geração.

A aplicação deve suportar dois modos:

### 1. Vídeo curto

* proporção obrigatória: 9:16
* duração obrigatória: entre 45s e 60s
* template obrigatório de roteiro: `short_template.txt`

### 2. Vídeo longo

* proporção obrigatória: 16:9
* duração obrigatória: entre 10m e 12m
* template obrigatório de roteiro: `long_template.txt`

---

## Regra crítica desta versão

Nesta versão, o sistema NÃO deve gerar imagens ou vídeos por IA.

Ao invés disso:

* buscar imagens online
* buscar vídeos online
* baixar assets
* normalizar assets
* usar assets externos no vídeo final

As imagens e vídeos podem ser pesquisados em qualquer lugar da internet.

---

## Regra crítica de observabilidade

A aplicação deve possuir sistema de logs completo e observabilidade ponta a ponta.

Eu quero logs em toda a aplicação.

---

## Requisito obrigatório de logs no frontend

A aplicação deve possuir uma terceira aba no frontend chamada **Logs**.

A aplicação terá 3 abas:

1. principal
2. histórico
3. logs

A aba **Logs** deve permitir:

* visualizar logs do frontend
* visualizar logs do backend
* pesquisar dentro dos logs
* filtrar logs
* acompanhar logs em tempo real

---

## Stack obrigatória

* Backend: Node.js
* Linguagem: TypeScript
* Frontend: você deve sugerir (preferencialmente Next.js)
* Banco: SQLite
* ORM: você deve sugerir
* IA texto / roteiros / prompts: OpenRouter usando openrouter/sdk
* TTS: Piper local
* Renderização de vídeo: FFmpeg
* Legendas: gerar automaticamente via roteiro
* Imagens/Vídeos: buscar online (NÃO gerar por IA)

---

## Regra obrigatória do TTS

O TTS deve usar Piper localmente.

Considere como contrato obrigatório de execução o seguinte comando:

`python -m piper -m {modelo_de_audio} -f {nome_arquivo}.wav -- '{texto para audio}'`

---

## Estrutura obrigatória de templates

O projeto deve obrigatoriamente possuir esta estrutura:

prompts_templates/

* text_templates/
* image_templates/
* video_templates/
* tts_templates/

A pasta `text_templates` deve obrigatoriamente conter, no mínimo:

* `title_generation_template.txt`
* `short_template.txt`
* `long_template.txt`

---

## Fluxo do usuário

Usuário entra no site
→ digita tema
→ escolhe tipo de vídeo (curto ou longo)
→ clica em gerar
→ acompanha barra de progresso
→ escolhe 1 título
→ acompanha barra de progresso
→ sistema gera vídeo completo
→ sistema exibe resultado final

A aplicação terá 3 abas:

1. principal
2. histórico
3. logs

---

## Fluxo interno do sistema

Descreva tecnicamente o pipeline interno:

1. usuário envia tema
2. usuário escolhe tipo de vídeo
3. sistema gera títulos
4. usuário escolhe título
5. sistema gera roteiro
6. sistema busca assets
7. sistema gera TTS
8. sistema gera legendas
9. sistema renderiza vídeo
10. sistema gera thumbnails
11. sistema gera tags
12. sistema gera descrição
13. sistema salva histórico
14. sistema registra logs
15. sistema retorna resultado

Tudo deve ocorrer em fluxo linear, síncrono e com progresso em tempo real no frontend.

---

## O que eu quero na sua resposta

Quero um plano de desenvolvimento profissional e completo contendo:

1. Visão geral da arquitetura
2. Estratégia de branding do Omnigen
3. Estratégia de design baseada em `DESIGN.md`
4. Estratégia de README
5. Estratégia de arquitetura síncrona
6. Estratégia de progresso em tempo real
7. Estratégia de linguagem
8. Estratégia de commits semânticos
9. Estratégia de TDD
10. Stack recomendada
11. Estrutura de pastas completa
12. Arquitetura backend
13. Arquitetura frontend
14. Arquitetura de logs
15. Banco de dados
16. Pipeline de geração
17. Pipeline de busca de assets
18. Pipeline de TTS
19. Pipeline de renderização
20. Estratégia para vídeos curtos vs longos
21. Sistema de templates
22. Estratégia de histórico
23. Setup local completo
24. Como configurar OpenRouter
25. Como configurar Piper
26. Como configurar FFmpeg
27. Como configurar SQLite
28. Como rodar localmente
29. Estratégia de testes
30. Riscos técnicos
31. Roadmap de implementação por fases

Não escreva código ainda.
Escreva apenas o plano técnico completo.
