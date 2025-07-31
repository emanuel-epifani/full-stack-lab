import { InputType, Field, Int } from '@nestjs/graphql';

/**
 * Input per creare un nuovo post
 */
@InputType({
  description: 'Dati necessari per creare un nuovo post'
})
export class CreatePostInput {
  @Field({ 
    description: 'Titolo del post' 
  })
  title: string;

  @Field({ 
    nullable: true,
    description: 'Contenuto del post (opzionale per le bozze)' 
  })
  content?: string;

  @Field({ 
    defaultValue: false,
    description: 'Se il post deve essere pubblicato immediatamente' 
  })
  published: boolean;

  @Field(() => Int, { 
    description: 'ID dell\'autore del post' 
  })
  authorId: number;
}

/**
 * Input per aggiornare un post esistente
 */
@InputType({
  description: 'Dati per aggiornare un post esistente (tutti i campi sono opzionali)'
})
export class UpdatePostInput {
  @Field({ 
    nullable: true,
    description: 'Nuovo titolo del post' 
  })
  title?: string;

  @Field({ 
    nullable: true,
    description: 'Nuovo contenuto del post' 
  })
  content?: string;

  @Field({ 
    nullable: true,
    description: 'Nuovo stato di pubblicazione' 
  })
  published?: boolean;
}