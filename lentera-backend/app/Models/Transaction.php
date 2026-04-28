<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'asset_id', 'student_name', 'student_npm', 'student_prodi', 'student_class', 
        'subject', 'lecturer', 'borrowed_at', 'expected_return_at', 'returned_at'
    ];

    public function asset() {
        return $this->belongsTo(Asset::class);
    }
}