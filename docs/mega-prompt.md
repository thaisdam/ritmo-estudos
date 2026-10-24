# Projeto: Ritmo, assinatura de plano de estudos com acompanhamento no WhatsApp

## Contexto
Ritmo é um serviço por assinatura para universitários (foco inicial em Uberlândia-MG: UFU, UNITRI, UNA, Pitágoras e outras) que precisam conciliar faculdade, curso de idiomas e cursos complementares. O aluno preenche um formulário com a sua rotina e objetivos; o fundador monta manualmente um plano de estudos semanal personalizado e faz check-ins pelo WhatsApp para cobrar constância.

Este é um MVP para testar a tese: **"universitários pagam uma assinatura mensal para ter um plano de estudos semanal e alguém que os acompanhe"**.

A venda é fechada pelo WhatsApp e o link de pagamento (Pix) é enviado manualmente. **NÃO implementar pagamento.**

## Stack e regras gerais
- Usar **Lovable Cloud** como back-end (banco, autenticação, RLS). Não usar banco externo.
- Português do Brasil em toda a interface. Moeda em R$ no formato pt-BR. Datas dd/mm/aaaa.
- Mobile first, totalmente responsivo.
- **NÃO gerar imagens com IA.** Usar ícones lucide-react, gradientes, formas e mockups feitos em CSS/SVG.
- Componentes shadcn/ui. Animações sutis (fade/slide ao rolar, hover nos cards e botões).
- SEO: title e meta description por página, um único H1 por página, HTML semântico.

## Identidade visual
- Nome: **Ritmo**
- Slogan: **"Faculdade, inglês e cursos no mesmo ritmo."**
- Cores (definir como tokens no design system, nunca hardcoded nos componentes):
  - primary `#6D5EF5` | primary-dark `#4B3FD1` | night `#0F172A`
  - accent `#FFB547` | background `#F7F7FB` | surface `#FFFFFF`
  - text `#1E1B2E` | muted `#6B7280` | success `#22C55E` | danger `#EF4444`
- Fontes (Google Fonts): **Plus Jakarta Sans** (títulos) e **Inter** (texto).
- Estilo: moderno, jovem e limpo, cantos arredondados (rounded-2xl), sombras suaves, gradiente de `#6D5EF5` para `#8B7CF8` no hero.

---

## Páginas públicas

### 1. Landing page (`/`)
Seções nesta ordem:
1. **Header fixo:** logo "Ritmo" (texto + ícone), links âncora (Como funciona, Planos, FAQ) e botão "Montar meu plano".
2. **Hero:** H1 "Faculdade, inglês e cursos no mesmo ritmo." Subtítulo: "Receba toda semana um plano de estudos feito para a sua rotina e um acompanhamento no WhatsApp para não deixar nada para trás." CTA primário "Montar meu plano" (vai para `/montar-plano`) e secundário "Ver planos". Ao lado, um mockup em CSS de um card "Plano da semana" com checklist (Seg, Ter, Qua) e uma bolha de WhatsApp: "E aí, conseguiu revisar Cálculo hoje? 💪".
3. **A dor:** 3 cards: "Matéria acumulando", "Prazo esquecido", "Curso extra parado na aula 3".
4. **Como funciona (3 passos):** 1) Conte sua rotina no formulário; 2) Receba seu plano semanal no WhatsApp; 3) Check-ins para manter o ritmo.
5. **O que você recebe:** plano semanal personalizado, lembretes de provas e entregas, check-ins, ajuste do plano toda semana.
6. **Planos** (3 cards, o do meio com selo "Mais escolhido"):
   - **Essencial, R$ 29,90/mês:** plano semanal + lembretes de provas + 1 check-in por semana.
   - **Foco, R$ 49,90/mês:** tudo do Essencial + 3 check-ins por semana (seg, qua, sex).
   - **Intensivo, R$ 89,90/mês:** tudo do Foco + check-in de segunda a sexta + 1 chamada de 20 min por semana.
   - Cada card tem o botão "Quero este", que leva a `/montar-plano?plano=essencial|foco|intensivo` com o plano pré-selecionado.
