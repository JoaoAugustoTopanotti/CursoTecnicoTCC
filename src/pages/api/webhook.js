import { buffer } from 'micro'; // Certifique-se de importar o buffer corretamente
import * as admin from 'firebase-admin'; // Certifique-se de inicializar o Firestore corretamente

export const config = {
  api: {
    bodyParser: false, // Desativa o bodyParser para lidar com o Stripe webhook
  },
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        // Recupera os itens comprados na sessão
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 1,
        });

        const produtoId = session.metadata.produtoId; // Obtém o produtoId do metadata
        const quantidadeComprada = lineItems.data[0].quantity; // Quantidade do primeiro item comprado

        // Usa transações para garantir que o estoque seja atualizado corretamente
        const produtoRef = admin.firestore().doc(`Produtos/${produtoId}`);
        
        await admin.firestore().runTransaction(async (transaction) => {
          const produtoSnap = await transaction.get(produtoRef);

          if (!produtoSnap.exists) {
            throw new Error('Produto não encontrado.');
          }

          const produtoData = produtoSnap.data();
          const novaQuantidade = produtoData.Quantidade - quantidadeComprada;

          if (novaQuantidade < 0) {
            throw new Error('Estoque insuficiente.');
          }

          // Atualiza a quantidade no Firestore
          transaction.update(produtoRef, { Quantidade: novaQuantidade });

          // Registra a venda na coleção de Vendas
          const vendaRef = admin.firestore().collection('Vendas');
          transaction.set(vendaRef.doc(), {
            Itens: [
              {
                produtoId,
                Quantidade: quantidadeComprada,
                Preço: session.amount_total / 100, // Stripe usa centavos
              }
            ],
            data: admin.firestore.Timestamp.now(), // Data da venda
          });
        });

        res.status(200).json({ received: true });
      } catch (error) {
        console.error('Erro ao processar o pagamento:', error.message);
        res.status(500).send('Erro no processamento do webhook.');
      }
    } else {
      res.status(400).end();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
