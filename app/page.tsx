import CalendarContainer from '@/components/calendar/CalendarContainer';
import ClientOnly from '@/components/ClientOnly';

export default function Home() {
  return (
    <ClientOnly>
      <CalendarContainer />
    </ClientOnly>
  );
}
