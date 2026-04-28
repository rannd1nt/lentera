<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    // Fungsi bantuan untuk ngecek Sudo Token
    private function checkSudo($request) {
        $token = $request->header('X-Sudo-Token');
        return $token && Cache::get('sudo_' . $request->user()->id) === $token;
    }

    public function update(Request $request, $id)
    {
        if (!$this->checkSudo($request)) return response()->json(['message' => 'Sudo required'], 403);

        $category = Category::findOrFail($id);

        // CEK INTEGRITAS: Ada alat yang lagi dipinjam gak di kategori ini?
        if ($category->assets()->where('status', 'borrowed')->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Gagal edit! Ada alat di kategori ini yang sedang dipinjam.'], 422);
        }

        $request->validate(['name' => 'required|string|unique:categories,name,'.$id]);
        $category->update(['name' => $request->name]);

        return response()->json(['status' => 'success', 'message' => 'Kategori berhasil diedit.']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->checkSudo($request)) return response()->json(['message' => 'Sudo required'], 403);

        $category = Category::findOrFail($id);

        // CEK INTEGRITAS: Ada alat yang lagi dipinjam gak di kategori ini?
        if ($category->assets()->where('status', 'borrowed')->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Gagal hapus! Ada alat di kategori ini yang sedang dipinjam.'], 422);
        }

        $category->delete(); // Karena di migration kita pakai onDelete('cascade'), alatnya ikut terhapus. Aman!
        return response()->json(['status' => 'success', 'message' => 'Kategori dan alat di dalamnya berhasil dihapus.']);
    }
    
    // Ambil semua kategori
    public function index()
    {
        // Kita sertakan sekalian jumlah asetnya biar Frontend gampang bikin insight
        $categories = Category::withCount('assets')->get();
        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    // Ambil detail satu kategori beserta daftar alatnya
    public function show($id)
    {
        $category = Category::with('assets')->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $category
        ]);
    }

    // Tambah Kategori Baru (Gak perlu Sudo)
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:categories,name'
        ]);

        $category = Category::create([
            'name' => $request->name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kategori baru berhasil ditambahkan.',
            'data' => $category
        ], 201);
    }
}