<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('settings')->insert([
            ['key' => 'qr_interval', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'form_interval', 'value' => '15', 'created_at' => now(), 'updated_at' => now()], // Interval untuk form peminjaman
        ]);
    }
}