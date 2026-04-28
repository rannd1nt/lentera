<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AssetController extends Controller
{
    // API untuk Scan QR KTP Alat (Hanya nampilin info singkat)
    public function scanByCode($code)
    {
        // Handle input nakal yang pakai spasi (misal "INV - 01" jadi "INV-01")
        $cleanCode = str_replace(' ', '', strtoupper(trim($code)));

        // Cari aset berdasarkan kode
        $asset = Asset::where('code', $cleanCode)->first();

        // Kalau alat nggak ketemu di database
        if (!$asset) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alat tidak ditemukan di sistem Lentera.'
            ], 404);
        }

        // Siapkan respon dasar (Nama alat, kode, status)
        $responseData = [
            'name' => $asset->name,
            'code' => $asset->code,
            'status' => $asset->status,
            'category' => $asset->category->name ?? 'Tanpa Kategori'
        ];

        // JIKA alat sedang dipinjam, kita tambahkan info peminjam (versi Lite)
        if ($asset->status === 'borrowed') {
            // Cari transaksi terakhir yang belum kembali
            $transaction = \App\Models\Transaction::where('asset_id', $asset->id)
                ->whereNull('returned_at')
                ->latest()
                ->first();

            if ($transaction) {
                $responseData['borrower'] = [
                    'name' => $transaction->student_name,
                    'class' => $transaction->student_class,
                    'subject' => $transaction->subject,
                    'borrowed_at' => $transaction->borrowed_at
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $responseData
        ]);
    }

    public function getFormOptions(Request $request)
    {
        $token = $request->query('submission_token');
        if (!$token || !Cache::has('submission_session_' . $token)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Sesi tidak valid.'
            ], 403);
        }

        $statusRequested = $request->query('status', 'available');

        $assets = Asset::where('status', $statusRequested)
            ->select('id', 'category_id', 'name', 'code')
            ->with('category:id,name') 
            ->get();

        $formattedAssets = $assets->map(function ($asset) {
            return [
                'value' => $asset->code,
                'label' => $asset->code . ' - ' . $asset->name, 
                'category' => $asset->category->name
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formattedAssets
        ]);
    }

    // Fungsi bantuan untuk ngecek Sudo
    private function checkSudo($request) {
        $token = $request->header('X-Sudo-Token');
        return $token && Cache::get('sudo_' . $request->user()->id) === $token;
    }

    // API khusus untuk ngubah status (Available <-> Maintenance)
    public function updateStatus(Request $request, $id)
    {
        // Tetap wajib pakai Sudo biar aman
        if (!$this->checkSudo($request)) return response()->json(['message' => 'Sudo required'], 403);

        $asset = Asset::findOrFail($id);

        if ($asset->status === 'borrowed') {
            return response()->json([
                'status' => 'error', 
                'message' => 'Alat sedang dipinjam, tidak bisa diubah ke maintenance.'
            ], 422);
        }

        $request->validate([
            'status' => 'required|in:available,maintenance' // Hanya boleh dua ini
        ]);

        $asset->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success', 
            'message' => 'Status alat berhasil diubah menjadi ' . $request->status
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->checkSudo($request)) return response()->json(['message' => 'Sudo required'], 403);

        $asset = Asset::findOrFail($id);

        // CEK INTEGRITAS: Barang ini lagi dipinjam gak?
        if ($asset->status === 'borrowed') {
            return response()->json(['status' => 'error', 'message' => 'Gagal edit! Barang ini sedang dipakai oleh mahasiswa.'], 422);
        }

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string',
            'code' => 'required|string|unique:assets,code,'.$id
        ]);

        $asset->update($request->only(['category_id', 'name', 'code']));

        return response()->json(['status' => 'success', 'message' => 'Data alat berhasil diupdate.']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->checkSudo($request)) return response()->json(['message' => 'Sudo required'], 403);

        $asset = Asset::findOrFail($id);

        // CEK INTEGRITAS
        if ($asset->status === 'borrowed') {
            return response()->json(['status' => 'error', 'message' => 'Gagal hapus! Alat tidak bisa dihapus karena belum dikembalikan.'], 422);
        }

        $asset->delete();
        return response()->json(['status' => 'success', 'message' => 'Alat berhasil dihapus dari sistem.']);
    }

    // GET /api/assets (Menampilkan semua data alat)
    public function index()
    {
        $assets = Asset::with(['category:id,name', 'lastTransaction' => function($query) {
            $query->whereNull('transactions.returned_at');
        }])->get();

        return response()->json([
            'status' => 'success',
            'data' => $assets
        ]);
    }

    // POST /api/assets (Menambah alat baru, GAK PERLU SUDO)
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id', // Harus kategori yang udah ada
            'name'        => 'required|string',
            'code'        => 'required|string|unique:assets,code'
        ]);

        $asset = Asset::create($request->only(['category_id', 'name', 'code']));

        // Load ulang nama kategorinya buat dikasih liat ke response
        $asset->load('category:id,name');

        return response()->json([
            'status' => 'success',
            'message' => 'Alat baru berhasil ditambahkan.',
            'data' => $asset
        ], 201);
    }
}