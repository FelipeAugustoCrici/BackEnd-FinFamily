import 'dotenv/config'
import { app } from './app'

const PORT = Number(process.env.PORT) || 8080

async function bootstrap() {
  await app.ready()
  await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(`Server running on http://localhost:${PORT}`)
}

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received — shutting down`)
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

bootstrap().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
