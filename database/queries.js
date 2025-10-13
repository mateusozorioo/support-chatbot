// database/queries.js
const { pool } = require("./connection");

// ======================== USER CONVERSATIONS ========================

// Buscar estado do usuário
async function getUserConversation(userId) {
  try {
    console.log("🔍 Buscando conversa para userId:", userId);

    const [rows] = await pool.execute(
      "SELECT * FROM user_conversations WHERE user_id = ?",
      [userId]
    );

    console.log("📊 Resultado da consulta:", rows.length, "linhas encontradas");

    if (rows.length > 0) {
      const user = rows[0];
      console.log("📄 Dados brutos do banco:", {
        id: user.id,
        current_state: user.current_state,
        collected_data: user.collected_data,
        collected_data_type: typeof user.collected_data,
      });

      // Tratamento seguro do JSON
      let userData = {};
      if (user.collected_data) {
        try {
          // Se já for objeto, usa direto; se for string, faz parse
          userData =
            typeof user.collected_data === "string"
              ? JSON.parse(user.collected_data)
              : user.collected_data;
        } catch (e) {
          console.error("Erro no parse do JSON:", e);
          userData = {};
        }
      }

      const result = {
        id: user.id,
        state: user.current_state,
        data: userData,
        status: user.status,
      };

      console.log("✅ Resultado processado:", result);
      return result;
    }

    console.log("ℹ️  Usuário não encontrado, retornando null");
    return null; // Usuário não existe
  } catch (error) {
    console.error("❌ Erro ao buscar conversa:", error);
    throw error;
  }
}

// Criar ou atualizar estado do usuário
async function updateUserConversation(userId, state, data, status = "aberto") {
  try {
    const [result] = await pool.execute(
      `INSERT INTO user_conversations 
       (user_id, current_state, collected_data, status, updated_at) 
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       current_state = VALUES(current_state),
       collected_data = VALUES(collected_data),
       status = VALUES(status),
       updated_at = NOW()`,
      [userId, state, JSON.stringify(data), status]
    );

    return result.insertId || result.affectedRows;
  } catch (error) {
    console.error("Erro ao atualizar conversa:", error);
    throw error;
  }
}

// Resetar conversa do usuário (quando finaliza)
async function resetUserConversation(userId) {
  try {
    const [result] = await pool.execute(
      `UPDATE user_conversations
       SET 
         current_state = 'inicial',
         collected_data = '{}',
         status = 'aberto'
       WHERE user_id = ?`,
      [userId]
    );

    return result.affectedRows;
  } catch (error) {
    console.error("Erro ao resetar conversa:", error);
    throw error;
  }
}

// ======================== MESSAGE LOGS ========================

// Salvar mensagem no histórico
async function saveMessage(userId, messageText, messageType, userState) {
  try {
    // Buscar o user_conversation_id existente no banco para o usuário informado
    const [conversations] = await pool.execute(
      "SELECT id FROM user_conversations WHERE user_id = ?",
      [userId] // substitui o ? pelo valor de userId
    );

    // Se existir conversa vinculada ao userId, pega o primeiro id. Caso contrário, fica null
    const userConversationId =
      conversations.length > 0 ? conversations[0].id : null;

    // Insere um novo registro na tabela message_logs com as informações da mensagem
    const [result] = await pool.execute(
      `INSERT INTO message_logs 
       (user_conversation_id, user_id, message_text, message_type, user_state) 
       VALUES (?, ?, ?, ?, ?)`,
      [userConversationId, userId, messageText, messageType, userState]
      // os valores do array são passados nos "?" da query
    );

    // Retorna o ID do registro recém inserido
    return result.insertId;
  } catch (error) {
    // Caso ocorra algum erro, mostra no console
    console.error("Erro ao salvar mensagem:", error);
    // Propaga o erro para quem chamou a função
    throw error;
  }
}

// ======================== SUPPORT TICKETS ========================

// Gerar número único do ticket
function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6); // Últimos 6 dígitos

  return `TICK-${year}${month}${day}-${timestamp}`;
}

