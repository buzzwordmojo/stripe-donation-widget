import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
    const manager = new DonationStripeManager(stripeSecretKey);
    const result = await manager.createCheckoutSession(sessionData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 