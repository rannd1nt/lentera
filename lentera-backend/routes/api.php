<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// IMPORT SEMUA CONTROLLER DI SINI
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- RUTE PUBLIK (MAHASISWA & SISTEM) ---
Route::post('/login', [AuthController::class, 'login']);
Route::get('/gateway/validate', [GatewayController::class, 'validateToken']); 

Route::post('/borrow', [TransactionController::class, 'borrow']);
Route::post('/return', [TransactionController::class, 'returnAsset']);
Route::get('/assets/scan/{code}', [AssetController::class, 'scanByCode']); 
Route::get('/assets/form-options', [AssetController::class, 'getFormOptions']); 

// --- RUTE TERPROTEKSI (HANYA ADMIN LOGIN) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Generate UUID TOKEN URL buat QRCode
    Route::get('/gateway/generate', [GatewayController::class, 'generateToken']);

    // Fitur Sudo & Pengaturan Admin
    Route::post('/admin/sudo', [AdminController::class, 'verifySudo']);
    Route::put('/admin/settings', [AdminController::class, 'updateSettings']);
    Route::put('/assets/{id}/status', [AssetController::class, 'updateStatus']);
    
    // CRUD Master Data
    Route::apiResource('assets', AssetController::class)->except(['show']); 
    Route::apiResource('categories', CategoryController::class);
});