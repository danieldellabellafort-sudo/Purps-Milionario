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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const result = register(name, email, password);
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
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Elon_Musk_Royal_Society.jpg" alt="Elon Musk" className="w-24 h-24 mb-4 object-cover rounded-full shadow-lg border-2 border-primary/20" />
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
              <Label htmlFor="name">Quem é você?</Label>
              <select
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Selecione seu nome...</option>
                {availableFriends.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {availableFriends.length === 0 && (
                <p className="text-xs text-destructive mt-1 font-semibold">Todas as contas já foram registradas no sistema.</p>
              )}
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
          
          <Button type="submit" disabled={availableFriends.length === 0} className="w-full h-12 gap-2 text-base font-semibold">
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
