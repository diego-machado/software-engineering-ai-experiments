import {
  DayTripCombination,
  DayTripResult,
  Flight,
  FlightSearchResult,
  SearchConditions,
} from '../types/flight';

const TIMEZONE = 'America/Sao_Paulo';

function formatLocalTime(value: Date | string): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatFlightLine(label: string, flight: Flight): string {
  return [
    `${label}: ${flight.flight_number} (${flight.airline_code})`,
    `  ${flight.origin} → ${flight.destination}`,
    `  ${formatLocalTime(flight.departure_time)} – ${formatLocalTime(flight.arrival_time)} | ${formatPrice(Number(flight.price))}`,
  ].join('\n');
}

export function formatFlightSearchResult(
  result: FlightSearchResult,
  origin: string,
  destination: string,
  date: string
): string {
  const lines = [
    `Voos ${origin} ↔ ${destination} em ${date}`,
    '',
    `Ida (${result.outbound.length}):`,
  ];

  if (result.outbound.length === 0) {
    lines.push('  Nenhum voo encontrado.');
  } else {
    for (const flight of result.outbound) {
      lines.push(
        `  • ${flight.flight_number} ${formatLocalTime(flight.departure_time)}–${formatLocalTime(flight.arrival_time)} ${formatPrice(Number(flight.price))} (${flight.destination})`
      );
    }
  }

  lines.push('', `Volta (${result.return.length}):`);

  if (result.return.length === 0) {
    lines.push('  Nenhum voo encontrado.');
  } else {
    for (const flight of result.return) {
      lines.push(
        `  • ${flight.flight_number} ${formatLocalTime(flight.departure_time)}–${formatLocalTime(flight.arrival_time)} ${formatPrice(Number(flight.price))} (${flight.origin})`
      );
    }
  }

  return lines.join('\n');
}

function formatCombination(combination: DayTripCombination, rank?: number): string {
  const prefix = rank ? `${rank}. ` : '';
  return [
    `${prefix}Total: ${formatPrice(combination.totalPrice)}`,
    formatFlightLine('  Ida', combination.outbound),
    formatFlightLine('  Volta', combination.return),
  ].join('\n');
}

export function formatDayTripResult(result: DayTripResult): string {
  const lines = [
    `Melhor combinação ida/volta em ${result.date}`,
    `Janela da reunião: ${result.meetingWindow.start} – ${result.meetingWindow.end} (horário de São Paulo)`,
    '',
  ];

  if (!result.best) {
    lines.push(result.message ?? 'Nenhuma combinação encontrada.');
    return lines.join('\n');
  }

  lines.push('Melhor opção (mais barata):');
  lines.push(formatCombination(result.best));
  lines.push('');
  lines.push(
    `A ida chega em ${formatLocalTime(result.best.outbound.arrival_time)} e a volta parte às ${formatLocalTime(result.best.return.departure_time)}.`
  );

  if (result.alternatives.length > 0) {
    lines.push('', `Alternativas (${result.alternatives.length}):`);
    result.alternatives.forEach((alternative, index) => {
      lines.push('');
      lines.push(formatCombination(alternative, index + 2));
    });
  }

  return lines.join('\n');
}

export function formatSearchConditions(conditions: SearchConditions): string {
  return [
    'Condições de busca Aero Search',
    '',
    `Aeroportos: ${conditions.airports.join(', ')}`,
    `Rotas: ${conditions.routes.join(' | ')}`,
    `Período disponível: ${conditions.dateRange.from} a ${conditions.dateRange.to}`,
    `Voos por dia: ${conditions.flightsPerDay}`,
    '',
    'Regras de preço:',
    `  • CGH base: ${formatPrice(conditions.pricing.cghBasePrice)}`,
    `  • GRU base: ${formatPrice(conditions.pricing.gruBasePrice)}`,
    `  • Horário mais barato: ${conditions.pricing.cheapWindow}`,
    `  • Horário mais caro: ${conditions.pricing.peakWindow}`,
    `  • ${conditions.pricing.note}`,
  ].join('\n');
}
