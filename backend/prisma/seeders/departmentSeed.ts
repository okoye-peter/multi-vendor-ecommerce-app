import { PrismaClient } from "@prisma/client";

const seedDepartments = async (prisma: PrismaClient) => {
    const departments = [
        {
            name: 'Electronics',
            slug: 'electronics',
            updatedAt: new Date()
        },
        {
            name: 'Fashions',
            slug: 'fashions',
            updatedAt: new Date()
        },
        {
            name: 'Health & Beauty',
            slug: 'health-beauty',
            updatedAt: new Date()
        },
        {
            name: 'Books & Audible',
            slug: 'books-audible',
            updatedAt: new Date()
        },
        {
            name: 'Home, Garden & Tools',
            slug: 'home-garden-tools',
            updatedAt: new Date()
        },
    ]
    await prisma.department.createMany({
        data: departments,
        skipDuplicates: true,
  });
}

export default seedDepartments;