# SalvaVendas API (Back-end & Database)

Este projeto é a API central do ecossistema **SalvaVendas**, responsável por gerenciar a persistência de dados, regras de negócio e relatórios de desempenho. O sistema utiliza uma arquitetura NoSQL para garantir flexibilidade e escalabilidade no registro de transações mobile.

---

## Tecnologias e Arquitetura

* **Node.js & Express:** Servidor para prover os endpoints consumidos pelo app mobile.
* **MongoDB Atlas:** Banco de Dados NoSQL em nuvem.
* **Aggregation Framework:** Utilizado para processamento complexo de dados e relatórios financeiros diretamente no banco.
* **Dotenv:** Gerenciamento seguro de credenciais de acesso.

---

## 📊 Modelagem de Dados (NoSQL)

A estrutura foi modelada focando em referenciamento entre coleções para manter a integridade dos dados de venda:

* **Coleção `usuarios`**: Armazena vendedores, contatos e o array de objetos de `metas`.
* **Coleção `clientes`**: Cadastro de clientes vinculados a um `usuario_id`.
* **Coleção `planos_servico`**: Catálogo de serviços com tipos e valores base.
* **Coleção `vendas`**: Documento central que relaciona as três coleções anteriores através de `ObjectId`.

---

## ⚙️ Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/LeonSlent/salvavendas-api.git](https://github.com/LeonSlent/salvavendas-api.git)
   cd salvavendas-api

2. **Instale as dependências:**
   ```Bash
   npm install

3. **Configuração do Ambiente:**
   Crie um arquivo .env na raiz (não versionado por segurança) com os seguintes parâmetros:
   Snippet de código
   MONGO_URI=mongodb+srv://<usuario>:<senha>@salva-vendas.5ybf2vu.mongodb.net/salvavendas
   PORT=3000

4. **Rodar a API:**
   ```Bash
   node index.js

**Documentação das Rotas (Endpoints)**


**Gestão de Usuários e Clientes**

POST /usuarios: Cadastra um novo vendedor (vínculo com metas).

POST /clientes: Cadastra um cliente (necessário enviar usuario_id do vendedor).


**Planos e Serviços**

POST /planos: Cria opções de planos (Mensal, Semestral, etc).


**Operações de Venda**

POST /vendas: Registra uma transação.

Payload esperado: { cliente_id, usuario_id, plano_id, valor_fechado }


**Task: Consultas e Inteligência de Dados**

GET /ganhos-mes: Implementação de Aggregation Pipeline para filtrar e somar o faturamento total das vendas realizadas no mês vigente.


**Desenvolvedor Responsável**

Leonardo Gonçalves Martins (Back-end & DBA)

Responsável pela infraestrutura de rede no MongoDB Atlas.

Modelagem de coleções e implementação de rotas de consulta (Aggregation).
