// Importa biblioteca para gerar QR code no terminal
const qrcode = require("qrcode-terminal");
// Importa componentes da biblioteca do WhatsApp Web
const { Client, Buttons, List, MessageMedia } = require("whatsapp-web.js");
// Cria nova instância do cliente WhatsApp
const client = new Client();

// Event listener para capturar o QR code de autenticação
client.on("qr", (qr) => {
  // Gera e exibe o QR code no terminal em formato pequeno
  qrcode.generate(qr, { small: true });
});

// Event listener disparado quando a conexão é estabelecida com sucesso
client.on("ready", () => {
  console.log("Tudo certo! WhatsApp conectado.");
});

// Inicia a conexão do cliente WhatsApp
client.initialize();

// Função utilitária para criar delays (simula tempo de digitação)
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Objeto global que armazena o estado de cada conversa por ID do usuário
const userStates = {};

// Enum com todos os possíveis estados da máquina de estados
const STATES = {
  INITIAL: "initial", // Estado inicial da conversa
  WAITING_OK_START: "waiting_ok_start", // Aguardando confirmação para iniciar
  WAITING_PROBLEM_TYPE: "waiting_problem_type", // Aguardando seleção do tipo de problema
  WAITING_PROBLEM_DESCRIPTION: "waiting_problem_description", // Aguardando descrição do problema
  WAITING_OK_QUESTIONS: "waiting_ok_questions", // Aguardando confirmação para fazer perguntas pessoais
  ASKING_NAME: "asking_name", // Coletando nome do usuário
  ASKING_SECTOR: "asking_sector", // Coletando setor do usuário
  ASKING_COST_CENTER: "asking_cost_center", // Coletando centro de custo
  ASKING_PHONE: "asking_phone", // Coletando telefone
  ASKING_EMAIL: "asking_email", // Coletando email
  ASKING_PATRIMONY: "asking_patrimony", // Coletando patrimônio dos equipamentos
  WAITING_CONFIRMATION: "waiting_confirmation", // Aguardando confirmação dos dados
  WAITING_RESTART_CHOICE: "waiting_restart_choice", // Aguardando escolha de onde recomeçar
};

// Mapeamento dos números para tipos de problemas
const problemTypes = {
  1: "Computador/notebook",
  2: "Impressão",
  3: "Internet",
  4: "Rede/Wifi",
  5: "Sistemas",
  6: "Outro",
};

