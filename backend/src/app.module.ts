import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphqlModule } from './graphql/graphql.module';

/**
 * APP MODULE - Modulo principale dell'applicazione
 * 
 * Configura GraphQL con:
 * - Schema automatico generato dai resolver
 * - GraphQL Playground per testare le query
 * - Sorting dei campi dello schema per consistenza
 */
@Module({
  imports: [
    // Configurazione GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      
      // Schema file generato automaticamente
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      
      // Ordinamento dello schema per consistenza
      sortSchema: true,
      
      // GraphQL Playground per testing (solo in development)
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
      
      // Configurazioni opzionali
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
      
      // Formattazione degli errori
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
    }),
    
    // Il nostro modulo GraphQL
    GraphqlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
