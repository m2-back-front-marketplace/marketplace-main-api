import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function main() {
    if (await prisma.users.count() < 1 ){
    await prisma.users.create({
        data: {
            username: "test",
            email: "test@test.com",
            password: "test",
            role: "Client"
        }
    })
    }

    console.log(prisma.users.findMany())
}

main()

console.log("caca")