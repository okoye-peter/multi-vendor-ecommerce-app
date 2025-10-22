import { PrismaClient } from '@prisma/client'

import seedUsers from './userSeed.ts'
import seedDepartments from './departmentSeed.ts'
import seedCategories from './categorySeed.ts'
import seedStatesAndLgas from './statesAndLgaSeed.ts'

// paste this command `npx prisma db seed` in your terminal to run the seeder  
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding...')

    await seedUsers(prisma)
    await seedStatesAndLgas(prisma)
    await seedDepartments(prisma)
    await seedCategories(prisma)

    console.log('✅ Seeding completed!')
}

main()
    .catch((err) => {
        console.error('❌ Seeding error:', err)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })