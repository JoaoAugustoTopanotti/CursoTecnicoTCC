const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, currency, source } = req.body;

    try {
      const charge = await stripe.charges.create({
        amount,
        currency,
        source,
        description: 'Exemplo de cobrança',
      });
      res.status(200).json({ success: true, charge });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
