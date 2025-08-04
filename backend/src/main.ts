import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3001;
  
  await app.listen(port);
  
  // Log con URL cliccabili
  console.log('\n🔥 Backend Application Started Successfully!');
  console.log(`⚡ Server running on: http://localhost:${port}`);
  console.log(`🔧 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log('📡 Click the URLs above to open in browser\n');
}
bootstrap();
