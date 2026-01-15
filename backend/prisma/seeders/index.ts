import seedUsers from './userSeed.ts'
import seedDepartmentsAndCategories from './departmentAndCategorySeed.ts'
import seedStatesAndLgas from './statesAndLgaSeed.ts'

// paste this command `npm run prisma:seed` in your terminal to run the seeder  
import prisma from '../../src/libs/prisma.ts'


async function main() {
    console.log('🌱 Starting database seeding...')

    await seedUsers(prisma)
    await seedStatesAndLgas(prisma)
    await seedDepartmentsAndCategories(prisma)
    // Categories are now seeded within departmentSeed

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