7. **Depoimentos:** 2 cards claramente marcados como "Exemplo ilustrativo".
8. **FAQ (accordion):**
   - Como pago? Por Pix, com link enviado pelo WhatsApp depois da conversa.
   - Posso cancelar? Sim, a qualquer momento, sem multa.
   - Serve para qualquer curso? Sim, o plano é montado a partir da sua grade.
   - Preciso instalar algum app? Não, tudo acontece pelo WhatsApp.
   - Quem monta o plano? Uma pessoa de verdade: um estudante de Ciência da Computação que vive essa mesma rotina.
9. **CTA final + Footer:** © Ritmo, Uberlândia-MG, link do WhatsApp e link discreto "Área do admin" (`/admin/login`).

**Botão flutuante de WhatsApp** em todas as páginas públicas:
`https://wa.me/5534999999999?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20Ritmo.`

### 2. Formulário "Monte seu plano" (`/montar-plano`)
Formulário em etapas (stepper com barra de progresso), validação com zod + react-hook-form e mensagens de erro em português.

- **Etapa 1, Sobre você:** nome completo*, WhatsApp* (máscara `(34) 99999-9999`), e-mail*, instituição* (select: UFU, UNITRI, UNA, Pitágoras, ESAMC, Outra; se Outra, mostrar campo de texto), curso*, período* (1º ao 10º).
- **Etapa 2, Sua rotina:** turno da faculdade* (manhã, tarde, noite, integral); faz curso de idiomas? (sim/não; se sim, qual idioma e em quais dias); cursos complementares online (texto livre, ex.: "Alura de React, curso de SQL"); trabalha ou faz estágio? (sim/não; se sim, horas por semana); horas livres por dia para estudar* (slider de 1 a 6).
- **Etapa 3, Seus objetivos:** maiores dificuldades* (múltipla escolha: procrastinação, esquecer prazos, não saber priorizar, cansaço, falta de constância, provas acumuladas); próximas provas/entregas (texto livre, opcional); objetivo principal do semestre* (texto curto); melhor horário para check-in* (manhã, tarde, noite).
- **Etapa 4, Seu plano:** escolher o plano* (cards Essencial/Foco/Intensivo, pré-selecionado pela URL), resumo de tudo o que foi preenchido e checkbox obrigatório: "Concordo em ser contatado pelo WhatsApp e com o uso dos meus dados para montar meu plano (LGPD)".

Ao enviar: inserir na tabela `leads` com status `novo` e redirecionar para `/obrigado`.

### 3. Página de sucesso (`/obrigado`)
- Mensagem: "Recebemos sua rotina, [primeiro nome]! 🎉 Agora é só chamar no WhatsApp para fechar seu plano."
- Botão grande "Falar no WhatsApp" abrindo `https://wa.me/5534999999999?text=<mensagem>` (mensagem codificada com `encodeURIComponent`) contendo:
  `Oi! Acabei de montar meu plano no Ritmo. Nome: ... | Curso: ... (período) - Instituição | Plano: ... | Horas livres/dia: ... | Dificuldades: ... | Próximas provas: ...`
- Os dados do resumo vêm do estado da navegação (o público **não** tem permissão de SELECT nos leads).
- Bloco "Próximos passos" (3 itens) e link para voltar à home.

---

## Painel de administração (`/admin`)
- `/admin/login`: login com e-mail e senha (Lovable Cloud Auth). Permitir criar conta, mas uma conta nova **não** tem acesso até ter o papel admin.
- Criar um trigger: quando um usuário com o e-mail **[SEU_EMAIL]** se cadastrar, inserir automaticamente o papel `admin` em `user_roles`. Nenhum outro usuário vira admin automaticamente.
- Ativar a auto-confirmação de e-mail para facilitar os testes do MVP.
- Todas as rotas `/admin/*` são protegidas: sem login vai para `/admin/login`; com login mas sem papel admin, mostra a tela "Acesso negado".
- Layout com sidebar (recolhível no mobile): Dashboard, Leads, Assinantes, Entregas, Lembretes, Sair.

### Dashboard (`/admin`)
- Cards: Leads novos (últimos 7 dias), Assinantes ativos, Receita mensal estimada (soma do valor mensal dos assinantes ativos), Entregas pendentes da semana, Check-ins de hoje, Lembretes atrasados.
- Lista "Hoje": entregas e lembretes do dia, com ação rápida para marcar como feito.
- Gráfico simples (recharts) de leads por dia nos últimos 14 dias.

