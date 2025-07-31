import { Module } from '@nestjs/common';
import { UserResolver } from './resolvers/user.resolver';
import { PostResolver } from './resolvers/post.resolver';
import { PrismaService } from '../prisma.service';

/**
 * GRAPHQL MODULE - Modulo principale per GraphQL
 * 
 * Questo modulo raccoglie tutti i resolver e servizi necessari
 * per il funzionamento dell'API GraphQL.
 * 
 * ORGANIZZAZIONE:
 * - Tutti i resolver vengono registrati qui
 * - PrismaService viene fornito a tutti i resolver
 * - Può essere facilmente esteso con nuovi resolver
 */
@Module({
  providers: [
    // Servizi
    PrismaService,
    
    // Resolver GraphQL
    UserResolver,
    PostResolver,
  ],
  exports: [
    PrismaService, // Esportiamo PrismaService per altri moduli
  ],
})
export class GraphqlModule {}