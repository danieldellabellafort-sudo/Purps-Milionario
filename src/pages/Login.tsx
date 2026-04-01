import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Se já estiver logado, manda pra home
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const result = login(email, password);
    if (result === true) {
      toast.success("Login efetuado com sucesso!");
      navigate("/");
    } else {
      toast.error(result);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Elon_Musk_Royal_Society.jpg" alt="Elon Musk" className="w-24 h-24 mb-4 object-cover rounded-full shadow-lg border-2 border-primary/20" />
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Bem-vindo
          </h1>
          <p className="text-muted-foreground text-center mt-2 text-sm">
            Entre com suas credenciais para gerenciar seus lucros.
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@app.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
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
            <LogIn className="w-5 h-5" />
            Conectar-se
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border mt-4">
            <p className="mb-2">Ainda não tem uma conta?</p>
            <Link to="/register">
              <Button variant="outline" className="w-full h-10 font-medium">
                Criar conta
              </Button>
            </Link>
          </div>

          <div className="pt-2 text-center">
            <button 
              type="button" 
              onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
              className="text-xs text-destructive/50 hover:text-destructive underline decoration-dotted transition-colors"
            >
              Excluir cookies / Zerar aparelho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
