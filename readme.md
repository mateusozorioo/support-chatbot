# 🤖 Chatbot WhatsApp para Suporte

> Um chatbot inteligente e personalizável para automatizar o atendimento via WhatsApp em qualquer área de suporte!

## 📋 Sobre o Projeto

Este é um **modelo base de chatbot** desenvolvido para realizar o suporte automático em qualquer área desejada. Apenas alterando o que deve ser enviado pelo chatbot, você pode obter um ótimo resultado para sua empresa ou organização!

O bot utiliza uma **máquina de estados** para guiar o usuário através de um fluxo estruturado de perguntas, coletando informações essenciais para gerar solicitações de serviço completas.

## ✨ Funcionalidades

- 🔄 **Fluxo conversacional inteligente** com máquina de estados
- 📝 **Coleta estruturada de dados** do usuário e do problema
- 🎯 **Categorização de problemas** por tipo (TI, impressão, rede, etc.)
- ✅ **Validação de dados** em tempo real
- 🔁 **Opção de correção** de informações antes da finalização
- 💬 **Interface amigável** com indicadores de digitação
- 📱 **Totalmente integrado** com WhatsApp Web

## 🚀 Como Funciona

O chatbot guia o usuário através dos seguintes passos:

1. **Saudação inicial** e apresentação do bot
2. **Seleção do tipo de problema** (6 categorias disponíveis)
3. **Descrição detalhada** do problema
4. **Coleta de dados pessoais**:
   - Nome completo
   - Setor/Departamento
   - Centro de custo
   - Telefone
   - E-mail
   - Patrimônio dos equipamentos
5. **Confirmação dos dados** coletados
6. **Finalização** da solicitação de serviço

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **whatsapp-web.js** - API não oficial do WhatsApp
- **qrcode-terminal** - Geração de QR Code no terminal

## 📦 Instalação

1. **Clone o repositório**

   ```bash
   git clone https://github.com/seu-usuario/chatbot-whatsapp-suporte.git
   cd chatbot-whatsapp-suporte
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Execute o bot**

   ```bash
   node chatbot.js
   ```

4. **Escaneie o QR Code** que aparecerá no terminal com seu WhatsApp

## ⚙️ Configuração

### Personalizando os Tipos de Problema

Edite o objeto `problemTypes` no código para adaptar às suas necessidades:

```javascript
const problemTypes = {
  1: "Seu Tipo 1",
  2: "Seu Tipo 2",
  3: "Seu Tipo 3",
  // ... adicione quantos precisar
};
```

### Personalizando Mensagens

Todas as mensagens do bot podem ser editadas diretamente no código. Procure por `*TABORDA*` e substitua pelo nome do seu bot, depois ajuste as mensagens conforme necessário.

### Ajustando Campos de Coleta

Você pode modificar quais informações são coletadas editando os estados `ASKING_*` e adicionando/removendo campos no objeto `userState.data`.

## 🎨 Personalização

Este chatbot foi projetado para ser facilmente adaptável. Você pode:

- 🔧 **Modificar o fluxo** de conversação
- 📝 **Alterar as perguntas** coletadas
- 🎯 **Ajustar os tipos** de problema
- 💬 **Personalizar mensagens** e tom de voz
- 🔄 **Adicionar novos estados** conforme necessário

## 📱 Estados da Conversa

O bot utiliza os seguintes estados para controlar o fluxo:

- `INITIAL` - Estado inicial
- `WAITING_OK_START` - Aguarda confirmação para iniciar
- `WAITING_PROBLEM_TYPE` - Aguarda seleção do tipo de problema
- `WAITING_PROBLEM_DESCRIPTION` - Aguarda descrição do problema
- `WAITING_OK_QUESTIONS` - Aguarda confirmação para perguntas pessoais
- `ASKING_NAME` → `ASKING_PATRIMONY` - Coleta de dados pessoais
- `WAITING_CONFIRMATION` - Aguarda confirmação final
- `WAITING_RESTART_CHOICE` - Aguarda escolha de reinício

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📋 Roadmap

- [ ] Interface web para configuração
- [ ] Integração com sistemas de tickets
- [ ] Suporte a anexos de imagem
- [ ] Analytics e relatórios
- [ ] Múltiplos idiomas
- [ ] Integração com bancos de dados

## 📄 Licença

Este projeto está sob a **licença MIT**.

### 🇧🇷 O que isso significa na prática?

- ✅ **Pode usar** livremente (pessoal ou comercial)
- ✅ **Pode modificar** como quiser
- ✅ **Pode distribuir** e vender
- ⚠️ **Deve manter** os créditos do autor original
- ⚠️ **Sem garantias** - use por sua conta e risco

Veja o arquivo `LICENSE` para mais detalhes técnicos.

## 🆘 Suporte

Encontrou um bug ou tem uma sugestão?

- 🐛 Abra uma [issue](https://github.com/mateusozorioo/support-chatbot/issues)
- 💡 Ou entre em contato conosco

---

⭐ **Se este projeto te ajudou, não esqueça de dar uma estrela!** ⭐

Desenvolvido com ❤️ para automatizar e melhorar o atendimento ao cliente.
