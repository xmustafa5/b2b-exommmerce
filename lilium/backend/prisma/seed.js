"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // Clear existing data
    await prisma.$transaction([
        prisma.orderItem.deleteMany(),
        prisma.orderStatusHistory.deleteMany(),
        prisma.order.deleteMany(),
        prisma.favorite.deleteMany(),
        prisma.notifyMe.deleteMany(),
        prisma.neededItem.deleteMany(),
        prisma.stockHistory.deleteMany(),
        prisma.promotionProduct.deleteMany(),
        prisma.promotion.deleteMany(),
        prisma.product.deleteMany(),
        prisma.category.deleteMany(),
        prisma.address.deleteMany(),
        prisma.user.deleteMany(),
        prisma.analytics.deleteMany(),
    ]);
    console.log('✅ Cleared existing data');
    // Create users
    const superAdminPassword = await bcrypt_1.default.hash('Admin@123', 10);
    const locationAdminPassword = await bcrypt_1.default.hash('Location@123', 10);
    const shopOwnerPassword = await bcrypt_1.default.hash('Shop@123', 10);
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@b2b-platform.com',
            password: superAdminPassword,
            name: 'Super Admin',
            role: client_1.UserRole.SUPER_ADMIN,
            zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
            emailVerified: true,
            phoneVerified: true,
            phone: '+9647701234567',
        },
    });
    const locationAdminKarkh = await prisma.user.create({
        data: {
            email: 'admin.karkh@b2b-platform.com',
            password: locationAdminPassword,
            name: 'Karkh Admin',
            role: client_1.UserRole.LOCATION_ADMIN,
            zones: [client_1.Zone.KARKH],
            emailVerified: true,
            phoneVerified: true,
            phone: '+9647701234568',
        },
    });
    const locationAdminRusafa = await prisma.user.create({
        data: {
            email: 'admin.rusafa@b2b-platform.com',
            password: locationAdminPassword,
            name: 'Rusafa Admin',
            role: client_1.UserRole.LOCATION_ADMIN,
            zones: [client_1.Zone.RUSAFA],
            emailVerified: true,
            phoneVerified: true,
            phone: '+9647701234569',
        },
    });
    const shopOwner1 = await prisma.user.create({
        data: {
            email: 'shop1@example.com',
            password: shopOwnerPassword,
            name: 'Ahmed Hassan',
            businessName: 'Al-Noor Pharmacy',
            role: client_1.UserRole.SHOP_OWNER,
            zones: [client_1.Zone.KARKH],
            emailVerified: true,
            phoneVerified: true,
            phone: '+9647701234570',
        },
    });
    const shopOwner2 = await prisma.user.create({
        data: {
            email: 'shop2@example.com',
            password: shopOwnerPassword,
            name: 'Fatima Ali',
            businessName: 'Al-Shifa Medical',
            role: client_1.UserRole.SHOP_OWNER,
            zones: [client_1.Zone.RUSAFA],
            emailVerified: false,
            phoneVerified: true,
            phone: '+9647701234571',
        },
    });
    console.log('✅ Created users');
    // Create addresses for shop owners
    await prisma.address.createMany({
        data: [
            {
                userId: shopOwner1.id,
                name: 'Main Branch',
                street: 'Palestine Street',
                area: 'Mansour',
                building: 'Building 45',
                floor: 'Ground Floor',
                zone: client_1.Zone.KARKH,
                landmark: 'Near Al-Mansour Mall',
                latitude: 33.3152,
                longitude: 44.3661,
                phone: '+9647701234570',
                isDefault: true,
            },
            {
                userId: shopOwner2.id,
                name: 'Main Store',
                street: 'Saadoun Street',
                area: 'Karrada',
                building: 'Building 12',
                floor: '1st Floor',
                zone: client_1.Zone.RUSAFA,
                landmark: 'Opposite Babylon Hotel',
                latitude: 33.3128,
                longitude: 44.4089,
                phone: '+9647701234571',
                isDefault: true,
            },
        ],
    });
    console.log('✅ Created addresses');
    // Create categories
    const medicinesCategory = await prisma.category.create({
        data: {
            nameAr: 'الأدوية',
            nameEn: 'Medicines',
            slug: 'medicines',
            description: 'Pharmaceutical products and medications',
            sortOrder: 1,
        },
    });
    const antibiotics = await prisma.category.create({
        data: {
            nameAr: 'المضادات الحيوية',
            nameEn: 'Antibiotics',
            slug: 'antibiotics',
            description: 'Antibacterial medications',
            parentId: medicinesCategory.id,
            sortOrder: 1,
        },
    });
    const painkillers = await prisma.category.create({
        data: {
            nameAr: 'مسكنات الألم',
            nameEn: 'Painkillers',
            slug: 'painkillers',
            description: 'Pain relief medications',
            parentId: medicinesCategory.id,
            sortOrder: 2,
        },
    });
    const medicalSupplies = await prisma.category.create({
        data: {
            nameAr: 'المستلزمات الطبية',
            nameEn: 'Medical Supplies',
            slug: 'medical-supplies',
            description: 'Medical equipment and supplies',
            sortOrder: 2,
        },
    });
    console.log('✅ Created categories');
    // Create products
    const products = await prisma.product.createMany({
        data: [
            {
                sku: 'AMX500',
                nameAr: 'أموكسيسيلين 500 ملغ',
                nameEn: 'Amoxicillin 500mg',
                descriptionAr: 'مضاد حيوي واسع الطيف',
                descriptionEn: 'Broad-spectrum antibiotic',
                price: 12.5,
                compareAtPrice: 15,
                cost: 8,
                stock: 500,
                minOrderQty: 10,
                unit: 'box',
                images: ['https://example.com/amoxicillin.jpg'],
                categoryId: antibiotics.id,
                zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
                isActive: true,
                isFeatured: true,
            },
            {
                sku: 'PAR500',
                nameAr: 'باراسيتامول 500 ملغ',
                nameEn: 'Paracetamol 500mg',
                descriptionAr: 'مسكن للألم وخافض للحرارة',
                descriptionEn: 'Pain reliever and fever reducer',
                price: 8.0,
                compareAtPrice: 10,
                cost: 5,
                stock: 1000,
                minOrderQty: 20,
                unit: 'box',
                images: ['https://example.com/paracetamol.jpg'],
                categoryId: painkillers.id,
                zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
                isActive: true,
                isFeatured: true,
            },
            {
                sku: 'IBU400',
                nameAr: 'إيبوبروفين 400 ملغ',
                nameEn: 'Ibuprofen 400mg',
                descriptionAr: 'مضاد للالتهاب ومسكن',
                descriptionEn: 'Anti-inflammatory and pain reliever',
                price: 10.0,
                compareAtPrice: 12,
                cost: 7,
                stock: 750,
                minOrderQty: 15,
                unit: 'box',
                images: ['https://example.com/ibuprofen.jpg'],
                categoryId: painkillers.id,
                zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
                isActive: true,
            },
            {
                sku: 'SYR100',
                nameAr: 'محاقن 5 مل',
                nameEn: 'Syringes 5ml',
                descriptionAr: 'محاقن طبية معقمة',
                descriptionEn: 'Sterile medical syringes',
                price: 0.5,
                cost: 0.3,
                stock: 5000,
                minOrderQty: 100,
                unit: 'piece',
                images: ['https://example.com/syringes.jpg'],
                categoryId: medicalSupplies.id,
                zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
                isActive: true,
            },
            {
                sku: 'MASK50',
                nameAr: 'كمامات طبية',
                nameEn: 'Medical Masks',
                descriptionAr: 'كمامات طبية ثلاثية الطبقات',
                descriptionEn: 'Three-layer medical masks',
                price: 5.0,
                cost: 3,
                stock: 2000,
                minOrderQty: 50,
                unit: 'box',
                images: ['https://example.com/masks.jpg'],
                categoryId: medicalSupplies.id,
                zones: [client_1.Zone.KARKH],
                isActive: true,
            },
        ],
    });
    console.log('✅ Created products');
    // Create a promotion
    const promotion = await prisma.promotion.create({
        data: {
            nameAr: 'خصم الصيف',
            nameEn: 'Summer Discount',
            descriptionAr: 'خصم 20% على جميع مسكنات الألم',
            descriptionEn: '20% off on all painkillers',
            type: 'percentage',
            value: 20,
            minPurchase: 50,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            zones: [client_1.Zone.KARKH, client_1.Zone.RUSAFA],
            isActive: true,
        },
    });
    console.log('✅ Created promotions');
    // Link promotion to painkiller products
    const painkillerProducts = await prisma.product.findMany({
        where: { categoryId: painkillers.id },
    });
    await prisma.promotionProduct.createMany({
        data: painkillerProducts.map(product => ({
            promotionId: promotion.id,
            productId: product.id,
        })),
    });
    console.log('✅ Linked promotions to products');
    // Create sample favorites for shop owner
    const someProducts = await prisma.product.findMany({ take: 2 });
    await prisma.favorite.createMany({
        data: someProducts.map(product => ({
            userId: shopOwner1.id,
            productId: product.id,
        })),
    });
    console.log('✅ Created sample favorites');
    // Create sample needed items
    await prisma.neededItem.create({
        data: {
            userId: shopOwner1.id,
            productId: someProducts[0].id,
            quantity: 50,
            frequency: 'monthly',
            notes: 'Regular monthly order',
        },
    });
    console.log('✅ Created sample needed items');
    console.log('🌱 Seed completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Super Admin: admin@b2b-platform.com / Admin@123');
    console.log('Location Admin (Karkh): admin.karkh@b2b-platform.com / Location@123');
    console.log('Location Admin (Rusafa): admin.rusafa@b2b-platform.com / Location@123');
    console.log('Shop Owner 1: shop1@example.com / Shop@123');
    console.log('Shop Owner 2: shop2@example.com / Shop@123');
}
main()
    .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map