import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Int } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { Post } from '../models/post.model';
import { CreateUserInput, UpdateUserInput } from '../inputs/user.input';
import { PrismaService } from '../../prisma.service';

/**
 * USER RESOLVER - Il cuore dell'API GraphQL per gli utenti
 * 
 * CONCETTI CHIAVE:
 * 
 * 1. @Query: Operazioni di lettura (equivalenti a GET in REST)
 * 2. @Mutation: Operazioni di scrittura (POST, PUT, DELETE in REST)
 * 3. @ResolveField: Risoluzione LAZY dei campi correlati
 * 
 * DIFFERENZA CON REST:
 * - REST: hai bisogno di endpoint separati (/users, /users/:id, /users/:id/posts)
 * - GraphQL: un solo resolver con metodi diversi, il client sceglie cosa chiedere
 */
@Resolver(() => User)
export class UserResolver {
   constructor(private prisma: PrismaService) { }

   // ============================================
   // QUERIES (Operazioni di lettura)
   // ============================================

   /**
    * Ottiene tutti gli utenti
    * 
    * Query GraphQL: { users { id name email } }
    * 
    * NOTA: I post NON vengono caricati automaticamente!
    * Vengono caricati solo se il client li richiede esplicitamente.
    */
   @Query(() => [User], {
      name: 'users',
      description: 'Recupera tutti gli utenti registrati nel sistema'
   })
   async getAllUsers(): Promise<User[]> {
      console.log('🔍 UserResolver.getAllUsers() chiamato');

      // Questa query Prisma NON include i post
      // I post verranno caricati dal @ResolveField se richiesti
      return this.prisma.user.findMany({
         orderBy: { createdAt: 'desc' }
      });
   }

   /**
    * Ottiene un singolo utente per ID
    * 
    * Query GraphQL: { user(id: 1) { name email } }
    */
   @Query(() => User, {
      nullable: true,
      name: 'user',
      description: 'Recupera un utente specifico tramite il suo ID'
   })
   async getUserById(
      @Args('id', { type: () => ID, description: 'ID dell\'utente da cercare' })
      id: number
   ): Promise<User | null> {
      console.log(`🔍 UserResolver.getUserById(${id}) chiamato`);

      return this.prisma.user.findUnique({
         where: { id: Number(id) }
      });
   }

   /**
    * Cerca utenti per nome (query di esempio)
    * 
    * Query GraphQL: { searchUsers(searchTerm: "Mario") { name email } }
    */
   @Query(() => [User], {
      name: 'searchUsers',
      description: 'Cerca utenti per nome (case-insensitive)'
   })
   async searchUsers(
      @Args('searchTerm', { description: 'Termine di ricerca' })
      searchTerm: string
   ): Promise<User[]> {
      console.log(`🔍 UserResolver.searchUsers("${searchTerm}") chiamato`);

      return this.prisma.user.findMany({
         where: {
            name: {
               contains: searchTerm,
               mode: 'insensitive'
            }
         }
      });
   }

   // ============================================
   // RESOLVE FIELDS (Risoluzione LAZY)
   // ============================================

   /**
    * ⭐ QUESTO È IL "TRUCCO" DI GRAPHQL ⭐
    * 
    * Questo metodo viene chiamato SOLO se il client richiede il campo 'posts'
    * nella sua query GraphQL.
    * 
    * Esempi:
    * 
    * Query SENZA posts:
    * { users { name email } }
    * → Questo @ResolveField NON viene chiamato
    * 
    * Query CON posts:
    * { users { name email posts { title } } }
    * → Questo @ResolveField viene chiamato per ogni utente
    */
   @ResolveField(() => [Post], {
      description: 'Post scritti da questo utente (caricato on-demand)'
   })
   async posts(@Parent() user: User): Promise<Post[]> {
      console.log(`🔍 UserResolver.posts() chiamato per user ${user.id}`);

      // Questa query viene eseguita SOLO se il client chiede i posts
      return this.prisma.post.findMany({
         where: { authorId: user.id },
         orderBy: { createdAt: 'desc' }
      });
   }

   /**
    * Campo calcolato: numero di post dell'utente
    * 
    * Viene calcolato SOLO quando richiesto dal client.
    */
   @ResolveField(() => Int, {
      description: 'Numero totale di post dell\'utente (calcolato dinamicamente)'
   })
   async postCount(@Parent() user: User): Promise<number> {
      console.log(`🔍 UserResolver.postCount() chiamato per user ${user.id}`);

      return this.prisma.post.count({
         where: { authorId: user.id }
      });
   }

   // ============================================
   // MUTATIONS (Operazioni di scrittura)
   // ============================================

   /**
    * Crea un nuovo utente
    * 
    * Mutation GraphQL:
    * mutation {
    *   createUser(input: { email: "test@test.com", name: "Test User" }) {
    *     id
    *     name
    *     email
    *   }
    * }
    */
   @Mutation(() => User, {
      description: 'Crea un nuovo utente'
   })
   async createUser(
      @Args('input', { description: 'Dati del nuovo utente' })
      input: CreateUserInput
   ): Promise<User> {
      console.log('🔨 UserResolver.createUser() chiamato', input);

      return this.prisma.user.create({
         data: input
      });
   }

   /**
    * Aggiorna un utente esistente
    */
   @Mutation(() => User, {
      nullable: true,
      description: 'Aggiorna un utente esistente'
   })
   async updateUser(
      @Args('id', { type: () => ID, description: 'ID dell\'utente da aggiornare' })
      id: number,
      @Args('input', { description: 'Nuovi dati dell\'utente' })
      input: UpdateUserInput
   ): Promise<User | null> {
      console.log(`🔨 UserResolver.updateUser(${id}) chiamato`, input);

      try {
         return await this.prisma.user.update({
            where: { id: Number(id) },
            data: input
         });
      } catch (error) {
         console.error('Errore aggiornamento utente:', error);
         return null;
      }
   }

   /**
    * Elimina un utente
    */
   @Mutation(() => Boolean, {
      description: 'Elimina un utente e tutti i suoi post'
   })
   async deleteUser(
      @Args('id', { type: () => ID, description: 'ID dell\'utente da eliminare' })
      id: number
   ): Promise<boolean> {
      console.log(`🔨 UserResolver.deleteUser(${id}) chiamato`);

      try {
         // Prisma eliminerà automaticamente i post correlati (onDelete: Cascade)
         await this.prisma.user.delete({
            where: { id: Number(id) }
         });
         return true;
      } catch (error) {
         console.error('Errore eliminazione utente:', error);
         return false;
      }
   }
}