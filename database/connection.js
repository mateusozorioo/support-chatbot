// database/connection.js
require("dotenv").config();
const mysql = require("mysql2/promise");

// Configuração da conexão com o banco
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  timezone: "local",
};

// Pool de conexões para melhor performance
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Função para testar a conexão
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado ao banco MySQL com sucesso!");

    // Testa se as tabelas existem
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(
      "📋 Tabelas disponíveis:",
      tables.map((t) => Object.values(t)[0])
    );

    connection.release();
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error.message);
    console.error("Detalhes do erro:", error);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