### Leads (`/admin/leads`)
- Tabela: data, nome, curso/instituição, plano de interesse, status e ações. Busca por nome e filtro por status (novo, em contato, convertido, perdido).
- Ao clicar num lead: painel lateral (sheet) com todas as respostas do formulário, troca de status, campo de anotações e botão "Abrir WhatsApp" (wa.me com o número do lead e a mensagem "Oi, [nome]! Aqui é do Ritmo, vi que você montou seu plano...").
- Botão **"Converter em assinante"**: abre um modal já preenchido com os dados do lead (nome, WhatsApp, e-mail, instituição, curso, plano e valor do plano), com data de início = hoje e dia de vencimento = dia de hoje. Ao confirmar, cria o assinante vinculado ao lead (`lead_id`) e muda o lead para "convertido". Não permitir converter o mesmo lead duas vezes.

### Assinantes (`/admin/assinantes`)
- CRUD completo. Campos: nome, WhatsApp, e-mail, instituição, curso, plano (essencial/foco/intensivo), valor mensal (preenchido automaticamente pelo plano, mas editável), data de início, dia de vencimento (1 a 31), status (ativo, pausado, cancelado), pagamento do mês (pago, pendente), melhor horário de check-in e observações.
- Filtros por status e por plano. Badge colorido por status.
- Ação rápida "Marcar pagamento como pago/pendente".

### Entregas (`/admin/entregas`)
As entregas são o trabalho recorrente: plano semanal, check-in e chamada.
- Lista agrupada por dia da semana atual, com navegação para a semana anterior e a próxima.
- Campos: assinante, tipo (`plano_semanal`, `check_in`, `chamada`), data, status (pendente, feito, sem resposta) e anotações.
- Botão **"Gerar agenda da semana"**: para cada assinante ativo, cria (sem duplicar o que já existe na semana):
  - 1 `plano_semanal` na segunda-feira;
  - check-ins conforme o plano: Essencial = sexta; Foco = segunda, quarta e sexta; Intensivo = segunda a sexta;
  - 1 `chamada` na quarta para o plano Intensivo.
- Marcar como feito com um clique. Botão de WhatsApp do assinante em cada linha.

### Lembretes (`/admin/lembretes`)
- Campos: título, descrição, data e hora, assinante (opcional) e concluído.
- Abas: Hoje, Próximos, Atrasados, Concluídos. Os atrasados ficam destacados em vermelho.

---

## Banco de dados (Lovable Cloud)
- Enum `app_role` (`admin`); tabela `user_roles` (id, user_id → auth.users, role) e função `has_role(user_id, role)` SECURITY DEFINER para usar nas políticas. Nunca guardar o papel em profiles nem no client.
- `leads`: id, created_at, nome, whatsapp, email, instituicao, curso, periodo, turno, faz_idioma, idioma_detalhes, cursos_complementares, trabalha, horas_trabalho, horas_livres, dificuldades (text[]), proximas_provas, objetivo, horario_checkin, plano_interesse, consentimento_lgpd, status (default `novo`), anotacoes.
- `assinantes`: id, created_at, lead_id (nullable, unique), nome, whatsapp, email, instituicao, curso, plano, valor_mensal, data_inicio, dia_vencimento, status, pagamento_status, horario_checkin, observacoes.
- `entregas`: id, created_at, assinante_id (FK com on delete cascade), tipo, data, status, anotacoes. Restrição única (assinante_id, tipo, data) para não duplicar.
- `lembretes`: id, created_at, titulo, descricao, data_hora, assinante_id (nullable), concluido.

## Segurança (RLS em todas as tabelas)
- `leads`: visitantes anônimos e usuários autenticados podem **apenas INSERT** (com `consentimento_lgpd = true`). SELECT/UPDATE/DELETE apenas com `has_role(auth.uid(), 'admin')`.
- `assinantes`, `entregas`, `lembretes`: todas as operações apenas para admin.
- `user_roles`: cada usuário só lê o próprio papel; ninguém pode se promover pelo client.
- Validar tamanho e formato dos campos no front (zod) e com constraints no banco.
- Nenhuma chave secreta no código.

## Fora do escopo (manual de propósito)
Pagamento integrado, área logada do aluno, envio automático de WhatsApp, e-mail automático e geração automática do plano de estudos. Tudo isso é feito manualmente pelo fundador nesta fase.

## Dados de exemplo
Depois de criar as tabelas, inserir 5 leads, 3 assinantes (um de cada plano) e alguns lembretes fictícios para demonstrar o painel.
