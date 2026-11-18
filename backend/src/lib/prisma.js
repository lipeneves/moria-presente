import { PrismaClient } from '@prisma/client';

// Uma única instância por processo: cada PrismaClient abre o próprio pool de conexões.
export const prisma = new PrismaClient();
