import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Post } from './post.model';

/**
 * GraphQL User Model
 * 
 * Questo modello definisce la struttura del tipo User in GraphQL.
 * Ogni @Field() corrisponde a un campo che può essere richiesto nelle query.
 * 
 * IMPORTANTE: Il campo 'posts' è opzionale (nullable: true) perché viene
 * risolto dinamicamente tramite un @ResolveField nel resolver.
 */
@ObjectType({
  description: 'Rappresenta un utente del sistema con i suoi post associati'
})
export class User {
  @Field(() => ID, { 
    description: 'Identificativo univoco dell\'utente' 
  })
  id: number;

  @Field({ 
    description: 'Indirizzo email dell\'utente (deve essere unico)' 
  })
  email: string;

  @Field({ 
    description: 'Nome completo dell\'utente' 
  })
  name: string;

  @Field({ 
    description: 'Data di creazione dell\'account' 
  })
  createdAt: Date;

  @Field({ 
    description: 'Data dell\'ultimo aggiornamento' 
  })
  updatedAt: Date;

  /**
   * Campo virtuale: non esiste nel database come array,
   * ma viene risolto dinamicamente dal @ResolveField
   * nel UserResolver quando richiesto dal client.
   */
  @Field(() => [Post], { 
    nullable: true,
    description: 'Lista dei post scritti da questo utente (caricato on-demand)' 
  })
  posts?: Post[];

  /**
   * Campo calcolato: non esiste nel database,
   * viene calcolato dinamicamente quando richiesto.
   */
  @Field(() => Int, { 
    nullable: true,
    description: 'Numero totale di post dell\'utente (calcolato dinamicamente)' 
  })
  postCount?: number;
}