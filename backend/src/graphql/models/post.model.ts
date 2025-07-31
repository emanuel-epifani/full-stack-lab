import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.model';

/**
 * GraphQL Post Model
 * 
 * Definisce la struttura del tipo Post in GraphQL.
 * Include sia i campi del database che quelli calcolati/virtuali.
 */
@ObjectType({
  description: 'Rappresenta un post del blog con il suo autore'
})
export class Post {
  @Field(() => ID, { 
    description: 'Identificativo univoco del post' 
  })
  id: number;

  @Field({ 
    description: 'Titolo del post' 
  })
  title: string;

  @Field(() => String, { 
    nullable: true,
    description: 'Contenuto del post (può essere vuoto per le bozze)' 
  })
  content?: string | null;

  @Field({ 
    description: 'Indica se il post è pubblicato o è ancora una bozza' 
  })
  published: boolean;

  @Field({ 
    description: 'Data di creazione del post' 
  })
  createdAt: Date;

  @Field({ 
    description: 'Data dell\'ultimo aggiornamento' 
  })
  updatedAt: Date;

  /**
   * Foreign key - esiste nel database ma solitamente
   * non serve esporla direttamente in GraphQL
   */
  @Field(() => Int, { 
    description: 'ID dell\'autore del post' 
  })
  authorId: number;

  /**
   * Campo virtuale: l'oggetto User completo viene risolto
   * dinamicamente dal @ResolveField quando richiesto.
   * 
   * Questo è il "bello" di GraphQL: il client può scegliere
   * se vuole anche i dati dell'autore o solo l'ID.
   */
  @Field(() => User, { 
    nullable: true,
    description: 'Autore del post (caricato on-demand)' 
  })
  author?: User;

  /**
   * Campo calcolato: lunghezza del contenuto
   * Viene calcolato dinamicamente quando richiesto.
   */
  @Field(() => Int, { 
    nullable: true,
    description: 'Lunghezza del contenuto in caratteri (calcolato dinamicamente)' 
  })
  contentLength?: number;
}