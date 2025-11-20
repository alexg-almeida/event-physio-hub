import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  className?: string;
  centered?: boolean;
}

/**
 * Layout Component - Padrão de layout do sistema
 * 
 * Aplica o gradiente de fundo padrão (bg-healing-gradient) e container centralizado
 * usado em todo o sistema para manter consistência visual.
 * 
 * @param maxWidth - Largura máxima do container (default: '2xl')
 * @param centered - Centraliza verticalmente o conteúdo (default: false)
 * @param className - Classes CSS adicionais
 * @param children - Conteúdo do layout
 * 
 * @example
 * ```tsx
 * <Layout maxWidth="7xl">
 *   <YourContent />
 * </Layout>
 * ```
 */
const Layout = ({ 
  children, 
  maxWidth = "2xl", 
  className,
  centered = false 
}: LayoutProps) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-healing-gradient p-4">
      <div 
        className={cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          centered && "flex items-center justify-center min-h-screen",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
