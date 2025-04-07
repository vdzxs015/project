import React, { useState, useEffect } from 'react';
import { Calendar as Clock, Scissors, User, Phone, MapPin, Mail, Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

// Tipos
type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
};

type Professional = {
  id: number;
  name: string;
  specialties: string[];
};

// type Appointment = {
//   id: string; // ID único do agendamento
//   date: string; // Data do agendamento (ajustado para string)
//   time: string; // Hora do agendamento
//   client_name: string; // Nome do cliente
//   phone: string; // Telefone do cliente
//   service_id: number; // ID do serviço
//   professional_id: number; // ID do profissional
// };

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<number>(0);
  const [selectedProfessional, setSelectedProfessional] = useState<number>(0);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string>(''); // Novo estado para o horário
  const [availableTimes, setAvailableTimes] = useState<Record<string, string[]>>({});

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Inicialize os horários disponíveis para todos os dias do mês, exceto segundas, domingos e dias passados
    const initializeAvailableTimes = () => {
      const today = new Date();
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const newAvailableTimes: Record<string, string[]> = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dateString = date.toISOString().split('T')[0];

        // Exclua segundas (1), domingos (0) e dias passados
        if (dayOfWeek !== 0 && dayOfWeek !== 1 && date >= today) {
          newAvailableTimes[dateString] = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        }
      }

      setAvailableTimes(newAvailableTimes);
    };

    initializeAvailableTimes();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [servicesResponse, professionalsResponse] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('professionals').select('*')
      ]);

      if (servicesResponse.error) throw servicesResponse.error;
      if (professionalsResponse.error) throw professionalsResponse.error;

      setServices(servicesResponse.data);
      setProfessionals(professionalsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados. Por favor, recarregue a página.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    return Array.from({ length: 42 }, (_, i) => {
      const day = i - firstDay + 1;
      if (day <= 0 || day > daysInMonth) return null;
      return new Date(year, month, day);
    });
  };

  const handlePrevMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (
      selectedDate.getFullYear() > currentYear ||
      (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() > currentMonth)
    ) {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
    }
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const isPrevMonthDisabled = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
      selectedDate.getFullYear() < currentYear ||
      (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() <= currentMonth)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedDateString = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase
        .from('appointments')
        .insert({
          date: selectedDateString,
          time: selectedTime,
          client_name: clientName,
          phone,
          service_id: selectedService,
          professional_id: selectedProfessional,
        });

      if (error) throw error;

      // Atualize os horários disponíveis para o dia selecionado
      setAvailableTimes((prev) => ({
        ...prev,
        [selectedDateString]: prev[selectedDateString]?.filter((time) => time !== selectedTime) || [],
      }));

      // Reset form
      setClientName('');
      setPhone('');
      setSelectedService(0);
      setSelectedProfessional(0);
      setSelectedTime('');

      toast.success('Agendamento realizado com sucesso!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
        },
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao realizar agendamento. Tente novamente.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-accent/90 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-accent/90">
      <Toaster />
      
      {/* Header */}
      <header className="bg-surface/50 border-b border-accent/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                <Scissors className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-accent">Barbearia João Machado</h1>
                <p className="text-accent/60 flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  Rua 21 De Abril N306, Centro - SP
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendário */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Agenda
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    disabled={isPrevMonthDisabled()}
                    className={`p-2 rounded-lg transition-colors ${
                      isPrevMonthDisabled() ? 'cursor-not-allowed text-accent/30' : 'hover:bg-accent/10'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-medium min-w-[120px] text-center">
                    {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-accent/60 text-sm font-medium">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(selectedDate).map((date, index) => {
                  if (!date) return <div key={index} />;
                  
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSunday = date.getDay() === 0;
                  const isMonday = date.getDay() === 1;
                  const isPast = date < new Date();
                  
                  return (
                    <button
                      key={index}
                      onClick={() => !isSunday && !isMonday && !isPast && setSelectedDate(date)}
                      disabled={isSunday || isMonday || isPast}
                      className={`
                        calendar-day text-sm font-medium rounded-lg
                        ${isSelected ? 'bg-secondary text-white' : ''}
                        ${isToday ? 'border-2 border-accent' : ''}
                        ${(isSunday || isMonday || isPast) ? 'text-accent/30 cursor-not-allowed' : 'hover:bg-accent/10'}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulário */}
            <div className="card">
              <h2 className="font-display text-2xl font-semibold mb-6">Agendar Horário</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Serviço</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(Number(e.target.value))}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  >
                    <option value={0}>Selecione um serviço</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - R$ {service.price} ({service.duration}min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profissional</label>
                  <select
                    value={selectedProfessional}
                    onChange={(e) => setSelectedProfessional(Number(e.target.value))}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  >
                    <option value={0}>Selecione um profissional</option>
                    {professionals.map(professional => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Seu nome completo"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="form-input"
                    placeholder="(00) 00000-0000"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Horário</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione um horário</option>
                    {availableTimes[selectedDate.toISOString().split('T')[0]]?.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5" />
                      Confirmar Agendamento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-display text-xl font-semibold mb-4">Horário de Funcionamento</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
                  <span>Terça a Sexta</span>
                  <span className="font-medium">10:00 às 19:00</span>
                </li>
                <li className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
                  <span>Sábado</span>
                  <span className="font-medium">07:30 às 17:00</span>
                </li>
                <li className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
                  <span>Domingo e Segunda</span>
                  <span className="font-medium text-red-400">Fechado</span>
                </li>
                <li className="text-sm text-accent/60 mt-2">
                  Pausa para almoço: 12:00 às 13:00
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 className="font-display text-xl font-semibold mb-4">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                  <Phone className="h-5 w-5" />
                  <a href="tel:+5515998445185" className="hover:text-secondary transition-colors">
                    +55 15 99844-5185
                  </a>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                  <Mail className="h-5 w-5" />
                  <a href="mailto:barbeariajoaomachado@gmail.com" className="hover:text-secondary transition-colors">
                    barbeariajoaomachado@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;