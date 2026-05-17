<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'category_id' => Category::inRandomOrder()->first()?->id ?? Category::factory(),
            'name' => $name,
            'sku' => 'PROD-' . fake()->unique()->numerify('#####'),
            'slug' => Str::slug($name) . '-' . Str::random(5),
            'description' => fake()->paragraph(),
            'cover' => fake()->randomElement([
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop', // sneaker red
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop', // watch
                'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=400&auto=format&fit=crop', // sunglasses
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop', // headphone
                'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=400&auto=format&fit=crop', // shoes blue
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop', // polaroid camera
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=400&auto=format&fit=crop', // mic
                'https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=400&auto=format&fit=crop', // plant pots
                'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=400&auto=format&fit=crop', // chair
                'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&auto=format&fit=crop', // premium perfume
            ]),
            'price' => fake()->randomFloat(2, 10000, 1000000),
            'stock' => fake()->numberBetween(5, 50),
            'metadata' => [
                'brand' => fake()->randomElement(['Nike', 'Adidas', 'Puma']),
                'category' => 'shoes',
                'color' => fake()->safeColorName(),
                'size' => fake()->randomElement(['S', 'M', 'L', 'XL']),
            ],
            'is_active' => true,
        ];
    }
}
