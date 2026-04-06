import RegisterForm from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Criar conta</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
