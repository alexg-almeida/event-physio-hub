import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

const eventFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z.string().optional(),
  local: z.string().min(1, "Local é obrigatório").max(200, "Local deve ter no máximo 200 caracteres"),
  dateRange: z.object({
    from: z.date({
      required_error: "Data de início é obrigatória",
    }),
    to: z.date().optional(),
  }),
  vagas_totais: z.coerce.number().min(1, "Deve haver pelo menos 1 vaga"),
  valor_inscricao: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  initialData?: {
    nome: string;
    descricao?: string;
    local: string;
    data_evento: Date;
    data_evento_fim?: Date | null;
    vagas_totais: number;
    valor_inscricao: number;
  };
  onSubmit: (data: EventFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateRange(from: Date, to?: Date | null): string {
  if (!to || isSameDay(from, to)) {
    return format(from, "PPP", { locale: ptBR });
  }
  
  const fromMonth = format(from, "MM/yyyy");
  const toMonth = format(to, "MM/yyyy");
  
  if (fromMonth === toMonth) {
    return `${format(from, "dd")} - ${format(to, "dd/MM/yyyy")}`;
  }
  
  return `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}`;
}

export function EventForm({ initialData, onSubmit, onCancel, isLoading }: EventFormProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData 
      ? {
          nome: initialData.nome,
          descricao: initialData.descricao || "",
          local: initialData.local,
          dateRange: {
            from: initialData.data_evento,
            to: initialData.data_evento_fim || initialData.data_evento,
          },
          vagas_totais: initialData.vagas_totais,
          valor_inscricao: initialData.valor_inscricao,
        }
      : {
          nome: "",
          descricao: "",
          local: "",
          vagas_totais: 0,
          valor_inscricao: 0,
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Workshop de Fisioterapia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o evento..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="local"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Centro de Convenções" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Evento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value?.from && "text-muted-foreground"
                      )}
                    >
                      {field.value?.from ? (
                        formatDateRange(field.value.from, field.value.to)
                      ) : (
                        <span>Selecione a data ou período</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={field.value as DateRange}
                    onSelect={(range) => {
                      field.onChange({
                        from: range?.from,
                        to: range?.to || range?.from,
                      });
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="pointer-events-auto"
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Selecione um dia para evento único ou arraste para selecionar um período
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vagas_totais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vagas Totais</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor_inscricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Inscrição (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                    {...field} 
                  />
                </FormControl>
                {form.watch("valor_inscricao") === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Este evento será gratuito - inscrições serão confirmadas automaticamente
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}