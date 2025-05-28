import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug');
    
    if (!projectSlug) {
      return NextResponse.json({ error: 'Project slug required' }, { status: 400 });
    }
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
    const manager = new DonationStripeManager(stripeSecretKey);
    const stats = await manager.getSubscriptionSummary(projectSlug);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
} 