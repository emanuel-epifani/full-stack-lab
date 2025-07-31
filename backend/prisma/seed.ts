import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
   // Pulire il database (opzionale)
   await prisma.post.deleteMany()
   await prisma.user.deleteMany()

   // Creare utenti mock
   const users = await Promise.all([
      prisma.user.create({
         data: {
            email: 'mario.rossi@example.com',
            name: 'Mario Rossi',
         },
      }),
      prisma.user.create({
         data: {
            email: 'giulia.verdi@example.com',
            name: 'Giulia Verdi',
         },
      }),
      prisma.user.create({
         data: {
            email: 'francesco.bianchi@example.com',
            name: 'Francesco Bianchi',
         },
      }),
   ])

   // Creare post mock
   const posts = await Promise.all([
      prisma.post.create({
         data: {
            title: 'Il mio primo post',
            content: 'Questo è il contenuto del mio primo post. Sono molto entusiasta di condividere i miei pensieri con voi!',
            published: true,
            authorId: users[0].id,
         },
      }),
      prisma.post.create({
         data: {
            title: 'Introduzione a NestJS',
            content: 'NestJS è un framework Node.js fantastico per costruire applicazioni scalabili. In questo post esploreremo le sue caratteristiche principali.',
            published: true,
            authorId: users[0].id,
         },
      }),
      prisma.post.create({
         data: {
            title: 'Database e Prisma',
            content: 'Prisma semplifica notevolmente il lavoro con i database. Ecco come configurarlo nel vostro progetto.',
            published: false,
            authorId: users[1].id,
         },
      }),
      prisma.post.create({
         data: {
            title: 'Docker per sviluppatori',
            content: 'Docker è uno strumento essenziale per lo sviluppo moderno. Vi mostro come usarlo efficacemente.',
            published: true,
            authorId: users[1].id,
         },
      }),
      prisma.post.create({
         data: {
            title: 'TypeScript Best Practices',
            content: 'Alcune pratiche consigliate quando si lavora con TypeScript in progetti di grandi dimensioni.',
            published: false,
            authorId: users[2].id,
         },
      }),
      prisma.post.create({
         data: {
            title: 'Frontend con Next.js',
            content: 'Next.js offre molte funzionalità out-of-the-box per costruire applicazioni React moderne.',
            published: true,
            authorId: users[2].id,
         },
      }),
   ])

   console.log('🌱 Seed completato!')
   console.log(`✅ Creati ${users.length} utenti`)
   console.log(`✅ Creati ${posts.length} post`)

   // Mostra alcuni dati creati
   console.log('\n📋 Utenti creati:')
   users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`)
   })

   console.log('\n📝 Post creati:')
   posts.forEach(post => {
      const author = users.find(u => u.id === post.authorId)
      console.log(`- "${post.title}" di ${author?.name} ${post.published ? '(pubblicato)' : '(bozza)'}`)
   })
}

main()
   .catch((e) => {
      console.error('❌ Errore durante il seed:', e)
      process.exit(1)
   })
   .finally(async () => {
      await prisma.$disconnect()
   })