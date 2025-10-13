require("dotenv").config();

// Importações da biblioteca do WhatsApp
const qrcode = require("qrcode-terminal");
const { Client, Buttons, List, MessageMedia } = require("whatsapp-web.js");

// Importações do banco de dados
const { testConnection } = require("./database/connection");
const {
  getUserConversation,
  updateUserConversation,
  resetUserConversation,
  saveMessage,
  createTicket,
  markIncompleteConversations,
} = require("./database/queries");

// Configuração do cliente WhatsApp
const client = new Client();

// Testa conexão com banco na inicialização
testConnection();

// Event listeners do WhatsApp
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Tudo certo! WhatsApp conectado.");

  // Job para marcar conversas incompletas (executa a cada 30 minutos)
  setInterval(markIncompleteConversations, 5 * 60 * 1000);
});

client.initialize();

// Função utilitária para delays
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Estados possíveis
const STATES = {
  INITIAL: "inicial",
  WAITING_OK_START: "Esperando primeiro 'Ok'",
  WAITING_PROBLEM_TYPE: "Esperando Tipo de Problema",
  WAITING_PROBLEM_DESCRIPTION: "Esperando Descrição do Problema",
  WAITING_OK_QUESTIONS: "Esperando 'Ok' para perguntas",
  ASKING_NAME: "Perguntando Nome",
  ASKING_SECTOR: "Perguntando Setor",
  ASKING_COST_CENTER: "Perguntando Centro de Custo",
  ASKING_PHONE: "Perguntando Telefone/Celular",
  ASKING_EMAIL: "Perguntando email",
  ASKING_PATRIMONY: "Perguntando Patrimônio(s)",
  WAITING_CONFIRMATION: "Esperando confirmação dos dados",
  WAITING_RESTART_CHOICE: "Esperando escolha de erro",
};

// Tipos de problemas
const problemTypes = {
  1: "Computador/notebook",
  2: "Impressão",
  3: "Internet",
  4: "Rede/Wifi",
  5: "Sistemas",
  6: "Outro",
};