// Criar ticket finalizado
async function createTicket(userId, userData) {
  try {
    // Busca o user_conversation_id da tabela user_conversations
    // relacionado ao usuário informado
    const [conversations] = await pool.execute(
      "SELECT id FROM user_conversations WHERE user_id = ?",
      [userId] // substitui o ? pelo valor de userId
    );

    // Se encontrar conversas, pega o primeiro id; senão, mantém como null
    const userConversationId =
      conversations.length > 0 ? conversations[0].id : null;

    // Gera um número único para o ticket (função auxiliar não mostrada aqui)
    const ticketNumber = generateTicketNumber();

    // Insere os dados do ticket na tabela support_tickets
    const [result] = await pool.execute(
      `INSERT INTO support_tickets 
       (user_conversation_id, user_id, ticket_number, user_name, user_sector, 
        cost_center, phone, email, equipment_patrimony, problem_type, 
        problem_description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userConversationId, // ID da conversa do usuário (ou null)
        userId, // ID do usuário
        ticketNumber, // Número único do ticket
        userData.name || "", // Nome do usuário
        userData.sector || "", // Setor do usuário
        userData.costCenter || "", // Centro de custo
        userData.phone || "", // Telefone do usuário
        userData.email || "", // E-mail do usuário
        userData.patrimony || "Não informado", // Patrimônio (ou "Não informado")
        userData.problemType || "Não informado", // Tipo do problema relatado
        userData.problemDescription || "Não informado", // Descrição do problema
        userData.status, // Status dinâmico: "concluído" ou "inconcluído"
      ]
    );

    // Retorna o ID do ticket criado e o número do ticket
    return { ticketId: result.insertId, ticketNumber };
  } catch (error) {
    // Em caso de erro, exibe no console
    console.error("Erro ao criar ticket:", error);
    // Propaga o erro para quem chamou a função
    throw error;
  }
}

// ======================== UTILITY FUNCTIONS ========================

// Marcar conversas como "inconcluído" (executar periodicamente)
//Pega todas as conversas com status aberto.
//Verifica se o campo updated_at está sem atualização há mais de 90 minutos.
//Se sim → marca como inconcluído.

async function markIncompleteConversations() {
  try {
    // Buscar conversas abertas sem resposta há mais de 10 minutos
    const [conversations] = await pool.execute(
      `SELECT * FROM user_conversations 
        WHERE status = 'aberto' 
          AND current_state <> 'inicial'
          AND updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
    );

    for (const conv of conversations) {
      // Parseia o JSON da coluna collected_data (se vazio ou inválido, vira objeto vazio)
      let collectedData = {};
      try {
        collectedData = conv.collected_data
          ? JSON.parse(conv.collected_data)
          : {};
      } catch (err) {
        console.error("Erro ao parsear collected_data:", err);
      }

      const userData = {
        name: collectedData.name || "Não informado",
        sector: collectedData.sector || "Não informado",
        costCenter: collectedData.costCenter || "Não informado",
        phone: collectedData.phone || "Não informado",
        email: collectedData.email || "Não informado",
        patrimony: collectedData.patrimony || "Não informado",
        problemType: collectedData.problemType || "Não informado",
        problemDescription: collectedData.problemDescription || "Não informado",
        status: "inconcluído",
      };

      // Cria o ticket inconcluído
      await createTicket(conv.user_id, userData);

      await resetUserConversation(conv.user_id);
    }

    if (conversations.length > 0) {
      console.log(
        `🔄 ${conversations.length} conversas marcadas como inconcluídas e tickets criados`
      );
    }

    return conversations.length;
  } catch (error) {
    console.error("Erro ao marcar conversas incompletas:", error);
    throw error;
  }
}

// Buscar estatísticas gerais
async function getStatistics() {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM support_tickets) as total_tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE DATE(created_at) = CURDATE()) as tickets_hoje,
        (SELECT COUNT(*) FROM user_conversations WHERE status = 'aberto') as conversas_ativas,
        (SELECT COUNT(*) FROM user_conversations WHERE status = 'inconcluído') as conversas_incompletas
    `);

    return stats[0];
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    throw error;
  }
}

module.exports = {
  getUserConversation,
  updateUserConversation,
  resetUserConversation,
  saveMessage,
  createTicket,
  markIncompleteConversations,
  getStatistics,
};
