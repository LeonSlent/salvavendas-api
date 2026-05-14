require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const PORT = 3000;

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('salvavendas'); 
    console.log("Conectado ao MongoDB Atlas!");
    
    // O servidor só inicia após a conexão com o banco ser confirmada
    app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Erro na conexão:", err);
    process.exit(1);
  }
}

connectDB();

// #################################### USUÁRIOS ####################################
// Rota de Cadastro de Usuário
app.post('/usuarios', async (req, res) => {
  try {
    const novoUsuario = {
      nome: req.body.nome,
      email: req.body.email,
      telefone: req.body.telefone,
      // Metas é um array de objetos
      metas: req.body.metas || [] 
    };
    
    const resultado = await db.collection('usuarios').insertOne(novoUsuario);
    res.status(201).json({ mensagem: "Usuário criado!", id: resultado.insertedId });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao salvar usuário", detalhe: error.message });
  }
});

// #################################### CLIENTES ####################################
// Rota de cadastro de clientes 
app.post('/clientes', async (req, res) => {
  try {
    const novoCliente = {
      usuario_id: new ObjectId(req.body.usuario_id), // Vendedor que cadastrou o cliente
      nome: req.body.nome,
      email: req.body.email,
      telefone: req.body.telefone,
      status: req.body.status || "ativo"
    };
    const resultado = await db.collection('clientes').insertOne(novoCliente);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao cadastrar cliente. Verifique o ID do usuário." });
  }
});

// #################################### PLANOS ####################################
// Rota para criação de planos
app.post('/planos', async (req, res) => {
  try {
    const novoPlano = {
      tipo_plano: req.body.tipo_plano,
      valor: req.body.valor,
      status: "ativo"
    };
    const resultado = await db.collection('planos_servico').insertOne(novoPlano);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// #################################### VENDAS ####################################
// Rota para criação de vendas
app.post('/vendas', async (req, res) => {
  try {
    const venda = {
      cliente_id: new ObjectId(req.body.cliente_id), // Cliente que comprou
      usuario_id: new ObjectId(req.body.usuario_id), // Usuario que vendeu
      plano_id: new ObjectId(req.body.plano_id), // Plano adquirido
      dta_venda: new Date(),
      valor_fechado: req.body.valor_fechado
    };
    const resultado = await db.collection('vendas').insertOne(venda);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ erro: "Dados de venda inválidos. Verifique os IDs informados." });
  }

});

  // Consulta do total de vendas do ultimo mes 
  app.get('/ganhos-mes', async (req, res) => {
  try {
    const dataAtual = new Date();
    // Define o início do mês atual 
    const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    // Define o fim do mês atual
    const fimMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0, 23, 59, 59);

    const relatorio = await db.collection('vendas').aggregate([
      {
        $match: {
          dta_venda: {
            $gte: inicioMes,
            $lte: fimMes
          }
        }
      },
      {
        $group: {
          _id: null, // Agrupa tudo em um único resultado
          totalGanhos: { $sum: "$valor_fechado" },
          quantidadeVendas: { $sum: 1 }
        }
      }
    ]).toArray();

    res.json(relatorio[0] || { totalGanhos: 0, quantidadeVendas: 0 });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao calcular ganhos", detalhe: error.message });
  }
});


// Consulta total de vendas dos ultimos 6 meses, separando mes a mes e o total final
app.get('/ganhos-geral-e-por-mes', async (req, res) => {
  try {
    const dataAtual = new Date();
    const seisMesesAtras = new Date();
    // Volta 6 meses no calendário
    seisMesesAtras.setMonth(dataAtual.getMonth() - 6);

    const relatorio = await db.collection('vendas').aggregate([
      {
        $match: {
          dta_venda: {
            $gte: seisMesesAtras,
            $lte: dataAtual
          }
        }
      },
      {
        $group: {
          _id: {
            ano: { $year: "$dta_venda" },
            mes: { $month: "$dta_venda" }
          },
          totalGanhos: { $sum: "$valor_fechado" },
          quantidadeVendas: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.ano": 1, "_id.mes": 1 } // Ordena do mais antigo para o mais recente
      }
    ]).toArray();

    // Calcula os totais gerais somando os valores de cada mês
    let totalGerais = {
      totalGanhos: 0,
      quantidadeVendas: 0
    };

    relatorio.forEach(item => {
      totalGerais.totalGanhos += item.totalGanhos;
      totalGerais.quantidadeVendas += item.quantidadeVendas;
    });

    // Retorna o objeto com ambos os resultados
    res.json({
      totalGeral: totalGerais,
      historicoMensal: relatorio
    });

  } catch (error) {
    res.status(500).json({ erro: "Erro ao calcular ganhos", detalhe: error.message });
  }
});

// Rota para consultar a meta atual do usuário
app.get('/usuarios/:id/meta-atual', async (req, res) => {
  try {
    const { id } = req.params;

    // Busca o usuário pelo ID
    const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

    // Verifica se o usuário existe
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Verifica se o usuário possui metas cadastradas
    if (!usuario.metas || usuario.metas.length === 0) {
      return res.status(404).json({ mensagem: "Nenhuma meta encontrada para este usuário" });
    }

    // Pega a meta atual (assumindo que a meta atual é a última inserida no array)
    const metaAtual = usuario.metas[usuario.metas.length - 1];

    res.json(metaAtual);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar meta", detalhe: error.message });
  }
});


// Pega os 5 clientes mais recentes
app.get('/clientes/recentes', async (req, res) => {
  try {
    const clientes = await db.collection('clientes')
      .find()
      .sort({ _id: -1 }) // -> Ordena do mais recente para o mais antigo
      .limit(5) // -> Pega apenas os 5 primeiros
      .toArray();

    res.json(clientes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar clientes", detalhe: error.message });
  }
});

// Pega todos os clientes
app.get('/clientes/total', async (req, res) => {
  try {
    const clientes = await db.collection('clientes')
      .find()
      .sort({ _id: -1 }) // -> Ordena do mais recente para o mais antigo
      .toArray();

    res.json(clientes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar clientes", detalhe: error.message });
  }
});