<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'view all data',
            'manage catalog',
            'manage inventory',
            'manage orders',
            'manage coupons',
            'purchase products',
            'write reviews',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create Roles and Assign Permissions

        // 1. Admin Role (Full Access)
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());

        // 2. Owner Role (Read Only All Data)
        $ownerRole = Role::firstOrCreate(['name' => 'owner']);
        $ownerRole->syncPermissions([
            'view all data',
        ]);

        // 3. Customer Role (Buying and Critiquing)
        $customerRole = Role::firstOrCreate(['name' => 'customer']);
        $customerRole->syncPermissions([
            'purchase products',
            'write reviews',
        ]);
    }
}
