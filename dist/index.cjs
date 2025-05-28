'use strict';

var jsxRuntime = require('react/jsx-runtime');
var lucideReact = require('lucide-react');
var zod = require('zod');
var React = require('react');
var clsx = require('clsx');
var tailwindMerge = require('tailwind-merge');
var classVarianceAuthority = require('class-variance-authority');
var LabelPrimitive = require('@radix-ui/react-label');
var ProgressPrimitive = require('@radix-ui/react-progress');
var SliderPrimitive = require('@radix-ui/react-slider');
var TabsPrimitive = require('@radix-ui/react-tabs');
var Stripe = require('stripe');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);
var LabelPrimitive__namespace = /*#__PURE__*/_interopNamespaceDefault(LabelPrimitive);
var ProgressPrimitive__namespace = /*#__PURE__*/_interopNamespaceDefault(ProgressPrimitive);
var SliderPrimitive__namespace = /*#__PURE__*/_interopNamespaceDefault(SliderPrimitive);
var TabsPrimitive__namespace = /*#__PURE__*/_interopNamespaceDefault(TabsPrimitive);

const donationConfigSchema = zod.z.object({
    stripePublishableKey: zod.z.string().min(1, 'Stripe publishable key is required'),
    projectName: zod.z.string().min(1, 'Project name is required'),
    projectSlug: zod.z.string()
        .min(1, 'Project slug is required')
        .regex(/^[a-z0-9-]+$/, 'Project slug must contain only lowercase letters, numbers, and hyphens'),
    monthly: zod.z.object({
        suggested: zod.z.number().positive('Monthly suggested amount must be positive'),
        min: zod.z.number().min(0, 'Monthly minimum amount must be non-negative').optional(),
        max: zod.z.number().positive().optional(),
    }).refine(data => !data.max || !data.min || data.max >= data.min, {
        message: 'Monthly maximum must be greater than or equal to minimum',
    }),
    annual: zod.z.object({
        suggested: zod.z.number().positive('Annual suggested amount must be positive'),
        min: zod.z.number().min(0, 'Annual minimum amount must be non-negative').optional(),
        max: zod.z.number().positive().optional(),
    }).refine(data => !data.max || !data.min || data.max >= data.min, {
        message: 'Annual maximum must be greater than or equal to minimum',
    }),
    goal: zod.z.object({
        target: zod.z.number().positive('Goal target must be positive'),
        current: zod.z.number().min(0, 'Goal current amount must be non-negative').optional().default(0),
        showProgress: zod.z.boolean().optional().default(true),
        description: zod.z.string().optional(),
        calculateFromSubscriptions: zod.z.boolean().optional().default(false),
    }).optional(),
    theme: zod.z.enum(['light', 'dark', 'auto']).optional().default('auto'),
    customAmounts: zod.z.boolean().optional().default(true),
    successUrl: zod.z.string().url().optional(),
    cancelUrl: zod.z.string().url().optional(),
    currency: zod.z.string().length(3).optional().default('usd'),
});
function validateDonationConfig(config) {
    return donationConfigSchema.parse(config);
}
function generateProductIds(projectSlug) {
    return {
        monthly: `${projectSlug}-monthly-donation`,
        annual: `${projectSlug}-annual-donation`,
    };
}
function formatCurrency(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount);
}
function getDefaultUrls(baseUrl) {
    const base = (typeof window !== 'undefined' ? window.location.origin : '');
    return {
        successUrl: `${base}/donation/success`,
        cancelUrl: `${base}/donation/cancel`,
    };
}
function getDefaultMinAmount(suggestedAmount) {
    // Default minimum is 50% of suggested amount, with a floor of $1
    return Math.max(1, Math.round(suggestedAmount * 0.5));
}

