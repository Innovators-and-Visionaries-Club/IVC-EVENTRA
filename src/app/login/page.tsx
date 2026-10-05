import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Login | IVC PULSE",
  description: "Unified Authentication Portal for Vice Verse 1.0",
};

export default function LoginPage() {
  return <AuthPage isSignUp={false} />;
}
