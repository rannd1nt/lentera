<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            
            $table->string('student_name');
            $table->string('student_npm');
            $table->string('student_prodi');
            $table->string('student_class'); 
            $table->string('subject');       
            $table->string('lecturer');      
            
            $table->timestamp('borrowed_at')->useCurrent();
            $table->timestamp('expected_return_at');
            $table->timestamp('returned_at')->nullable(); 
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