function useDonation(config) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    // Validate config on hook initialization
    const validatedConfig = validateDonationConfig(config);
    const clearError = React.useCallback(() => {
        setError(null);
    }, []);
    const createCheckoutSession = React.useCallback(async (type, customAmount) => {
        try {
            setIsLoading(true);
            setError(null);
            // Determine the amount to use
            const configAmount = type === 'monthly'
                ? validatedConfig.monthly.suggested
                : validatedConfig.annual.suggested;
            const amount = customAmount || configAmount;
            // Validate amount against config limits
            const limits = type === 'monthly' ? validatedConfig.monthly : validatedConfig.annual;
            const minAmount = limits.min ?? getDefaultMinAmount(limits.suggested);
            if (amount < minAmount) {
                throw new Error(`Amount must be at least ${minAmount}`);
            }
            if (limits.max && amount > limits.max) {
                throw new Error(`Amount must not exceed ${limits.max}`);
            }
            // Get default URLs if not provided
            const { successUrl, cancelUrl } = getDefaultUrls();
            const sessionData = {
                type,
                amount,
                projectSlug: validatedConfig.projectSlug,
                projectName: validatedConfig.projectName,
                successUrl: validatedConfig.successUrl || successUrl,
                cancelUrl: validatedConfig.cancelUrl || cancelUrl,
            };
            // Call the API to create checkout session
            const response = await fetch('/api/donation/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create checkout session');
            }
            const { sessionId, url } = await response.json();
            // Redirect to Stripe Checkout
            if (url) {
                window.location.href = url;
            }
            else {
                throw new Error('No checkout URL received');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            console.error('Donation checkout error:', err);
        }
        finally {
            setIsLoading(false);
        }
    }, [validatedConfig]);
    return {
        createCheckoutSession,
        isLoading,
        error,
        clearError,
    };
}

function cn(...inputs) {
    return tailwindMerge.twMerge(clsx.clsx(inputs));
}

// packages/react/compose-refs/src/compose-refs.tsx
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}

// src/slot.tsx
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
  const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
  const Slot2 = React__namespace.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = React__namespace.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React__namespace.Children.count(newElement) > 1) return React__namespace.Children.only(null);
          return React__namespace.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return /* @__PURE__ */ jsxRuntime.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children: React__namespace.isValidElement(newElement) ? React__namespace.cloneElement(newElement, void 0, newChildren) : null });
    }
    return /* @__PURE__ */ jsxRuntime.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}
var Slot = /* @__PURE__ */ createSlot("Slot");
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
  const SlotClone = React__namespace.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (React__namespace.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== React__namespace.Fragment) {
        props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
      }
      return React__namespace.cloneElement(children, props2);
    }
    return React__namespace.Children.count(children) > 1 ? React__namespace.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
function isSlottable(child) {
  return React__namespace.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

const buttonVariants = classVarianceAuthority.cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Button = React__namespace.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (jsxRuntime.jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref: ref, ...props }));
});
Button.displayName = "Button";

function DonationButton({ config, type, amount, className, children, onSuccess, onError, }) {
    const { createCheckoutSession, isLoading, error } = useDonation(config);
    // Use provided amount or fall back to suggested amount
    const effectiveAmount = amount || (type === 'monthly' ? config.monthly.suggested : config.annual.suggested);
    const handleClick = async () => {
        try {
            await createCheckoutSession(type, effectiveAmount);
            onSuccess?.('checkout-initiated');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            onError?.(error);
        }
    };
    const formattedAmount = formatCurrency(effectiveAmount, config.currency);
    const frequency = type === 'monthly' ? '/month' : '/year';
    return (jsxRuntime.jsxs("div", { className: "space-y-2", children: [jsxRuntime.jsx(Button, { onClick: handleClick, disabled: isLoading, className: cn("relative overflow-hidden transition-all duration-200", "hover:scale-105 active:scale-95", className), children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(lucideReact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(lucideReact.Heart, { className: "mr-2 h-4 w-4" }), children || (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: ["Support with ", formattedAmount, jsxRuntime.jsx("span", { className: "text-sm opacity-80 ml-1", children: frequency })] }))] })) }), error && (jsxRuntime.jsx("p", { className: "text-sm text-red-600 mt-2", children: error }))] }));
}

function useDonationStats(config) {
    const [stats, setStats] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const fetchStats = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`/api/donation/stats?projectSlug=${config.projectSlug}`);
            if (!response.ok) {
                throw new Error('Failed to fetch donation stats');
            }
            const data = await response.json();
            setStats(data);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
            setError(errorMessage);
            console.error('Donation stats error:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    React.useEffect(() => {
        // Only fetch if we want to calculate from subscriptions
        if (config.goal?.calculateFromSubscriptions) {
            fetchStats();
        }
    }, [config.projectSlug, config.goal?.calculateFromSubscriptions]);
    return {
        stats,
        isLoading,
        error,
        refetch: fetchStats,
    };
}

