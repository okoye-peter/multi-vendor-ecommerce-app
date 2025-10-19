import { PrismaClient } from "@prisma/client";

const seedCategories = async (prisma: PrismaClient) => {
    const categoryData = [
        {
            name: 'Electronics',
            departmentId: 1,
            categoryId: null,
            updatedAt: new Date()
        },
        {
            name: 'Fashion',
            departmentId: 2,
            categoryId: null,
            updatedAt: new Date()
        },
        {
            name: 'Computers',
            departmentId: 1,
            categoryId: 1,
            updatedAt: new Date()
        },
        {
            name: 'Smartphones',
            departmentId: 1,
            categoryId: 1,
            updatedAt: new Date()
        },
        {
            name: 'Laptops',
            departmentId: 1,
            categoryId: 3,
            updatedAt: new Date()
        },
        {
            name: 'Desktop',
            departmentId: 1,
            categoryId: 3,
            updatedAt: new Date()
        },
        {
            name: 'Android',
            departmentId: 1,
            categoryId: 4,
            updatedAt: new Date()
        },
        {
            name: 'iPhone',
            departmentId: 1,
            categoryId: 4,
            updatedAt: new Date()
        }
    ]

    await prisma.category.createMany({
        data:categoryData
    })
}

export default seedCategories;