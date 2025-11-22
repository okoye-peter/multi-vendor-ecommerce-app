import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/generated-schema.prisma',
  migrations: {
    path: './prisma/migrations'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
})