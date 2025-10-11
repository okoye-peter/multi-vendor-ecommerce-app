import { PrismaClient } from "@prisma/client"
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient();

const seed = async () => {
    let password = 'password';
    try {
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
    } catch ( error) {
    }
    await prisma.user.createMany({
        data: [
            {
                name: "Max Freeman",
                email: 'max.freeman@test.com',
                phone: "09199920131",
                type: 'CUSTOMER',
                password: password,
            },
            {
                name: "Azeez Wasiu",
                email: 'azeez.wasiu@test.com',
                phone: "09121309102",
                type: 'CUSTOMER',
                password: password
            },
        ]
    })
}

seed().then(() => {
    prisma.$disconnect()
})