import { PrismaClient, Zone } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductsAndCategories() {
  console.log('🌱 Seeding categories and products...');

  // Create categories
  const categories = [
    {
      nameEn: 'Beverages',
      nameAr: 'المشروبات',
      descriptionEn: 'Soft drinks, juices, and water',
      descriptionAr: 'المشروبات الغازية والعصائر والمياه',
      icon: '🥤',
      displayOrder: 1,
    },
    {
      nameEn: 'Snacks',
      nameAr: 'الوجبات الخفيفة',
      descriptionEn: 'Chips, crackers, and nuts',
      descriptionAr: 'رقائق البطاطس والمقرمشات والمكسرات',
      icon: '🍿',
      displayOrder: 2,
    },
    {
      nameEn: 'Dairy Products',
      nameAr: 'منتجات الألبان',
      descriptionEn: 'Milk, cheese, and yogurt',
      descriptionAr: 'الحليب والجبن واللبن',
      icon: '🥛',
      displayOrder: 3,
    },
    {
      nameEn: 'Cleaning Supplies',
      nameAr: 'مواد التنظيف',
      descriptionEn: 'Detergents and cleaning products',
      descriptionAr: 'المنظفات ومواد التنظيف',
      icon: '🧹',
      displayOrder: 4,
    },
    {
      nameEn: 'Personal Care',
      nameAr: 'العناية الشخصية',
      descriptionEn: 'Hygiene and beauty products',
      descriptionAr: 'منتجات النظافة والجمال',
      icon: '🧴',
      displayOrder: 5,
    },
  ];

  const createdCategories = [];

  for (const category of categories) {
    const created = await prisma.category.create({
      data: category,
    });
    createdCategories.push(created);
  }

  console.log(`✅ Created ${createdCategories.length} categories`);

  // Create products
  const products = [
    // Beverages
    {
      nameEn: 'Coca Cola 330ml',
      nameAr: 'كوكا كولا 330 مل',
      descriptionEn: 'Classic Coca Cola soft drink',
      descriptionAr: 'مشروب كوكا كولا الغازي الكلاسيكي',
      sku: 'BEV-COCA-330',
      barcode: '5000112637922',
      categoryId: createdCategories[0].id,
      price: 1500,
      comparisonPrice: 2000,
      cost: 1000,
      stock: 500,
      minOrderQty: 12,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/coca-cola.jpg'],
      isFeatured: true,
    },
    {
      nameEn: 'Pepsi 330ml',
      nameAr: 'بيبسي 330 مل',
      descriptionEn: 'Pepsi cola soft drink',
      descriptionAr: 'مشروب بيبسي الغازي',
      sku: 'BEV-PEPSI-330',
      barcode: '5000112637923',
      categoryId: createdCategories[0].id,
      price: 1500,
      comparisonPrice: 2000,
      cost: 1000,
      stock: 450,
      minOrderQty: 12,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/pepsi.jpg'],
    },
    {
      nameEn: 'Orange Juice 1L',
      nameAr: 'عصير برتقال 1 لتر',
      descriptionEn: 'Fresh orange juice',
      descriptionAr: 'عصير برتقال طازج',
      sku: 'BEV-ORNG-1L',
      barcode: '5000112637924',
      categoryId: createdCategories[0].id,
      price: 3500,
      comparisonPrice: 4500,
      cost: 2500,
      stock: 200,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/orange-juice.jpg'],
      isFeatured: true,
    },

    // Snacks
    {
      nameEn: 'Lays Classic 150g',
      nameAr: 'ليز كلاسيك 150 جم',
      descriptionEn: 'Classic potato chips',
      descriptionAr: 'رقائق بطاطس كلاسيكية',
      sku: 'SNK-LAYS-150',
      barcode: '5000112637925',
      categoryId: createdCategories[1].id,
      price: 2500,
      comparisonPrice: 3000,
      cost: 1800,
      stock: 300,
      minOrderQty: 12,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/lays.jpg'],
    },
    {
      nameEn: 'Mixed Nuts 200g',
      nameAr: 'مكسرات مشكلة 200 جم',
      descriptionEn: 'Premium mixed nuts',
      descriptionAr: 'مكسرات مشكلة فاخرة',
      sku: 'SNK-NUTS-200',
      barcode: '5000112637926',
      categoryId: createdCategories[1].id,
      price: 8000,
      comparisonPrice: 10000,
      cost: 6000,
      stock: 150,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.KARKH],
      images: ['https://example.com/nuts.jpg'],
      isFeatured: true,
    },

    // Dairy Products
    {
      nameEn: 'Fresh Milk 1L',
      nameAr: 'حليب طازج 1 لتر',
      descriptionEn: 'Full cream fresh milk',
      descriptionAr: 'حليب طازج كامل الدسم',
      sku: 'DRY-MILK-1L',
      barcode: '5000112637927',
      categoryId: createdCategories[2].id,
      price: 3000,
      comparisonPrice: 3500,
      cost: 2200,
      stock: 100,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/milk.jpg'],
    },
    {
      nameEn: 'White Cheese 500g',
      nameAr: 'جبنة بيضاء 500 جم',
      descriptionEn: 'Fresh white cheese',
      descriptionAr: 'جبنة بيضاء طازجة',
      sku: 'DRY-CHSE-500',
      barcode: '5000112637928',
      categoryId: createdCategories[2].id,
      price: 5500,
      comparisonPrice: 7000,
      cost: 4000,
      stock: 80,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.RUSAFA],
      images: ['https://example.com/cheese.jpg'],
    },

    // Cleaning Supplies
    {
      nameEn: 'Dishwashing Liquid 1L',
      nameAr: 'سائل غسيل الصحون 1 لتر',
      descriptionEn: 'Effective dishwashing liquid',
      descriptionAr: 'سائل فعال لغسيل الصحون',
      sku: 'CLN-DISH-1L',
      barcode: '5000112637929',
      categoryId: createdCategories[3].id,
      price: 4500,
      comparisonPrice: 5500,
      cost: 3200,
      stock: 200,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/dish-liquid.jpg'],
    },
    {
      nameEn: 'Floor Cleaner 2L',
      nameAr: 'منظف الأرضيات 2 لتر',
      descriptionEn: 'Multi-surface floor cleaner',
      descriptionAr: 'منظف أرضيات متعدد الأسطح',
      sku: 'CLN-FLOR-2L',
      barcode: '5000112637930',
      categoryId: createdCategories[3].id,
      price: 7000,
      comparisonPrice: 9000,
      cost: 5000,
      stock: 150,
      minOrderQty: 4,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/floor-cleaner.jpg'],
      isFeatured: true,
    },

    // Personal Care
    {
      nameEn: 'Shampoo 400ml',
      nameAr: 'شامبو 400 مل',
      descriptionEn: 'Hair shampoo for all hair types',
      descriptionAr: 'شامبو للشعر لجميع أنواع الشعر',
      sku: 'PER-SHMP-400',
      barcode: '5000112637931',
      categoryId: createdCategories[4].id,
      price: 6500,
      comparisonPrice: 8000,
      cost: 4500,
      stock: 120,
      minOrderQty: 6,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/shampoo.jpg'],
    },
    {
      nameEn: 'Toothpaste 100ml',
      nameAr: 'معجون أسنان 100 مل',
      descriptionEn: 'Fluoride toothpaste',
      descriptionAr: 'معجون أسنان بالفلورايد',
      sku: 'PER-TPST-100',
      barcode: '5000112637932',
      categoryId: createdCategories[4].id,
      price: 3500,
      comparisonPrice: 4500,
      cost: 2500,
      stock: 250,
      minOrderQty: 12,
      unitType: 'piece',
      zones: [Zone.KARKH, Zone.RUSAFA],
      images: ['https://example.com/toothpaste.jpg'],
    },
  ];

  const createdProducts = [];

  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    });
    createdProducts.push(created);
  }

  console.log(`✅ Created ${createdProducts.length} products`);

  return {
    categories: createdCategories,
    products: createdProducts,
  };
}

async function main() {
  try {
    await seedProductsAndCategories();
    console.log('✅ Product seeding completed');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { seedProductsAndCategories };