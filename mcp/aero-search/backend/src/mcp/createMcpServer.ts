import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import * as flightService from '../services/flightService';
import {
  formatDayTripResult,
  formatFlightSearchResult,
  formatSearchConditions,
} from './formatters';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'aero-search',
    version: '1.0.0',
  });

  server.registerTool(
    'get_search_conditions',
    {
      description:
        'Retorna aeroportos, rotas, intervalo de datas e regras de preço da Aero Search (CGH mais caro que GRU, horários de pico etc.).',
      inputSchema: {},
    },
    async () => {
      const conditions = flightService.getSearchConditions();
      return {
        content: [{ type: 'text', text: formatSearchConditions(conditions) }],
      };
    }
  );

  server.registerTool(
    'search_flights',
    {
      description:
        'Busca voos de ida e volta entre dois aeroportos em uma data (FLN, CGH, GRU). Período disponível: 2026-06-01 a 2026-06-12.',
      inputSchema: {
        origin: z.string().describe('Código IATA de origem: FLN, CGH ou GRU'),
        destination: z.string().describe('Código IATA de destino: FLN, CGH ou GRU'),
        date: z.string().describe('Data no formato YYYY-MM-DD'),
      },
    },
    async ({ origin, destination, date }) => {
      try {
        const result = await flightService.searchFlights({ origin, destination, date });
        return {
          content: [
            {
              type: 'text',
              text: formatFlightSearchResult(
                result,
                origin.toUpperCase(),
                destination.toUpperCase(),
                date
              ),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Erro ao buscar voos',
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    'find_best_day_trip',
    {
      description:
        'Encontra a melhor combinação ida/volta no mesmo dia saindo de FLN (ou outra origem) para São Paulo (CGH e/ou GRU), respeitando horário de reunião. Escolhe a opção mais barata que chegue antes do início e parta após o fim da reunião.',
      inputSchema: {
        date: z.string().describe('Data da viagem no formato YYYY-MM-DD (2026-06-01 a 2026-06-12)'),
        origin: z.string().optional().describe('Origem da ida. Padrão: FLN'),
        meetingStart: z
          .string()
          .optional()
          .describe('Horário de início da reunião em HH:MM (24h, horário de São Paulo). Padrão: 10:00'),
        meetingEnd: z
          .string()
          .optional()
          .describe('Horário de fim da reunião em HH:MM (24h, horário de São Paulo). Padrão: 17:00'),
        saoPauloAirports: z
          .array(z.enum(['CGH', 'GRU']))
          .optional()
          .describe('Aeroportos de São Paulo considerados na busca. Padrão: CGH e GRU'),
        maxAlternatives: z
          .number()
          .int()
          .min(0)
          .max(10)
          .optional()
          .describe('Quantidade de alternativas além da melhor opção. Padrão: 5'),
      },
    },
    async ({ date, origin, meetingStart, meetingEnd, saoPauloAirports, maxAlternatives }) => {
      try {
        const result = await flightService.findBestDayTrip({
          date,
          origin,
          meetingStart,
          meetingEnd,
          saoPauloAirports,
          maxAlternatives,
        });

        return {
          content: [{ type: 'text', text: formatDayTripResult(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Erro ao buscar melhor combinação',
            },
          ],
        };
      }
    }
  );

  server.registerPrompt(
    'day_trip_to_sao_paulo',
    {
      title: 'Viagem de ida e volta para São Paulo',
      description:
        'Template para pedir a melhor combinação FLN ↔ São Paulo no mesmo dia com restrição de horário de reunião.',
      argsSchema: {
        date: z.string().describe('Data da viagem (YYYY-MM-DD)'),
        meetingStart: z.string().optional().describe('Início da reunião (HH:MM)'),
        meetingEnd: z.string().optional().describe('Fim da reunião (HH:MM)'),
      },
    },
    async ({ date, meetingStart, meetingEnd }) => {
      const start = meetingStart ?? '10:00';
      const end = meetingEnd ?? '17:00';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Preciso ir e voltar de FLN para São Paulo no dia ${date}.`,
                `Minha reunião começa às ${start} e termina por volta das ${end}.`,
                'Quero o voo mais barato — pode ser CGH ou GRU, inclusive ida e volta por aeroportos diferentes.',
                'Use a tool find_best_day_trip e explique a melhor combinação com horários e preços.',
              ].join(' '),
            },
          },
        ],
      };
    }
  );

  return server;
}
