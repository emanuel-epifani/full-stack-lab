import { InputType, Field } from '@nestjs/graphql';

/**
 * Input per creare un nuovo utente
 */
@InputType({
  description: 'Dati necessari per creare un nuovo utente'
})
export class CreateUserInput {
  @Field({ 
    description: 'Email dell\'utente (deve essere unica)' 
  })
  email: string;

  @Field({ 
    description: 'Nome completo dell\'utente' 
  })
  name: string;
}

/**
 * Input per aggiornare un utente esistente
 */
@InputType({
  description: 'Dati per aggiornare un utente esistente (tutti i campi sono opzionali)'
})
export class UpdateUserInput {
  @Field({ 
    nullable: true,
    description: 'Nuova email dell\'utente' 
  })
  email?: string;

  @Field({ 
    nullable: true,
    description: 'Nuovo nome dell\'utente' 
  })
  name?: string;
}