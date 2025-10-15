const Stripe = require('stripe');
const db = require('./db');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

function getPriceIdForPlan(planId) {
    switch (planId) {
      case 'basic':
        return 'price_1Qw1a1LPWuXUw7NZXyJrz4yO'
      case 'intermediate':
        return 'price_1Qw1cGLPWuXUw7NZV2s2t6Qx'
      case 'advanced':
        return 'price_1Qw1ezLPWuXUw7NZUQ3fzgAZ'
      default:
        throw new Error('Invalid plan ID')
    }
}

function getPlanForPriceId(priceId) {
  switch (priceId) {
    case 'price_1Qw1a1LPWuXUw7NZXyJrz4yO':
      return 'basic'
    case 'price_1Qw1cGLPWuXUw7NZV2s2t6Qx':
      return 'intermediate'
    case 'price_1Qw1ezLPWuXUw7NZUQ3fzgAZ':
      return 'advanced'
    default:
      throw new Error('Invalid price ID')
  }
}

exports.checkSubscription = async (req, res) => {
  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Subscription ID is required' 
    });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const isActive = subscription.status === 'active' || 
                    subscription.status === 'trialing';
    
    const isGracePeriod = subscription.status === 'past_due' && 
                         new Date(subscription.current_period_end * 1000) > new Date();

    const priceId = subscription.items.data[0].price.id;
    const planName = getPlanForPriceId(priceId);

    res.status(200).json({
      success: true,
      isActive: isActive || isGracePeriod,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: planName,
      priceId: priceId
    });

  } catch (error) {
    console.error("Error checking subscription:", error);
    
    if (error.code === 'resource_missing') {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error checking subscription status'
    });
  }
};

exports.createCheckoutSession = async (req, res) => {
  const { planId, provider } = req.body;
  
  try {
    const priceId = getPriceIdForPlan(planId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pagamentos`,
      metadata: {
        provider_id: provider
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Error creating subscription' });
  }
};

exports.confirmSubscription = async (req, res) => {
  const { session_id, user_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });

    if (session.subscription && typeof session.subscription !== 'string') {
      const subscription = session.subscription;
      const plan = subscription.items.data[0].price;

      const subscriptionData = {
        user_id,
        stripe_subscription_id: subscription.id,
        plan_id: plan.id,
        plan_name: getPlanForPriceId(plan.id),
        amount: plan.unit_amount ? plan.unit_amount / 100 : 0,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        status: subscription.status,
      };

      const { rows } = await db.query(
        `INSERT INTO subscriptions 
          (user_id, stripe_subscription_id, plan_id, plan_name, amount, current_period_start, current_period_end, status) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
        [
          subscriptionData.user_id,
          subscriptionData.stripe_subscription_id,
          subscriptionData.plan_id,
          subscriptionData.plan_name,
          subscriptionData.amount,
          subscriptionData.current_period_start,
          null,
          subscriptionData.status,
        ]
      );

      res.status(201).json({ success: true, subscription: rows[0] });
    } else {
      throw new Error('Invalid subscription data');
    }
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ success: false, error: 'Error confirming subscription' });
  }
};

exports.cancelSubscription = async (req, res) => {
  const { user_id } = req.body;

  try {
    const { rows: subscriptionRows } = await db.query(
      `SELECT stripe_subscription_id 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'`,
      [user_id]
    );
    const subscription_id = subscriptionRows[0]?.stripe_subscription_id;
    if (!subscription_id) {
      return res.status(400).json({ success: false, error: 'Usuario não localizado' });
    }
  
    await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true
    });

    const { rows } = await db.query(
      `UPDATE subscriptions 
       SET status = $1,
           updated_at = NOW()
       WHERE stripe_subscription_id = $2
       RETURNING *`,
      ['canceled', subscription_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não encontrada no banco de dados'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      subscription: rows[0]
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    if (error.code === 'resource_missing') {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não localizada'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro no cancelamento da assinatura'
    });
  }
};
