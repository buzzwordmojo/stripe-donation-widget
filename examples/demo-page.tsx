import React from 'react';
import { DonationWidget, DonationButton } from '../src';
import type { DonationConfig } from '../src/types';

// Example configuration
const config: DonationConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_example',
  projectName: "Object Journal",
  projectSlug: "object-journal",
  monthly: { 
    suggested: 5.00,
    min: 2.50,
    max: 50.00
  },
  annual: { 
    suggested: 50.00,
    min: 25.00,
    max: 500.00
  },
  goal: {
    target: 100,
    current: 25,
    showProgress: true,
    description: "Help keep this project running and growing",
    calculateFromSubscriptions: false // Set to true when you have real Stripe data
  },
  currency: 'usd',
  customAmounts: true,
  theme: 'auto'
};

export default function DemoPage() {
  const handleSuccess = (sessionId: string) => {
    console.log('Donation checkout initiated:', sessionId);
    // You could track this event, show a success message, etc.
  };

  const handleError = (error: Error) => {
    console.error('Donation error:', error);
    // You could show an error toast, track the error, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Support {config.projectName}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your support helps us continue developing and maintaining this project. 
            Choose a support level that works for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Main Donation Widget */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Choose Your Support Level</h2>
            <DonationWidget
              config={config}
              onSuccess={handleSuccess}
              onError={handleError}
              className="bg-white shadow-lg"
            />
          </div>

          {/* Quick Donation Buttons */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Quick Support Options</h2>
            
            <div className="space-y-4">
              <DonationButton
                config={config}
                type="monthly"
                amount={3}
                onSuccess={handleSuccess}
                onError={handleError}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                ☕ Buy me a coffee - $3/month
              </DonationButton>

              <DonationButton
                config={config}
                type="monthly"
                amount={10}
                onSuccess={handleSuccess}
                onError={handleError}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                🚀 Power User - $10/month
              </DonationButton>

              <DonationButton
                config={config}
                type="annual"
                amount={100}
                onSuccess={handleSuccess}
                onError={handleError}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              >
                ⭐ Annual Supporter - $100/year
              </DonationButton>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-3">Why Support Us?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Keep the project free and open source</li>
                <li>• Fund ongoing development and new features</li>
                <li>• Support hosting and infrastructure costs</li>
                <li>• Enable faster bug fixes and updates</li>
                <li>• Help us dedicate more time to the project</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Example */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Configuration Used</h2>
          <p className="text-gray-600 mb-4">
            This demo uses the following configuration. You can customize amounts, 
            goals, and styling to match your project.
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{JSON.stringify(config, null, 2)}</code>
          </pre>
        </div>

        {/* Setup Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">
            Setup Instructions
          </h2>
          <div className="space-y-4 text-blue-800">
            <p>To use this donation widget in your project:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Install the package: <code className="bg-blue-100 px-2 py-1 rounded">npm install stripe-donation-widget</code></li>
              <li>Set up your Stripe keys in environment variables</li>
              <li>Create the required API routes (see examples/api/)</li>
              <li>Import and use the components with your configuration</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 