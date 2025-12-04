import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "./EventForm";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Power, Trash2, DollarSign, Gift } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  local: string;
  data_evento: string;
  data_evento_fim: string | null;
  vagas_totais: number;
  vagas_ocupadas: number;
  valor_inscricao: number;
  status: string;
}

function formatEventDate(dataEvento: string, dataEventoFim: string | null): string {
  const start = new Date(dataEvento);
  const end = dataEventoFim ? new Date(dataEventoFim) : null;
  
  if (!end || isSameDay(start, end)) {
    return format(start, "dd/MM/yyyy", { locale: ptBR });
  }
  
  const startMonth = format(start, "MM/yyyy");
  const endMonth = format(end, "MM/yyyy");
  
  if (startMonth === endMonth) {
    return `${format(start, "dd")} - ${format(end, "dd/MM/yyyy")}`;
  }
  
  return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
}

export function EventManagement() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [toggleEvento, setToggleEvento] = useState<Evento | null>(null);
  const [deleteEvento, setDeleteEvento] = useState<Evento | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase
        .from("deller_eventos")
        .select("*")
        .order("data_evento", { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar eventos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvento(null);
    setIsDialogOpen(true);
  };

  const handleEditEvent = (evento: Evento) => {
    setEditingEvento(evento);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (evento: Evento) => {
    setToggleEvento(evento);
    setIsAlertOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!toggleEvento) return;

    try {
      const newStatus = toggleEvento.status === "ativo" ? "inativo" : "ativo";
      
      const { error } = await supabase
        .from("deller_eventos")
        .update({ status: newStatus })
        .eq("id", toggleEvento.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Evento ${newStatus === "ativo" ? "ativado" : "desativado"} com sucesso.`,
      });

      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAlertOpen(false);
      setToggleEvento(null);
    }
  };

  const handleDeleteEvent = (evento: Evento) => {
    setDeleteEvento(evento);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEvento) return;

    // Verificar se o evento tem inscrições
    if (deleteEvento.vagas_ocupadas > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Este evento possui inscrições vinculadas e não pode ser excluído.",
        variant: "destructive",
      });
      setIsDeleteAlertOpen(false);
      setDeleteEvento(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("deller_eventos")
        .delete()
        .eq("id", deleteEvento.id);

      if (error) throw error;

      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });

      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir evento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setDeleteEvento(null);
    }
  };

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const dataEvento = format(formData.dateRange.from, "yyyy-MM-dd");
      const dataEventoFim = formData.dateRange.to 
        ? format(formData.dateRange.to, "yyyy-MM-dd") 
        : dataEvento;

      if (editingEvento) {
        const { error } = await supabase
          .from("deller_eventos")
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            local: formData.local,
            data_evento: dataEvento,
            data_evento_fim: dataEventoFim,
            vagas_totais: formData.vagas_totais,
            valor_inscricao: formData.valor_inscricao,
          })
          .eq("id", editingEvento.id);

        if (error) throw error;

        toast({
          title: "Evento atualizado",
          description: "O evento foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("deller_eventos")
          .insert({
            nome: formData.nome,
            descricao: formData.descricao || null,
            local: formData.local,
            data_evento: dataEvento,
            data_evento_fim: dataEventoFim,
            vagas_totais: formData.vagas_totais,
            valor_inscricao: formData.valor_inscricao,
            status: "ativo",
          });

        if (error) throw error;

        toast({
          title: "Evento criado",
          description: "O evento foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar evento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando eventos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Eventos</h2>
        <Button onClick={handleCreateEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum evento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              eventos.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell className="font-medium">{evento.nome}</TableCell>
                  <TableCell>
                    {formatEventDate(evento.data_evento, evento.data_evento_fim)}
                  </TableCell>
                  <TableCell>{evento.local}</TableCell>
                  <TableCell>
                    {evento.vagas_ocupadas}/{evento.vagas_totais}
                  </TableCell>
                  <TableCell>
                    {evento.valor_inscricao === 0 ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary flex items-center gap-1 w-fit">
                        <Gift className="w-3 h-3" />
                        GRATUITO
                      </Badge>
                    ) : (
                      <span>R$ {evento.valor_inscricao.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={evento.status === "ativo" ? "default" : "secondary"}>
                      {evento.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(evento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar evento</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(evento)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {evento.status === "ativo" ? "Desativar" : "Ativar"} evento
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(evento)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir evento</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvento ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            initialData={
              editingEvento
                ? {
                    nome: editingEvento.nome,
                    descricao: editingEvento.descricao || "",
                    local: editingEvento.local,
                    data_evento: new Date(editingEvento.data_evento),
                    data_evento_fim: editingEvento.data_evento_fim 
                      ? new Date(editingEvento.data_evento_fim) 
                      : null,
                    vagas_totais: editingEvento.vagas_totais,
                    valor_inscricao: editingEvento.valor_inscricao,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleEvento?.status === "ativo"
                ? "Deseja desativar este evento? Ele não ficará mais visível para novas inscrições."
                : "Deseja ativar este evento? Ele ficará disponível para novas inscrições."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{deleteEvento?.nome}"? 
              {deleteEvento?.vagas_ocupadas && deleteEvento.vagas_ocupadas > 0 
                ? " Este evento possui inscrições vinculadas e não pode ser excluído."
                : " Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
