const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main(){
  const NEW = process.env.NEW_PASSWORD || 'albassam2024'
  const USER = process.env.USERNAME || 'mohammed'
  const hash = await bcrypt.hash(NEW, 10)
  const user = await prisma.user.findUnique({ where: { username: USER }, select: { id: true, username: true } })
  if(!user){
    console.error('User not found:', USER)
    process.exit(2)
  }
  await prisma.user.update({ where: { username: USER }, data: { passwordHash: hash } })
  console.log('Password updated for', USER)
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
