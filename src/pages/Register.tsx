import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const Register = () => {
  const { register, isAuthenticated, availableFriends } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const result = await register(name, email, password);
    if (result === true) {
      toast.success("Conta criada com sucesso! Redirecionando...");
      navigate("/");
    } else {
      toast.error(result); // Erro como string do AuthProvider
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4 object-cover rounded-full shadow-lg border-2 border-primary/20" />
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Criar Conta
          </h1>
          <p className="text-muted-foreground text-center mt-2 text-sm">
            Cadastre-se para gerenciar seus ganhos.
          </p>
        </div>

        <form onSubmit={handleRegister} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Qual seu nome?</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-background/50"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-12 gap-2 text-base font-semibold">
            <UserPlus className="w-5 h-5" />
            Cadastrar e Entrar
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>
              Já possui uma conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