// Event listener principal - MODIFICADO PARA USAR BANCO
client.on("message", async (msg) => {
  // Filtra apenas mensagens privadas
  if (!msg.from.endsWith("@c.us")) return;

  const userId = msg.from;
  const userMessage = msg.body.trim();

  try {
    // BUSCA ESTADO DO BANCO ao invés da memória
    let userState = await getUserConversation(userId);

    // Se não existe, cria novo registro
    if (!userState) {
      userState = {
        state: STATES.INITIAL,
        data: {},
        status: "aberto",
      };
    }

    // Salva mensagem do usuário no histórico
    await saveMessage(userId, userMessage, "user_input", userState.state);

    const chat = await msg.getChat();

    // Simula digitação
    await delay(1500);
    await chat.sendStateTyping();
    await delay(1500);

    // Variáveis para controlar mudanças
    let newState = userState.state;
    let newData = { ...userState.data };
    let botResponse = "";

    // Switch de estados (lógica mantida igual)
    switch (userState.state) {
      case STATES.INITIAL:
        await client.sendMessage(
          msg.from,
          "*TABORDA*\nOlá! Meu nome é Taborda! Sou o bot de suporte da GTI do."
        );

        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);

        await client.sendMessage(
          msg.from,
          "*TABORDA*\nPreciso que você responda algumas perguntas para que o seu problema possa ser resolvido o quanto antes!"
        );

        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);

        await client.sendMessage(
          msg.from,
          "*TABORDA*\n*Lembre-se: Responda tudo de forma clara e objetiva*"
        );

        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);

        botResponse = "*TABORDA*\nResponda *Ok* para continuar";
        await client.sendMessage(msg.from, botResponse);

        newState = STATES.WAITING_OK_START;
        break;

      case STATES.WAITING_OK_START:
        if (userMessage.toLowerCase() === "ok") {
          botResponse =
            "*TABORDA*\nInforme seu tipo de problema:\n\n*Digite:*\n1 - para *Computador/notebook*\n2 - para *Impressão*\n3 - para *Internet*\n4 - para *Rede/Wifi*\n5 - para *Sistemas*\n6 - para *Outro*";
          newState = STATES.WAITING_PROBLEM_TYPE;
        } else {
          botResponse = "Por favor, responda 'Ok' para continuar.";
        }
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.WAITING_PROBLEM_TYPE:
        if (userMessage >= "1" && userMessage <= "6") {
          newData.problemType = problemTypes[userMessage];

          await client.sendMessage(
            msg.from,
            "*TABORDA*\nTipo de problema anotado ✅"
          );

          await delay(2000);
          await chat.sendStateTyping();
          await delay(2000);

          botResponse =
            "*TABORDA*\nAgora, descreva com detalhes o seu problema. *Em uma única mensagem*";
          await client.sendMessage(msg.from, botResponse);

          newState = STATES.WAITING_PROBLEM_DESCRIPTION;
        } else {
          botResponse =
            "*TABORDA*\nPor favor, digite apenas um número de 1 a 6 para selecionar o tipo de problema.";
          await client.sendMessage(msg.from, botResponse);
        }
        break;

      case STATES.WAITING_PROBLEM_DESCRIPTION:
        if (userMessage.length > 20) {
          newData.problemDescription = userMessage;

          await client.sendMessage(
            msg.from,
            "*TABORDA*\nMuito bem, problema anotado ✅"
          );

          await delay(2000);
          await chat.sendStateTyping();
          await delay(2000);

          botResponse =
            "*TABORDA*\nAgora irei te fazer algumas perguntas para concluir a sua Solicitação de Serviço. *Digite OK* para continuar";
          await client.sendMessage(msg.from, botResponse);

          newState = STATES.WAITING_OK_QUESTIONS;
        } else {
          botResponse =
            "*TABORDA*\nA sua mensagem foi muito curta! Favor explicar com mais detalhes.";
          await client.sendMessage(msg.from, botResponse);
        }
        break;

      case STATES.WAITING_OK_QUESTIONS:
        if (userMessage.toLowerCase() === "ok") {
          botResponse = "*TABORDA*\nQual seu Nome Completo?";
          newState = STATES.ASKING_NAME;
        } else {
          botResponse = "*TABORDA*\nPor favor, responda 'Ok' para continuar.";
        }
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_NAME:
        newData.name = userMessage;
        botResponse = "*TABORDA*\nQual seu setor, área ou departamento?";
        newState = STATES.ASKING_SECTOR;
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_SECTOR:
        newData.sector = userMessage;
        botResponse = "*TABORDA*\nQual seu Centro de Custo?";
        newState = STATES.ASKING_COST_CENTER;
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_COST_CENTER:
        newData.costCenter = userMessage;
        botResponse = "*TABORDA*\nQual seu telefone?";
        newState = STATES.ASKING_PHONE;
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_PHONE:
        newData.phone = userMessage;
        botResponse = "*TABORDA*\nQual seu e-mail?";
        newState = STATES.ASKING_EMAIL;
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_EMAIL:
        newData.email = userMessage;
        botResponse =
          "*TABORDA*\nQual o Patrimônio dos equipamentos (se houver)?";
        newState = STATES.ASKING_PATRIMONY;
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.ASKING_PATRIMONY:
        newData.patrimony = userMessage;

        const confirmationMessage = `*TABORDA*
Ótimo! Para finalizar, por favor, confirme se os dados a seguir estão corretos:

☑ *Nome:* ${newData.name}
☑ *Setor:* ${newData.sector}
☑ *Centro de Custo:* ${newData.costCenter}
☑ *Telefone:* ${newData.phone}
☑ *E-mail:* ${newData.email}
☑ *Patrimônio:* ${newData.patrimony}

*Tipo do problema:* ${newData.problemType}
*E o problema é:* ${newData.problemDescription}`;

        await client.sendMessage(
          msg.from,
          "*TABORDA*\n🔁 Gerando Solicitação de Serviço"
        );

        await delay(2000);
        await chat.sendStateTyping();
        await delay(3500);

        await client.sendMessage(msg.from, confirmationMessage);

        await delay(2000);
        await chat.sendStateTyping();
        await delay(3500);

        botResponse =
          "*TABORDA*\n Podemos confirmar a abertura da solicitação?\n Digite *Sim* para confirmar e encerrar a conversa ou *Não* para alterar algum dado.";
        await client.sendMessage(msg.from, botResponse);

        newState = STATES.WAITING_CONFIRMATION;
        break;

      case STATES.WAITING_CONFIRMATION:
        if (userMessage.toLowerCase() === "sim") {
          // CRIA TICKET NO BANCO
          newData.status = "concluído";

          const ticket = await createTicket(userId, newData);

          botResponse = `*TABORDA*\nConversa encerrada.\n\n✅ Ticket #${ticket.ticketNumber} criado com sucesso!\n\nSua solicitação foi registrada e será analisada pela equipe de TI.`;
          await client.sendMessage(msg.from, botResponse);

          // RESETA CONVERSA DO BANCO
          await resetUserConversation(userId);

          // Salva mensagem final
          await saveMessage(userId, botResponse, "bot_response", "FINALIZADO");

          return; // Sai sem atualizar estado
        } else if (
          userMessage.toLowerCase() === "não" ||
          userMessage.toLowerCase() === "nao"
        ) {
          botResponse =
            "*TABORDA*\nAh, algum dado saiu errado. De onde deseja que eu comece novamente?\n\n*Digite:*\n1- Para que eu volte na pergunta do *Tipo de problema.*\n2- Para que eu volte na pergunta da *Descrição do problema.*\n3- Para que eu volte nas perguntas do *Seus dados e dos aparelhos problemáticos.*";
          newState = STATES.WAITING_RESTART_CHOICE;
        } else {
          botResponse =
            "*TABORDA*\nPor favor, responda 'Sim' para confirmar ou 'Não' para alterar algum dado.";
        }
        await client.sendMessage(msg.from, botResponse);
        break;

      case STATES.WAITING_RESTART_CHOICE:
        if (userMessage === "1") {
          botResponse =
            "*TABORDA*\nInforme seu tipo de problema:\n\n*Digite:*\n1 - para *Computador/notebook*\n2 - para *Impressão*\n3 - para *Internet*\n4 - para *Rede/Wifi*\n5 - para *Sistemas*\n6 - para *Outro*";
          newState = STATES.WAITING_PROBLEM_TYPE;
        } else if (userMessage === "2") {
          botResponse =
            "*TABORDA*\nPor favor, com detalhes, descreva o seu problema. *Em uma única mensagem!*";
          newState = STATES.WAITING_PROBLEM_DESCRIPTION;
        } else if (userMessage === "3") {
          botResponse = "*TABORDA*\nQual seu Nome Completo?";
          newState = STATES.ASKING_NAME;
        } else {
          botResponse =
            "*TABORDA*\nPor favor, digite apenas 1, 2 ou 3 para escolher de onde recomeçar.";
        }
        await client.sendMessage(msg.from, botResponse);
        break;

      default:
        newState = STATES.INITIAL;
        botResponse =
          "*TABORDA*\nOlá! Meu nome é Taborda! Sou o bot de suporte da GTI do . Preciso que você responda algumas perguntas para que o seu problema possa ser resolvido o quanto antes! *Lembre-se: Responda tudo de forma clara e objetiva.*\n\nResponda Ok para continuar";
        newState = STATES.WAITING_OK_START;
        await client.sendMessage(msg.from, botResponse);
        break;
    }

    // ATUALIZA ESTADO NO BANCO ao invés da memória
    if (
      newState !== userState.state ||
      JSON.stringify(newData) !== JSON.stringify(userState.data)
    ) {
      await updateUserConversation(userId, newState, newData, "aberto");
    }

    // Salva resposta do bot no histórico
    if (botResponse) {
      await saveMessage(userId, botResponse, "bot_response", newState);
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await client.sendMessage(
      msg.from,
      "*TABORDA*\nDesculpe, ocorreu um erro interno. Tente novamente em alguns instantes."
    );
  }
});
