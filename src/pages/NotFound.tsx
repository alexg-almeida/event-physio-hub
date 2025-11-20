import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Shield } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div className="mx-auto max-w-2xl flex items-center justify-center min-h-screen">
        <Card className="border-0 shadow-card-soft animate-fade-in w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-4xl font-bold text-foreground mb-2">404</CardTitle>
            <CardDescription className="text-xl">
              Oops! Página não encontrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Página Inicial
              </Button>
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Painel Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
