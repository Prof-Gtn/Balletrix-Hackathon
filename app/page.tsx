import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">MulaStream</h1>
        <p className="mt-2 text-zinc-500">Sign in to get started.</p>
      </div>
      <LoginForm />
    </main>
  );
}
