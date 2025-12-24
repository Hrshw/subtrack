import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from "@clerk/clerk-react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import LandingPage from "./pages/LandingPage";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import EULA from "./pages/EULA";
import DocsLayout from "./layouts/DocsLayout";
import DocsLanding from "./pages/docs/DocsLanding";
import DocsGettingStarted from "./pages/docs/DocsGettingStarted";
import DocsIntegration from "./pages/docs/DocsIntegration";
import DocsSecurity from "./pages/docs/DocsSecurity";
import DocsFAQ from "./pages/docs/DocsFAQ";
import DocsPricing from "./pages/docs/DocsPricing";
import Demo from "./pages/Demo";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Checkout from "./pages/Checkout";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      // @ts-ignore - Clerk types might be slightly off for navigate prop in some versions, but this is correct for react-router
      navigate={(to) => navigate(to)}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#10b981', // Emerald-500
          colorBackground: '#020617', // Slate-950
          colorText: 'white',
          colorInputBackground: '#0f172a', // Slate-900
          colorInputText: 'white',
        },
        elements: {
          card: 'bg-slate-950 border border-slate-800 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800',
          formFieldLabel: 'text-slate-300',
          formFieldInput: 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500',
          footerActionLink: 'text-emerald-400 hover:text-emerald-300',
          identityPreviewText: 'text-slate-300',
          formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
        }
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/sign-in/*"
          element={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <SignUp routing="path" path="/sign-up" forceRedirectUrl="/dashboard" />
            </div>
          }
        />
        <Route
          path="/dashboard/service/:serviceId"
          element={
            <>
              <SignedIn>
                <ServiceDetailPage />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <SignedIn>
                <Settings />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/eula" element={<EULA />} />
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<DocsLanding />} />
          <Route path="getting-started" element={<DocsGettingStarted />} />
          <Route path="integrations/:slug" element={<DocsIntegration />} />
          <Route path="security-privacy" element={<DocsSecurity />} />
          <Route path="faq" element={<DocsFAQ />} />
          <Route path="pricing" element={<DocsPricing />} />
        </Route>
        <Route path="/demo" element={<Demo />} />
        <Route
          path="/checkout"
          element={
            <>
              <SignedIn>
                <Checkout />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn signInForceRedirectUrl="/checkout" />
              </SignedOut>
            </>
          }
        />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
      </Routes>
    </ClerkProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  );
}

export default App;
