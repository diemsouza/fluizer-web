import { Prisma, prisma } from "../lib/prisma";
import { MAX_RETRY_ATTEMPTS } from "../lib/constants";

// P2034: conflito de escrita no isolamento serializavel; a outra transacao
// venceu e esta pode rodar de novo com o valor novo.
const WRITE_CONFLICT_CODE = "P2034";

function isWriteConflict(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === WRITE_CONFLICT_CODE
  );
}

// Leitura e escrita na mesma transacao serializavel: duas atualizacoes ao mesmo
// tempo do mesmo JSON nunca apagam uma a outra.
export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      if (!isWriteConflict(err) || attempt >= MAX_RETRY_ATTEMPTS) throw err;
    }
  }
}
