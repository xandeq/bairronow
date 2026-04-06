import LoginForm from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Entrar</h1>
        <LoginForm />
      </div>
    </div>
  );
}
