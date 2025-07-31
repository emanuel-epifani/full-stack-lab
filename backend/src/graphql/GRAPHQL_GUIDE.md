# 🚀 Guida Completa a GraphQL

## 📚 Indice
1. [Cos'è GraphQL](#cosè-graphql)
2. [Differenze con REST](#differenze-con-rest)
3. [Come Funziona](#come-funziona)
4. [Struttura del Progetto](#struttura-del-progetto)
5. [Query di Esempio](#query-di-esempio)
6. [Testare le Query](#testare-le-query)
7. [Concetti Avanzati](#concetti-avanzati)

## 📝 Cos'è GraphQL

GraphQL è un **linguaggio di query** e runtime per API che permette al client di specificare esattamente quali dati vuole ricevere.

### 🔑 Concetti Chiave

- **Un solo endpoint**: `/graphql` (non come REST con tanti endpoint)
- **Client-driven**: il frontend decide quali dati vuole
- **Tipizzato**: schema ben definito con tipi precisi
- **Introspettivo**: l'API si auto-documenta

## 🆚 Differenze con REST

### REST (Approccio tradizionale)
```
GET /api/users           → Tutti i campi di tutti gli utenti
GET /api/users/1         → Tutti i campi dell'utente 1
GET /api/users/1/posts   → Tutti i campi dei post dell'utente 1
```

**Problemi:**
- ❌ Over-fetching: ricevi sempre tutti i campi
- ❌ Under-fetching: devi fare più chiamate per dati correlati
- ❌ Multiple round-trip: tante chiamate HTTP
- ❌ Endpoint proliferation: tanti endpoint da mantenere

### GraphQL (Nuovo approccio)
```
POST /graphql
Body: {
  query: "{
    users {
      name
      posts { title }
    }
  }"
}
```

**Vantaggi:**
- ✅ Precise fetching: ricevi solo i campi richiesti
- ✅ Single round-trip: una sola chiamata HTTP
- ✅ Relazioni on-demand: naviga le relazioni come vuoi
- ✅ Un solo endpoint: `/graphql` per tutto

## 🔧 Come Funziona

### 1. Il Client invia una Query
```graphql
query {
  users {
    name
    email
    posts {
      title
      published
    }
  }
}
```

### 2. Il Server GraphQL Analizza la Query
- Parsa la sintassi GraphQL
- Identifica i campi richiesti
- Pianifica l'esecuzione

### 3. Esecuzione dei Resolver
I **resolver** sono funzioni che sanno come ottenere ogni campo:

```typescript
// 1. Resolver per "users"
@Query(() => [User])
async users(): Promise<User[]> {
  // SELECT id, name, email FROM users
  return this.prisma.user.findMany();
}

// 2. Resolver per "posts" (chiamato PER OGNI user)
@ResolveField(() => [Post])
async posts(@Parent() user: User): Promise<Post[]> {
  // SELECT * FROM posts WHERE author_id = ?
  return this.prisma.post.findMany({
    where: { authorId: user.id }
  });
}
```

### 4. La "Magia" del Lazy Loading

**Questo è il punto fondamentale:** i resolver vengono chiamati **solo se necessario**!

```graphql
# Query 1: Solo nomi utenti
{
  users {
    name  # Solo il resolver "users" viene chiamato
  }
}

# Query 2: Utenti con post
{
  users {
    name
    posts {  # Ora viene chiamato ANCHE il resolver "posts"
      title
    }
  }
}
```

**Log del server:**

Query 1:
```
🔍 UserResolver.getAllUsers() chiamato
```

Query 2:
```
🔍 UserResolver.getAllUsers() chiamato
🔍 UserResolver.posts() chiamato per user 1
🔍 UserResolver.posts() chiamato per user 2
🔍 UserResolver.posts() chiamato per user 3
```

## 📁 Struttura del Progetto

```
src/graphql/
├── models/           # Definizioni dei tipi GraphQL
│   ├── user.model.ts     # @ObjectType() per User
│   └── post.model.ts     # @ObjectType() per Post
├── inputs/           # Input types per mutations
│   ├── user.input.ts     # CreateUserInput, UpdateUserInput
│   └── post.input.ts     # CreatePostInput, UpdatePostInput
├── resolvers/        # Business logic
│   ├── user.resolver.ts  # Query, Mutations, ResolveFields per User
│   └── post.resolver.ts  # Query, Mutations, ResolveFields per Post
└── graphql.module.ts # Configurazione del modulo
```

### 🏗️ Architettura dei Resolver

Ogni resolver ha 3 tipi di metodi:

1. **@Query**: Operazioni di lettura (GET in REST)
2. **@Mutation**: Operazioni di scrittura (POST/PUT/DELETE in REST)
3. **@ResolveField**: Risoluzione lazy dei campi correlati

## 🔍 Query di Esempio

### Query Base

```graphql
# Tutti gli utenti con nome e email
{
  users {
    id
    name
    email
  }
}
```

### Query con Relazioni

```graphql
# Utenti con i loro post
{
  users {
    name
    email
    posts {
      title
      published
      createdAt
    }
  }
}
```

### Query con Parametri

```graphql
# Un utente specifico
{
  user(id: 1) {
    name
    email
    postCount  # Campo calcolato!
  }
}
```

### Query di Ricerca

```graphql
# Cerca utenti per nome
{
  searchUsers(searchTerm: "Mario") {
    name
    email
  }
}
```

### Relazioni Bidirezionali

```graphql
# Post con i loro autori
{
  posts {
    title
    content
    author {
      name
      email
    }
  }
}
```

### Query Complesse

```graphql
# Combinazione di tutto
{
  users {
    name
    postCount
    posts {
      title
      contentLength  # Campo calcolato!
      author {       # Anche se ridondante!
        name
      }
    }
  }
  
  publishedPosts {
    title
    author {
      name
    }
  }
}
```

## 🧪 Mutations (Scrittura)

### Creare un Utente

```graphql
mutation {
  createUser(input: {
    email: "nuovo@test.com"
    name: "Nuovo Utente"
  }) {
    id
    name
    email
    createdAt
  }
}
```

### Creare un Post

```graphql
mutation {
  createPost(input: {
    title: "Il mio nuovo post"
    content: "Contenuto del post..."
    published: true
    authorId: 1
  }) {
    id
    title
    author {
      name
    }
  }
}
```

### Aggiornare un Post

```graphql
mutation {
  updatePost(
    id: 1
    input: {
      title: "Titolo aggiornato"
      published: false
    }
  ) {
    id
    title
    published
    updatedAt
  }
}
```

### Toggle Pubblicazione

```graphql
mutation {
  togglePostPublication(id: 1) {
    id
    title
    published
  }
}
```

## 🧪 Testare le Query

### 1. Avvia il Server

```bash
cd backend
npm run start:dev
```

### 2. Apri GraphQL Playground

Vai a: http://localhost:3000/graphql

### 3. Esplora lo Schema

Il playground mostra automaticamente:
- 📋 Tutti i tipi disponibili
- 🔍 Tutte le query possibili
- ✏️ Tutte le mutation disponibili
- 📖 Documentazione auto-generata

### 4. Test delle Query

Prova queste query nell'ordine:

```graphql
# 1. Query semplice
{
  users {
    name
    email
  }
}

# 2. Aggiungi i post
{
  users {
    name
    email
    posts {
      title
    }
  }
}

# 3. Guarda i log del server!
# Vedrai come i resolver vengono chiamati solo quando necessario
```

## 🚀 Concetti Avanzati

### 1. N+1 Problem

**Problema:** Per ogni utente, viene fatta una query separata per i post.

```
SELECT * FROM users;           -- 1 query
SELECT * FROM posts WHERE author_id = 1;  -- N queries (una per user)
SELECT * FROM posts WHERE author_id = 2;
SELECT * FROM posts WHERE author_id = 3;
```

**Soluzione:** DataLoader (batch loading)

```typescript
@ResolveField(() => [Post])
async posts(@Parent() user: User, @Context() { postsLoader }): Promise<Post[]> {
  // Invece di query singole, fa batch loading
  return postsLoader.load(user.id);
}
```

### 2. Field Selection

GraphQL può ottimizzare le query database basandosi sui campi richiesti:

```typescript
@ResolveField(() => [Post])
async posts(@Parent() user: User, @Info() info: GraphQLResolveInfo): Promise<Post[]> {
  // Analizza info per vedere quali campi del Post sono richiesti
  // Può ottimizzare la query Prisma di conseguenza
}
```

### 3. Caching

GraphQL si integra bene con sistemi di cache:

```typescript
@Query(() => [User])
@UseInterceptors(CacheInterceptor)
async users(): Promise<User[]> {
  // Risultati cachati automaticamente
}
```

### 4. Subscription (Real-time)

Per dati in tempo reale:

```typescript
@Subscription(() => Post)
newPost() {
  return this.pubSub.asyncIterator('postAdded');
}
```

## 🎯 Vantaggi di questo Approccio

1. **Performance**: Solo i dati necessari vengono trasferiti
2. **Flessibilità**: Il frontend può evolvere senza cambiare il backend
3. **Developer Experience**: Playground auto-documentato
4. **Type Safety**: Schema tipizzato end-to-end
5. **Single Source of Truth**: Un solo endpoint, una sola API

## 🔗 Risorse Utili

- [GraphQL Official Docs](https://graphql.org/)
- [NestJS GraphQL](https://docs.nestjs.com/graphql/quick-start)
- [Apollo GraphQL](https://www.apollographql.com/)
- [Prisma GraphQL](https://www.prisma.io/docs/concepts/overview/prisma-in-your-stack/graphql)

---

**💡 Tip:** Inizia sempre con query semplici e aggiungi complessità gradualmente. GraphQL è potente ma può essere overwhelming all'inizio!