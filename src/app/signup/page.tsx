import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Sign Up | IVC PULSE",
  description: "Create an Account for Vice Verse 1.0",
};

export default function SignUpPage() {
  return <AuthPage isSignUp={true} />;
}