const Card = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("rounded-xl border bg-card text-card-foreground shadow", className), ...props })));
Card.displayName = "Card";
const CardHeader = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })));
CardHeader.displayName = "CardHeader";
const CardTitle = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("font-semibold leading-none tracking-tight", className), ...props })));
CardTitle.displayName = "CardTitle";
const CardDescription = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("text-sm text-muted-foreground", className), ...props })));
CardDescription.displayName = "CardDescription";
const CardContent = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("p-6 pt-0", className), ...props })));
CardContent.displayName = "CardContent";
const CardFooter = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx("div", { ref: ref, className: cn("flex items-center p-6 pt-0", className), ...props })));
CardFooter.displayName = "CardFooter";

const labelVariants = classVarianceAuthority.cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx(LabelPrimitive__namespace.Root, { ref: ref, className: cn(labelVariants(), className), ...props })));
Label.displayName = LabelPrimitive__namespace.Root.displayName;

const Progress = React__namespace.forwardRef(({ className, value, ...props }, ref) => (jsxRuntime.jsx(ProgressPrimitive__namespace.Root, { ref: ref, className: cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className), ...props, children: jsxRuntime.jsx(ProgressPrimitive__namespace.Indicator, { className: "h-full w-full flex-1 bg-primary transition-all", style: { transform: `translateX(-${100 - (value || 0)}%)` } }) })));
Progress.displayName = ProgressPrimitive__namespace.Root.displayName;

const Slider = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsxs(SliderPrimitive__namespace.Root, { ref: ref, className: cn("relative flex w-full touch-none select-none items-center", className), ...props, children: [jsxRuntime.jsx(SliderPrimitive__namespace.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: jsxRuntime.jsx(SliderPrimitive__namespace.Range, { className: "absolute h-full bg-primary" }) }), jsxRuntime.jsx(SliderPrimitive__namespace.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })] })));
Slider.displayName = SliderPrimitive__namespace.Root.displayName;

const Tabs = TabsPrimitive__namespace.Root;
const TabsList = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx(TabsPrimitive__namespace.List, { ref: ref, className: cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className), ...props })));
TabsList.displayName = TabsPrimitive__namespace.List.displayName;
const TabsTrigger = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx(TabsPrimitive__namespace.Trigger, { ref: ref, className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className), ...props })));
TabsTrigger.displayName = TabsPrimitive__namespace.Trigger.displayName;
const TabsContent = React__namespace.forwardRef(({ className, ...props }, ref) => (jsxRuntime.jsx(TabsPrimitive__namespace.Content, { ref: ref, className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className), ...props })));
TabsContent.displayName = TabsPrimitive__namespace.Content.displayName;

