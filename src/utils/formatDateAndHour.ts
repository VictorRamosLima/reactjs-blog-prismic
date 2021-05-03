import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const formatDateAndHour = (date?: string): string =>
  date ? format(new Date(date), "'* editado' dd MMM yyyy, 'às' HH:mm", { locale: ptBR }) : null;