// Event listener principal que processa todas as mensagens recebidas
client.on("message", async (msg) => {
  // Filtra apenas mensagens de chats privados (ignora grupos)
  if (!msg.from.endsWith("@c.us")) return;

  // Extrai ID único do usuário e conteúdo da mensagem
  const userId = msg.from; //numero do usuário + @c.us para indicar mensagem privada
  const userMessage = msg.body.trim(); // Conteúdo da mensagem (ex: "oi")

  // Inicializa estado do usuário se for primeira interação
  if (!userStates[userId]) {
    userStates[userId] = {
      state: STATES.INITIAL, // Define estado inicial
      data: {}, // Objeto para armazenar dados coletados
    };
  }

  // Referência ao estado atual do usuário
  const userState = userStates[userId];
  // Obtém referência ao chat para enviar indicadores de digitação
  const chat = await msg.getChat(); // msg.getChat() → Método da biblioteca que retorna o objeto do chat

  // Simula tempo de processamento e digitação
  await delay(1500);
  await chat.sendStateTyping(); // Mostra "digitando..."
  await delay(1500);

  // Switch principal que controla o fluxo baseado no estado atual
  switch (userState.state) {
    case STATES.INITIAL:
      // Mensagem de boas-vindas e apresentação do bot
      await client.sendMessage(
        msg.from, // msg.from -> é o destino da mensagem
        "*TABORDA*\nOlá! Meu nome é Taborda! Sou o bot de suporte da área de TI."
      );

      // Simula digitação
      await delay(1500);
      await chat.sendStateTyping();
      await delay(1500);

      // Mensagem de boas-vindas e apresentação do bot
      await client.sendMessage(
        msg.from, // msg.from -> é o destino da mensagem
        "*TABORDA*\nPreciso que você responda algumas perguntas para que o seu problema possa ser resolvido o quanto antes!"
      );

      // Simula digitação
      await delay(1500);
      await chat.sendStateTyping();
      await delay(1500);

      // Mensagem de boas-vindas e apresentação do bot
      await client.sendMessage(
        msg.from, // msg.from -> é o destino da mensagem
        "*TABORDA*\n*Lembre-se: Responda tudo de forma clara e objetiva*"
      );

      // Simula digitação
      await delay(1500);
      await chat.sendStateTyping();
      await delay(1500);

      // Mensagem de boas-vindas e apresentação do bot
      await client.sendMessage(
        msg.from, // msg.from -> é o destino da mensagem
        "*TABORDA*\nResponda *Ok* para continuar"
      );

      // Transição para aguardar confirmação
      userState.state = STATES.WAITING_OK_START;
      break;

    case STATES.WAITING_OK_START:
      // Verifica se usuário digitou "ok" (case insensitive)
      if (userMessage.toLowerCase() === "ok") {
        // Apresenta menu de tipos de problemas
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nInforme seu tipo de problema:\n\n*Digite:*\n1 - para *Computador/notebook*\n2 - para *Impressão*\n3 - para *Internet*\n4 - para *Rede/Wifi*\n5 - para *Sistemas*\n6 - para *Outro*"
        );
        // Transição para aguardar seleção do tipo do problema
        userState.state = STATES.WAITING_PROBLEM_TYPE;
      } else {
        // Mensagem de erro para resposta inválida
        await client.sendMessage(
          msg.from,
          "Por favor, responda 'Ok' para continuar."
        );
      }
      break;

    case STATES.WAITING_PROBLEM_TYPE:
      // Valida se a entrada é um número entre 1 e 6
      if (userMessage >= "1" && userMessage <= "6") {
        const problemTypes = {
          1: "Computador/notebook",
          2: "Impressão",
          3: "Internet",
          4: "Rede/Wifi",
          5: "Sistemas",
          6: "Outros",
        };

        // Atribui o tipo de problema conforme a escolha
        userState.data.problemType = problemTypes[userMessage];

        // Solicita descrição detalhada
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nTipo de problema anotado ✅"
        );
        // Simula digitação
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);

        // Mensagem de boas-vindas e apresentação do bot
        await client.sendMessage(
          msg.from, // msg.from -> é o destino da mensagem
          "*TABORDA*\nAgora, descreva com detalhes o seu problema. *Em uma única mensagem*"
        );

        // Transição para aguardar descrição
        userState.state = STATES.WAITING_PROBLEM_DESCRIPTION;
      } else {
        // Mensagem de erro para seleção inválida
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPor favor, digite apenas um número de 1 a 6 para selecionar o tipo de problema."
        );
      }
      break;

    case STATES.WAITING_PROBLEM_DESCRIPTION:
      // Valida se a descrição tem pelo menos 20 caracteres
      if (userMessage.length > 20) {
        // Armazena a descrição do problema
        userState.data.problemDescription = userMessage;
        // Informa que fará perguntas pessoais
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nMuito bem, problema anotado ✅"
        );
        // Simula digitação
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);

        // Mensagem de boas-vindas e apresentação do bot
        await client.sendMessage(
          msg.from, // msg.from -> é o destino da mensagem
          "*TABORDA*\nAgora irei te fazer algumas perguntas para concluir a sua Solicitação de Serviço. *Digite OK* para continuar"
        );
        // Transição para aguardar confirmação das perguntas
        userState.state = STATES.WAITING_OK_QUESTIONS;
      } else {
        // Mensagem de erro para descrição muito curta
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nA sua mensagem foi muito curta! Favor explicar com mais detalhes."
        );
      }
      break;

    case STATES.WAITING_OK_QUESTIONS:
      // Verifica confirmação para iniciar perguntas pessoais
      if (userMessage.toLowerCase() === "ok") {
        // Primeira pergunta: nome completo
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nQual seu Nome Completo?"
        );
        // Transição para coleta do nome
        userState.state = STATES.ASKING_NAME;
      } else {
        // Mensagem de erro para resposta inválida
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPor favor, responda 'Ok' para continuar."
        );
      }
      break;

    case STATES.ASKING_NAME:
      // Armazena o nome informado
      userState.data.name = userMessage; // userMessage -> toda mensagem do usuário

      // Próxima pergunta: setor
      await client.sendMessage(
        msg.from,
        "*TABORDA*\nQual seu setor, área ou departamento?"
      );
      // Transição para coleta do setor
      userState.state = STATES.ASKING_SECTOR;
      break;

    case STATES.ASKING_SECTOR:
      // Armazena o setor informado
      userState.data.sector = userMessage;

      // Próxima pergunta: centro de custo
      await client.sendMessage(
        msg.from,
        "*TABORDA*\nQual seu Centro de Custo?"
      );
      // Transição para coleta do centro de custo
      userState.state = STATES.ASKING_COST_CENTER;
      break;

    case STATES.ASKING_COST_CENTER:
      // Armazena o centro de custo informado
      userState.data.costCenter = userMessage;

      // Próxima pergunta: telefone
      await client.sendMessage(msg.from, "*TABORDA*\nQual seu telefone?");
      // Transição para coleta do telefone
      userState.state = STATES.ASKING_PHONE;
      break;

    case STATES.ASKING_PHONE:
      // Armazena o telefone informado
      userState.data.phone = userMessage;

      // Próxima pergunta: email
      await client.sendMessage(msg.from, "*TABORDA*\nQual seu e-mail?");
      // Transição para coleta do email
      userState.state = STATES.ASKING_EMAIL;
      break;

    case STATES.ASKING_EMAIL:
      // Armazena o email informado
      userState.data.email = userMessage;

      // Última pergunta: patrimônio dos equipamentos
      await client.sendMessage(
        msg.from,
        "*TABORDA*\nQual o Patrimônio dos equipamentos (se houver)?"
      );
      // Transição para coleta do patrimônio
      userState.state = STATES.ASKING_PATRIMONY;
      break;

    case STATES.ASKING_PATRIMONY:
      // Armazena o patrimônio informado
      userState.data.patrimony = userMessage;

      // Constrói mensagem de confirmação com todos os dados coletados
      const confirmationMessage = `*TABORDA*
Ótimo! Para finalizar, por favor, confirme se os dados a seguir estão corretos:

☑ *Nome:* ${userState.data.name}
☑ *Setor:* ${userState.data.sector}
☑ *Centro de Custo:* ${userState.data.costCenter}
☑ *Telefone:* ${userState.data.phone}
☑ *E-mail:* ${userState.data.email}
☑ *Patrimônio:* ${userState.data.patrimony}

*Tipo do problema:* ${userState.data.problemType}
*E o problema é:* ${userState.data.problemDescription}`;

      // Próxima pergunta: mensagem de aviso de geração de solicitação
      await client.sendMessage(
        msg.from,
        "*TABORDA*\n🔁 Gerando Solicitação de Serviço"
      );

      // Simula digitação antes de enviar resumo
      await delay(2000);
      await chat.sendStateTyping();
      await delay(3500);

      // Envia mensagem de confirmação
      await client.sendMessage(msg.from, confirmationMessage);

      // Simula digitação antes de enviar resumo
      await delay(2000);
      await chat.sendStateTyping();
      await delay(3500);

      // Próxima pergunta: mensagem de aviso de geração de solicitação
      await client.sendMessage(
        msg.from,
        "*TABORDA*\n Podemos confirmar a abertura da solicitação?\n Digite *Sim* para confirmar e encerrar a conversa ou *Não* para alterar algum dado."
      );

      // Transição para aguardar confirmação final
      userState.state = STATES.WAITING_CONFIRMATION;
      break;

    case STATES.WAITING_CONFIRMATION:
      // Verifica se usuário confirmou os dados
      if (userMessage.toLowerCase() === "sim") {
        // Finaliza atendimento
        await client.sendMessage(msg.from, "*TABORDA*\nConversa encerrada");
        // Remove estado do usuário da memória (reset completo)
        delete userStates[userId];
      } else if (
        // Verifica se usuário quer recomeçar (aceita "não" e "nao")
        userMessage.toLowerCase() === "não" ||
        userMessage.toLowerCase() === "nao" ||
        userMessage.toLowerCase() === "Não" ||
        userMessage.toLowerCase() === "Nao"
      ) {
        // Apresenta opções de onde recomeçar
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nAh, algum dado saiu errado. De onde deseja que eu comece novamente?\n\n*Digite:*\n1- Para que eu volte na pergunta do *Tipo de problema.*\n2- Para que eu volte na pergunta da *Descrição do problema.*\n3- Para que eu volte nas perguntas do *Seus dados e dos aparelhos problemáticos.*"
        );
        // Transição para aguardar escolha de reinício
        userState.state = STATES.WAITING_RESTART_CHOICE;
      } else {
        // Mensagem de erro para resposta inválida
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPor favor, responda 'Sim' para confirmar ou 'Não' para alterar algum dado."
        );
      }
      break;

    case STATES.WAITING_RESTART_CHOICE:
      // Processa escolha de onde recomeçar
      if (userMessage === "1") {
        // Volta para seleção do tipo de problema
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nInforme seu tipo de problema:\n\n*Digite:*\n1 - para *Computador/notebook*\n2 - para *Impressão*\n3 - para *Internet*\n4 - para *Rede/Wifi*\n5 - para *Sistemas*\n6 - para *Outro*"
        );
        userState.state = STATES.WAITING_PROBLEM_TYPE;
      } else if (userMessage === "2") {
        // Volta para descrição do problema
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPor favor, com detalhes, descreva o seu problema. *Em uma única mensagem!*"
        );
        userState.state = STATES.WAITING_PROBLEM_DESCRIPTION;
      } else if (userMessage === "3") {
        // Volta para perguntas pessoais (nome)
        await client.sendMessage(msg.from, "Qual seu Nome Completo?");
        userState.state = STATES.ASKING_NAME;
      } else {
        // Mensagem de erro para opção inválida
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPor favor, digite apenas 1, 2 ou 3 para escolher de onde recomeçar."
        );
      }
      break;

    default:
      // Caso padrão para qualquer estado não reconhecido
      // Reinicia a conversa do início
      userState.state = STATES.INITIAL;
      await client.sendMessage(
        msg.from,
        "*TABORDA*\nOlá! Meu nome é Taborda! Sou o bot de suporte da área de TI. Preciso que você responda algumas perguntas para que o seu problema possa ser resolvido o quanto antes! *Lembre-se: Responda tudo de forma clara e objetiva.*\n\nResponda Ok para continuar"
      );
      // Define próximo estado
      userState.state = STATES.WAITING_OK_START;
      break;
  }
});
