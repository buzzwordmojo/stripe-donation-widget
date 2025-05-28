"use client";

import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../config";
import { useDonation } from "../hooks/use-donation";
import { useDonationStats } from "../hooks/use-donation-stats";
import type { DonationWidgetProps } from "../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Slider } from "../ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function DonationWidget({
  config,
  showProgress,
  goal,
  current,
  className = "",
  onSuccess,
  onError,
}: DonationWidgetProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "annual">("monthly");
  
  // Initialize slider values with suggested amounts
  const [monthlyAmount, setMonthlyAmount] = useState(config.monthly.suggested);
  const [annualAmount, setAnnualAmount] = useState(config.annual.suggested);
  
  const { createCheckoutSession, isLoading, error, clearError } = useDonation(config);
  const { stats, isLoading: statsLoading } = useDonationStats(config);

  // Determine goal values - use real data if available and enabled
  const shouldShowProgress = showProgress ?? config.goal?.showProgress ?? false;
  const goalTarget = goal ?? config.goal?.target ?? 0;
  
  let goalCurrent = current ?? config.goal?.current ?? 0;
  if (config.goal?.calculateFromSubscriptions && stats) {
    goalCurrent = stats.totalMRR;
  }

  const progressPercentage = goalTarget > 0 ? Math.min((goalCurrent / goalTarget) * 100, 100) : 0;

  const handleDonate = async (type: "monthly" | "annual") => {
    try {
      clearError();
      const amount = type === "monthly" ? monthlyAmount : annualAmount;
      await createCheckoutSession(type, amount);
      onSuccess?.('checkout-initiated');
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Donation failed");
      onError?.(error);
    }
  };

  const getMinAmount = (type: "monthly" | "annual") => {
    const suggested = type === "monthly" ? config.monthly.suggested : config.annual.suggested;
    const configMin = type === "monthly" ? config.monthly.min : config.annual.min;
    return configMin ?? Math.max(1, Math.round(suggested * 0.5));
  };

  const getMaxAmount = (type: "monthly" | "annual") => {
    const suggested = type === "monthly" ? config.monthly.suggested : config.annual.suggested;
    const configMax = type === "monthly" ? config.monthly.max : config.annual.max;
    return configMax ?? suggested * 10; // Default max is 10x suggested amount
  };

  // Generate preset amounts for quick selection
  const getPresetAmounts = (type: "monthly" | "annual") => {
    const suggested = type === "monthly" ? config.monthly.suggested : config.annual.suggested;
    const min = getMinAmount(type);
    const max = getMaxAmount(type);
    
    // Create 3-4 preset amounts around the suggested amount
    const presets = [
      Math.max(min, Math.round(suggested * 0.5)),
      suggested,
      Math.round(suggested * 2),
      Math.min(max, Math.round(suggested * 5))
    ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates
    
    return presets;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Support {config.projectName}
        </CardTitle>
        {config.goal?.description && (
          <p className="text-sm text-muted-foreground">{config.goal.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Progress */}
        {shouldShowProgress && goalTarget > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {formatCurrency(goalCurrent, config.currency)} / {formatCurrency(goalTarget, config.currency)}
                {config.goal?.calculateFromSubscriptions && (
                  <span className="text-muted-foreground ml-1">(MRR)</span>
                )}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progressPercentage)}% of monthly goal reached
              {statsLoading && config.goal?.calculateFromSubscriptions && (
                <span className="ml-2">
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                </span>
              )}
            </p>
          </div>
        )}

        {/* Donation Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "monthly" | "annual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(monthlyAmount, config.currency)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </div>

            {/* Amount Slider */}
            <div className="space-y-4">
              <Label>Choose your monthly support amount</Label>
              <div className="px-2">
                <Slider
                  value={[monthlyAmount]}
                  onValueChange={(value) => setMonthlyAmount(value[0])}
                  min={getMinAmount("monthly")}
                  max={getMaxAmount("monthly")}
                  step={0.5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(getMinAmount("monthly"), config.currency)}</span>
                <span>{formatCurrency(getMaxAmount("monthly"), config.currency)}</span>
              </div>
            </div>

            {/* Preset Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Quick amounts</Label>
              <div className="grid grid-cols-2 gap-2">
                {getPresetAmounts("monthly").map((amount) => (
                  <Button
                    key={amount}
                    variant={monthlyAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMonthlyAmount(amount)}
                    className="text-sm"
                  >
                    {formatCurrency(amount, config.currency)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleDonate("monthly")}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Donate ${formatCurrency(monthlyAmount, config.currency)}/month`
              )}
            </Button>
          </TabsContent>

          <TabsContent value="annual" className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(annualAmount, config.currency)}
                <span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Save {formatCurrency(Math.max(0, (monthlyAmount * 12) - annualAmount), config.currency)} per year
              </div>
            </div>

            {/* Amount Slider */}
            <div className="space-y-4">
              <Label>Choose your annual support amount</Label>
              <div className="px-2">
                <Slider
                  value={[annualAmount]}
                  onValueChange={(value) => setAnnualAmount(value[0])}
                  min={getMinAmount("annual")}
                  max={getMaxAmount("annual")}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(getMinAmount("annual"), config.currency)}</span>
                <span>{formatCurrency(getMaxAmount("annual"), config.currency)}</span>
              </div>
            </div>

            {/* Preset Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Quick amounts</Label>
              <div className="grid grid-cols-2 gap-2">
                {getPresetAmounts("annual").map((amount) => (
                  <Button
                    key={amount}
                    variant={annualAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnnualAmount(amount)}
                    className="text-sm"
                  >
                    {formatCurrency(amount, config.currency)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleDonate("annual")}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Donate ${formatCurrency(annualAmount, config.currency)}/year`
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe
        </p>
      </CardContent>
    </Card>
  );
} 