function DonationWidget({ config, showProgress, goal, current, className = "", onSuccess, onError, }) {
    const [activeTab, setActiveTab] = React.useState("monthly");
    // Initialize slider values with suggested amounts
    const [monthlyAmount, setMonthlyAmount] = React.useState(config.monthly.suggested);
    const [annualAmount, setAnnualAmount] = React.useState(config.annual.suggested);
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
    const handleDonate = async (type) => {
        try {
            clearError();
            const amount = type === "monthly" ? monthlyAmount : annualAmount;
            await createCheckoutSession(type, amount);
            onSuccess?.('checkout-initiated');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error("Donation failed");
            onError?.(error);
        }
    };
    const getMinAmount = (type) => {
        const suggested = type === "monthly" ? config.monthly.suggested : config.annual.suggested;
        const configMin = type === "monthly" ? config.monthly.min : config.annual.min;
        return configMin ?? Math.max(1, Math.round(suggested * 0.5));
    };
    const getMaxAmount = (type) => {
        const suggested = type === "monthly" ? config.monthly.suggested : config.annual.suggested;
        const configMax = type === "monthly" ? config.monthly.max : config.annual.max;
        return configMax ?? suggested * 10; // Default max is 10x suggested amount
    };
    // Generate preset amounts for quick selection
    const getPresetAmounts = (type) => {
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
    return (jsxRuntime.jsxs(Card, { className: className, children: [jsxRuntime.jsxs(CardHeader, { children: [jsxRuntime.jsxs(CardTitle, { className: "flex items-center gap-2", children: [jsxRuntime.jsx(lucideReact.Heart, { className: "h-5 w-5 text-red-500" }), "Support ", config.projectName] }), config.goal?.description && (jsxRuntime.jsx("p", { className: "text-sm text-muted-foreground", children: config.goal.description }))] }), jsxRuntime.jsxs(CardContent, { className: "space-y-6", children: [shouldShowProgress && goalTarget > 0 && (jsxRuntime.jsxs("div", { className: "space-y-2", children: [jsxRuntime.jsxs("div", { className: "flex justify-between text-sm", children: [jsxRuntime.jsx("span", { children: "Progress" }), jsxRuntime.jsxs("span", { children: [formatCurrency(goalCurrent, config.currency), " / ", formatCurrency(goalTarget, config.currency), config.goal?.calculateFromSubscriptions && (jsxRuntime.jsx("span", { className: "text-muted-foreground ml-1", children: "(MRR)" }))] })] }), jsxRuntime.jsx(Progress, { value: progressPercentage, className: "h-2" }), jsxRuntime.jsxs("p", { className: "text-xs text-muted-foreground", children: [Math.round(progressPercentage), "% of monthly goal reached", statsLoading && config.goal?.calculateFromSubscriptions && (jsxRuntime.jsx("span", { className: "ml-2", children: jsxRuntime.jsx(lucideReact.Loader2, { className: "h-3 w-3 animate-spin inline" }) }))] })] })), jsxRuntime.jsxs(Tabs, { value: activeTab, onValueChange: (value) => setActiveTab(value), children: [jsxRuntime.jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [jsxRuntime.jsx(TabsTrigger, { value: "monthly", children: "Monthly" }), jsxRuntime.jsx(TabsTrigger, { value: "annual", children: "Annual" })] }), jsxRuntime.jsxs(TabsContent, { value: "monthly", className: "space-y-6", children: [jsxRuntime.jsx("div", { className: "text-center", children: jsxRuntime.jsxs("div", { className: "text-3xl font-bold text-primary", children: [formatCurrency(monthlyAmount, config.currency), jsxRuntime.jsx("span", { className: "text-lg font-normal text-muted-foreground", children: "/month" })] }) }), jsxRuntime.jsxs("div", { className: "space-y-4", children: [jsxRuntime.jsx(Label, { children: "Choose your monthly support amount" }), jsxRuntime.jsx("div", { className: "px-2", children: jsxRuntime.jsx(Slider, { value: [monthlyAmount], onValueChange: (value) => setMonthlyAmount(value[0]), min: getMinAmount("monthly"), max: getMaxAmount("monthly"), step: 0.5, className: "w-full" }) }), jsxRuntime.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [jsxRuntime.jsx("span", { children: formatCurrency(getMinAmount("monthly"), config.currency) }), jsxRuntime.jsx("span", { children: formatCurrency(getMaxAmount("monthly"), config.currency) })] })] }), jsxRuntime.jsxs("div", { className: "space-y-2", children: [jsxRuntime.jsx(Label, { className: "text-sm", children: "Quick amounts" }), jsxRuntime.jsx("div", { className: "grid grid-cols-2 gap-2", children: getPresetAmounts("monthly").map((amount) => (jsxRuntime.jsx(Button, { variant: monthlyAmount === amount ? "default" : "outline", size: "sm", onClick: () => setMonthlyAmount(amount), className: "text-sm", children: formatCurrency(amount, config.currency) }, amount))) })] }), jsxRuntime.jsx(Button, { onClick: () => handleDonate("monthly"), disabled: isLoading, className: "w-full", size: "lg", children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(lucideReact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (`Donate ${formatCurrency(monthlyAmount, config.currency)}/month`) })] }), jsxRuntime.jsxs(TabsContent, { value: "annual", className: "space-y-6", children: [jsxRuntime.jsxs("div", { className: "text-center", children: [jsxRuntime.jsxs("div", { className: "text-3xl font-bold text-primary", children: [formatCurrency(annualAmount, config.currency), jsxRuntime.jsx("span", { className: "text-lg font-normal text-muted-foreground", children: "/year" })] }), jsxRuntime.jsxs("div", { className: "text-sm text-muted-foreground mt-1", children: ["Save ", formatCurrency(Math.max(0, (monthlyAmount * 12) - annualAmount), config.currency), " per year"] })] }), jsxRuntime.jsxs("div", { className: "space-y-4", children: [jsxRuntime.jsx(Label, { children: "Choose your annual support amount" }), jsxRuntime.jsx("div", { className: "px-2", children: jsxRuntime.jsx(Slider, { value: [annualAmount], onValueChange: (value) => setAnnualAmount(value[0]), min: getMinAmount("annual"), max: getMaxAmount("annual"), step: 1, className: "w-full" }) }), jsxRuntime.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [jsxRuntime.jsx("span", { children: formatCurrency(getMinAmount("annual"), config.currency) }), jsxRuntime.jsx("span", { children: formatCurrency(getMaxAmount("annual"), config.currency) })] })] }), jsxRuntime.jsxs("div", { className: "space-y-2", children: [jsxRuntime.jsx(Label, { className: "text-sm", children: "Quick amounts" }), jsxRuntime.jsx("div", { className: "grid grid-cols-2 gap-2", children: getPresetAmounts("annual").map((amount) => (jsxRuntime.jsx(Button, { variant: annualAmount === amount ? "default" : "outline", size: "sm", onClick: () => setAnnualAmount(amount), className: "text-sm", children: formatCurrency(amount, config.currency) }, amount))) })] }), jsxRuntime.jsx(Button, { onClick: () => handleDonate("annual"), disabled: isLoading, className: "w-full", size: "lg", children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(lucideReact.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (`Donate ${formatCurrency(annualAmount, config.currency)}/year`) })] })] }), error && (jsxRuntime.jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-md", children: jsxRuntime.jsx("p", { className: "text-sm text-red-600", children: error }) })), jsxRuntime.jsx("p", { className: "text-xs text-center text-muted-foreground", children: "Secure payment powered by Stripe" })] })] }));
}

class DonationStripeManager {
    constructor(secretKey) {
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
        });
    }
    /**
     * Ensure donation products exist in Stripe, create them if they don't
     */
    async ensureProductsExist(projectSlug, projectName) {
        const productIds = generateProductIds(projectSlug);
        // Check if products already exist
        const existingProducts = await this.stripe.products.list({
            ids: [productIds.monthly, productIds.annual],
        });
        const existingProductMap = new Map(existingProducts.data.map((product) => [product.id, product]));
        // Create monthly product if it doesn't exist
        let monthlyProduct = existingProductMap.get(productIds.monthly);
        if (!monthlyProduct) {
            monthlyProduct = await this.stripe.products.create({
                id: productIds.monthly,
                name: `${projectName} - Monthly Support`,
                description: `Monthly recurring donation to support ${projectName}`,
                type: 'service',
            });
        }
        // Create annual product if it doesn't exist
        let annualProduct = existingProductMap.get(productIds.annual);
        if (!annualProduct) {
            annualProduct = await this.stripe.products.create({
                id: productIds.annual,
                name: `${projectName} - Annual Support`,
                description: `Annual recurring donation to support ${projectName}`,
                type: 'service',
            });
        }
        // Get or create prices for the products
        const monthlyPriceId = await this.getOrCreatePrice(monthlyProduct.id, 'month');
        const annualPriceId = await this.getOrCreatePrice(annualProduct.id, 'year');
        return {
            monthlyPriceId,
            annualPriceId,
        };
    }
    /**
     * Get or create a price for a product
     */
    async getOrCreatePrice(productId, interval) {
        // Check if a price already exists for this product
        const existingPrices = await this.stripe.prices.list({
            product: productId,
            active: true,
        });
        const existingPrice = existingPrices.data.find((price) => price.recurring?.interval === interval);
        if (existingPrice) {
            return existingPrice.id;
        }
        // Create a new price (we'll use a placeholder amount that gets overridden in checkout)
        const price = await this.stripe.prices.create({
            product: productId,
            currency: 'usd',
            recurring: {
                interval,
            },
            unit_amount: 100, // $1.00 placeholder - actual amount set in checkout
        });
        return price.id;
    }
    /**
     * Create a checkout session for donations
     */
    async createCheckoutSession(sessionData) {
        // Create checkout session with dynamic pricing
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: sessionData.type === 'monthly'
                                ? `${sessionData.projectName} - Monthly Support`
                                : `${sessionData.projectName} - Annual Support`,
                            description: sessionData.type === 'monthly'
                                ? `Monthly recurring donation to support ${sessionData.projectName}`
                                : `Annual recurring donation to support ${sessionData.projectName}`,
                        },
                        unit_amount: Math.round(sessionData.amount * 100), // Convert to cents
                        recurring: {
                            interval: sessionData.type === 'monthly' ? 'month' : 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: sessionData.successUrl,
            cancel_url: sessionData.cancelUrl,
            metadata: {
                projectSlug: sessionData.projectSlug,
                donationType: sessionData.type,
                amount: sessionData.amount.toString(),
            },
        });
        if (!session.url) {
            throw new Error('Failed to create checkout session URL');
        }
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Handle Stripe webhooks
     */
    async handleWebhook(payload, signature, webhookSecret, options) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err);
            throw new Error('Invalid webhook signature');
        }
        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
                if (options.onSubscriptionCreated) {
                    await options.onSubscriptionCreated(event.data.object);
                }
                break;
            case 'customer.subscription.updated':
                if (options.onSubscriptionUpdated) {
                    await options.onSubscriptionUpdated(event.data.object);
                }
                break;
            case 'customer.subscription.deleted':
                if (options.onSubscriptionDeleted) {
                    await options.onSubscriptionDeleted(event.data.object);
                }
                break;
            case 'payment_intent.succeeded':
                if (options.onPaymentSucceeded) {
                    await options.onPaymentSucceeded(event.data.object);
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    /**
     * Get subscription statistics for a project (legacy method)
     */
    async getSubscriptionStats(projectSlug) {
        const summary = await this.getSubscriptionSummary(projectSlug);
        return {
            monthlySubscribers: summary.monthlyCount,
            annualSubscribers: summary.annualCount,
            totalRevenue: summary.monthlyRevenue + summary.annualRevenue,
        };
    }
    /**
     * Get detailed subscription summary with MRR calculations
     */
    async getSubscriptionSummary(projectSlug) {
        // Get all active subscriptions
        const subscriptions = await this.stripe.subscriptions.list({
            status: 'active',
            limit: 100, // Adjust as needed for larger projects
        });
        let monthlyRevenue = 0;
        let annualRevenue = 0;
        let monthlyCount = 0;
        let annualCount = 0;
        // Process each subscription
        for (const subscription of subscriptions.data) {
            // Check if this subscription belongs to our project by looking at metadata
            const belongsToProject = subscription.metadata?.projectSlug === projectSlug;
            if (!belongsToProject) {
                // Also check by examining the subscription items for our project's products
                let foundProjectProduct = false;
                for (const item of subscription.items.data) {
                    const price = await this.stripe.prices.retrieve(item.price.id);
                    if (typeof price.product === 'string') {
                        const product = await this.stripe.products.retrieve(price.product);
                        const productIds = generateProductIds(projectSlug);
                        if (product.id === productIds.monthly || product.id === productIds.annual) {
                            foundProjectProduct = true;
                            break;
                        }
                    }
                }
                if (!foundProjectProduct)
                    continue;
            }
            // Calculate revenue from this subscription
            for (const item of subscription.items.data) {
                const price = await this.stripe.prices.retrieve(item.price.id);
                const amount = (price.unit_amount || 0) / 100; // Convert from cents
                const quantity = item.quantity || 1;
                const totalAmount = amount * quantity;
                if (price.recurring?.interval === 'month') {
                    monthlyRevenue += totalAmount;
                    monthlyCount++;
                }
                else if (price.recurring?.interval === 'year') {
                    annualRevenue += totalAmount;
                    annualCount++;
                }
            }
        }
        // Calculate monthly equivalent of annual subscriptions
        const monthlyEquivalent = annualRevenue / 12;
        const totalMRR = monthlyRevenue + monthlyEquivalent;
        return {
            monthlyRevenue,
            annualRevenue,
            monthlyEquivalent,
            totalMRR,
            monthlyCount,
            annualCount,
        };
    }
}
/**
 * Convenience function to create a checkout session
 */
async function createCheckoutSession(stripeSecretKey, sessionData) {
    const manager = new DonationStripeManager(stripeSecretKey);
    return manager.createCheckoutSession(sessionData);
}
/**
 * Convenience function to handle webhooks
 */
async function handleDonationWebhook(request, options) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('stripe-signature');
        if (!signature) {
            return new Response('Missing stripe-signature header', { status: 400 });
        }
        const manager = new DonationStripeManager(options.stripeSecretKey);
        const result = await manager.handleWebhook(payload, signature, options.webhookSecret, options);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

exports.DonationButton = DonationButton;
exports.DonationStripeManager = DonationStripeManager;
exports.DonationWidget = DonationWidget;
exports.createCheckoutSession = createCheckoutSession;
exports.formatCurrency = formatCurrency;
exports.generateProductIds = generateProductIds;
exports.handleDonationWebhook = handleDonationWebhook;
exports.useDonation = useDonation;
exports.useDonationStats = useDonationStats;
exports.validateDonationConfig = validateDonationConfig;
//# sourceMappingURL=index.cjs.map
