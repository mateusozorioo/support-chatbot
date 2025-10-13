// debug-connection.js
const mysql = require("mysql2/promise");

// Teste 1: Verificar se o MySQL2 está instalado
console.log("1. Verificando MySQL2...", mysql ? "✅" : "❌");

// Teste 2: Configuração básica
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "chatbot_user",
  password: "senha_segura_123",
  database: "chatbot_db",
};

console.log("2. Configuração:", dbConfig);

// Teste 3: Conexão sem pool
async function testBasicConnection() {
  console.log("\n3. Testando conexão básica...");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexão básica funcionou!");

    // Testa uma query simples
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ Query teste funcionou:", rows[0]);

    await connection.end();
  } catch (error) {
    console.log("❌ Erro na conexão básica:");
    console.log("Código do erro:", error.code);
    console.log("Mensagem:", error.message);
    console.log("SQL State:", error.sqlState);

    // Sugestões baseadas no erro
    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 POSSÍVEL SOLUÇÃO:");
      console.log("- O MySQL não está rodando");
      console.log("- Inicie o MySQL/XAMPP/WAMP");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 POSSÍVEL SOLUÇÃO:");
      console.log("- Usuário ou senha incorretos");
      console.log("- Verifique as credenciais no database.js");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\n💡 POSSÍVEL SOLUÇÃO:");
      console.log('- Banco de dados "chatbot_db" não existe');
      console.log("- Crie o banco de dados primeiro");
    }
  }
}

// Teste 4: Verificar se tabelas existem
async function testTables() {
  console.log("\n4. Testando existência das tabelas...");

  try {
    const connection = await mysql.createConnection(dbConfig);

    const tables = ["user_conversations", "message_logs", "support_tickets"];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`✅ Tabela ${table} existe`);
      } catch (error) {
        console.log(`❌ Tabela ${table} NÃO existe`);
      }
    }

    await connection.end();
  } catch (error) {
    console.log("❌ Não conseguiu verificar tabelas:", error.message);
  }
}

async function runTests() {
  await testBasicConnection();
  await testTables();
  process.exit(0);
}

runTests().catch(console.error);
