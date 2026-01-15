import { PrismaClient } from "@prisma/client";

const seedDepartmentsAndCategories = async (prisma: PrismaClient) => {
    const departmentsData = [
        {
            name: "Electronics & Gadgets",
            slug: "electronics-gadgets",
            categories: [
                "Mobile Phones & Tablets",
                "Laptops & Computers",
                "Cameras & Photography",
                "Audio & Headphones",
                "Video Games & Consoles",
                "Wearable Technology",
                "Computer Accessories"
            ]
        },
        {
            name: "Fashion & Apparel",
            slug: "fashion-apparel",
            categories: [
                "Men's Clothing",
                "Women's Clothing",
                "Kids' Fashion",
                "Shoes & Footwear",
                "Watches",
                "Jewelry",
                "Handbags & Wallets",
                "Eyewear"
            ]
        },
        {
            name: "Home & Garden",
            slug: "home-garden",
            categories: [
                "Furniture",
                "Kitchen & Dining",
                "Bedding & Bath",
                "Home Decor",
                "Lighting",
                "Storage & Organization",
                "Garden & Outdoor",
                "Tools & Home Improvement"
            ]
        },
        {
            name: "Beauty & Personal Care",
            slug: "beauty-personal-care",
            categories: [
                "Makeup",
                "Skincare",
                "Hair Care",
                "Fragrances",
                "Personal Care Appliances",
                "Men's Grooming"
            ]
        },
        {
            name: "Sports & Outdoors",
            slug: "sports-outdoors",
            categories: [
                "Exercise & Fitness",
                "Cycling",
                "Camping & Hiking",
                "Team Sports",
                "Water Sports",
                "Sportswear"
            ]
        },
        {
            name: "Toys & Hobbies",
            slug: "toys-hobbies",
            categories: [
                "Action Figures",
                "Dolls & Accessories",
                "Board Games & Puzzles",
                "Arts & Crafts",
                "Musical Instruments"
            ]
        },
        {
            name: "Automotive",
            slug: "automotive",
            categories: [
                "Car Electronics",
                "Car Care & Cleaning",
                "Oils & Fluids",
                "Replacement Parts",
                "Tires & Wheels"
            ]
        }
    ];

    // Create departments with their categories
    for (const dept of departmentsData) {
        // Create or update the department
        const department = await prisma.department.upsert({
            where: { slug: dept.slug },
            update: {
                name: dept.name,
                updatedAt: new Date()
            },
            create: {
                name: dept.name,
                slug: dept.slug,
                updatedAt: new Date()
            }
        });

        // Create categories for this department
        for (const categoryName of dept.categories) {
            await prisma.category.upsert({
                where: { name: categoryName },
                update: {
                    departmentId: department.id,
                    updatedAt: new Date()
                },
                create: {
                    name: categoryName,
                    departmentId: department.id,
                    updatedAt: new Date()
                }
            });
        }

        console.log(`✅ Seeded department: ${dept.name} with ${dept.categories.length} categories`);
    }

    console.log(`\n🎉 Successfully seeded ${departmentsData.length} departments with their categories!`);
};

export default seedDepartmentsAndCategories;