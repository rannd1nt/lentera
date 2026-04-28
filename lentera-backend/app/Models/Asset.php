<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    protected $fillable = ['category_id', 'name', 'code', 'status'];

    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function transactions() {
        return $this->hasMany(Transaction::class);
    }

    public function lastTransaction() {
        return $this->hasOne(Transaction::class)->latestOfMany();
    }
}
