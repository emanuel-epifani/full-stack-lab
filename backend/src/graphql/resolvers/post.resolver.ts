import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Int } from '@nestjs/graphql';
import { Post } from '../models/post.model';
import { User } from '../models/user.model';
import { CreatePostInput, UpdatePostInput } from '../inputs/post.input';
import { PrismaService } from '../../prisma.service';

/**
 * POST RESOLVER - Gestisce tutte le operazioni sui post
 * 
 * Dimostra come GraphQL può gestire relazioni bidirezionali:
 * - User → posts (UserResolver)
 * - Post → author (PostResolver)
 */
@Resolver(() => Post)
export class PostResolver {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // QUERIES (Operazioni di lettura)
  // ============================================

  /**
   * Ottiene tutti i post
   * 
   * Query GraphQL: { posts { id title published } }
   */
  @Query(() => [Post], { 
    name: 'posts',
    description: 'Recupera tutti i post del sistema' 
  })
  async getAllPosts(): Promise<Post[]> {
    console.log('🔍 PostResolver.getAllPosts() chiamato');
    
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Ottiene solo i post pubblicati
   * 
   * Query GraphQL: { publishedPosts { title content author { name } } }
   */
  @Query(() => [Post], { 
    name: 'publishedPosts',
    description: 'Recupera solo i post pubblicati' 
  })
  async getPublishedPosts(): Promise<Post[]> {
    console.log('🔍 PostResolver.getPublishedPosts() chiamato');
    
    return this.prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Ottiene un singolo post per ID
   */
  @Query(() => Post, { 
    nullable: true,
    name: 'post',
    description: 'Recupera un post specifico tramite il suo ID' 
  })
  async getPostById(
    @Args('id', { type: () => ID, description: 'ID del post da cercare' }) 
    id: number
  ): Promise<Post | null> {
    console.log(`🔍 PostResolver.getPostById(${id}) chiamato`);
    
    return this.prisma.post.findUnique({
      where: { id: Number(id) }
    });
  }

  /**
   * Cerca post per titolo
   */
  @Query(() => [Post], { 
    name: 'searchPosts',
    description: 'Cerca post per titolo o contenuto' 
  })
  async searchPosts(
    @Args('searchTerm', { description: 'Termine di ricerca' }) 
    searchTerm: string
  ): Promise<Post[]> {
    console.log(`🔍 PostResolver.searchPosts("${searchTerm}") chiamato`);
    
    return this.prisma.post.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ============================================
  // RESOLVE FIELDS (Risoluzione LAZY)
  // ============================================

  /**
   * ⭐ RISOLUZIONE DELL'AUTORE ⭐
   * 
   * Questo metodo viene chiamato SOLO se il client richiede l'author.
   * 
   * Esempi:
   * 
   * Query SENZA author:
   * { posts { title content } }
   * → Questo @ResolveField NON viene chiamato
   * 
   * Query CON author:
   * { posts { title author { name email } } }
   * → Questo @ResolveField viene chiamato per ogni post
   */
  @ResolveField(() => User, { 
    description: 'Autore del post (caricato on-demand)' 
  })
  async author(@Parent() post: Post): Promise<User | null> {
    console.log(`🔍 PostResolver.author() chiamato per post ${post.id}`);
    
    // Questa query viene eseguita SOLO se il client chiede l'author
    return this.prisma.user.findUnique({
      where: { id: post.authorId }
    });
  }

  /**
   * Campo calcolato: lunghezza del contenuto
   */
  @ResolveField(() => Int, { 
    description: 'Lunghezza del contenuto in caratteri (calcolato dinamicamente)' 
  })
  async contentLength(@Parent() post: Post): Promise<number | null> {
    console.log(`🔍 PostResolver.contentLength() chiamato per post ${post.id}`);
    
    return post.content ? post.content.length : null;
  }

  // ============================================
  // MUTATIONS (Operazioni di scrittura)
  // ============================================

  /**
   * Crea un nuovo post
   * 
   * Mutation GraphQL:
   * mutation {
   *   createPost(input: {
   *     title: "Nuovo Post"
   *     content: "Contenuto..."
   *     published: true
   *     authorId: 1
   *   }) {
   *     id
   *     title
   *     author { name }
   *   }
   * }
   */
  @Mutation(() => Post, { 
    description: 'Crea un nuovo post' 
  })
  async createPost(
    @Args('input', { description: 'Dati del nuovo post' }) 
    input: CreatePostInput
  ): Promise<Post> {
    console.log('🔨 PostResolver.createPost() chiamato', input);
    
    return this.prisma.post.create({
      data: input
    });
  }

  /**
   * Aggiorna un post esistente
   */
  @Mutation(() => Post, { 
    nullable: true,
    description: 'Aggiorna un post esistente' 
  })
  async updatePost(
    @Args('id', { type: () => ID, description: 'ID del post da aggiornare' }) 
    id: number,
    @Args('input', { description: 'Nuovi dati del post' }) 
    input: UpdatePostInput
  ): Promise<Post | null> {
    console.log(`🔨 PostResolver.updatePost(${id}) chiamato`, input);
    
    try {
      return await this.prisma.post.update({
        where: { id: Number(id) },
        data: input
      });
    } catch (error) {
      console.error('Errore aggiornamento post:', error);
      return null;
    }
  }

  /**
   * Pubblica/Depubblica un post
   */
  @Mutation(() => Post, { 
    nullable: true,
    description: 'Cambia lo stato di pubblicazione di un post' 
  })
  async togglePostPublication(
    @Args('id', { type: () => ID, description: 'ID del post' }) 
    id: number
  ): Promise<Post | null> {
    console.log(`🔨 PostResolver.togglePostPublication(${id}) chiamato`);
    
    try {
      // Prima recuperiamo il post corrente
      const currentPost = await this.prisma.post.findUnique({
        where: { id: Number(id) }
      });
      
      if (!currentPost) return null;
      
      // Invertiamo lo stato di pubblicazione
      return await this.prisma.post.update({
        where: { id: Number(id) },
        data: { published: !currentPost.published }
      });
    } catch (error) {
      console.error('Errore toggle pubblicazione:', error);
      return null;
    }
  }

  /**
   * Elimina un post
   */
  @Mutation(() => Boolean, { 
    description: 'Elimina un post' 
  })
  async deletePost(
    @Args('id', { type: () => ID, description: 'ID del post da eliminare' }) 
    id: number
  ): Promise<boolean> {
    console.log(`🔨 PostResolver.deletePost(${id}) chiamato`);
    
    try {
      await this.prisma.post.delete({
        where: { id: Number(id) }
      });
      return true;
    } catch (error) {
      console.error('Errore eliminazione post:', error);
      return false;
    }
  }
}