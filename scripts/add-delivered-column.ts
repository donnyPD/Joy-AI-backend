import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if column exists by trying to query it
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_form_submissions' 
      AND column_name = 'delivered'
    `
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ Column "delivered" already exists')
    } else {
      console.log('⏳ Adding column "delivered"...')
      await prisma.$executeRaw`
        ALTER TABLE "inventory_form_submissions" 
        ADD COLUMN IF NOT EXISTS "delivered" BOOLEAN NOT NULL DEFAULT false
      `
      console.log('✅ Column "delivered" added successfully')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
