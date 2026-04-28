<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function borrow(Request $request)
    {
        $request->validate([
            'submission_token'   => 'required',
            'asset_code'         => 'required|exists:assets,code', 
            'student_name'       => 'required|string|max:255',
            'student_npm'        => 'required|string|max:20',
            'student_prodi'      => 'required|string|max:100',
            'student_class'      => 'required|string|max:50',
            'subject'            => 'required|string|max:100',
            'lecturer'           => 'required|string|max:100',
            'expected_return_at' => 'required|date_format:Y-m-d H:i:s|after:now', // BARU: Wajib diisi dan harus waktu di masa depan!
        ]);

        if (!Cache::has('submission_session_' . $request->submission_token)) {
            return response()->json(['status' => 'error', 'message' => 'Sesi pengisian form habis.'], 403);
        }

        return DB::transaction(function () use ($request) {
            
            $asset = Asset::where('code', $request->asset_code)->lockForUpdate()->first();

            if ($asset->status !== 'available') {
                return response()->json(['status' => 'error', 'message' => 'Alat ini baru saja dipinjam.'], 422);
            }

            $transaction = Transaction::create([
                'asset_id'           => $asset->id,
                'student_name'       => $request->student_name,
                'student_npm'        => $request->student_npm,
                'student_prodi'      => $request->student_prodi,
                'student_class'      => $request->student_class,
                'subject'            => $request->subject,
                'lecturer'           => $request->lecturer,
                'borrowed_at'        => \Carbon\Carbon::now()->format('Y-m-d H:i:s'), 
                'expected_return_at' => $request->expected_return_at,
            ]);

            $asset->update(['status' => 'borrowed']);
            Cache::forget('submission_session_' . $request->submission_token);

            return response()->json([
                'status' => 'success',
                'message' => 'Peminjaman berhasil dicatat.',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'asset_name' => $asset->name,
                    'target_return' => $transaction->expected_return_at
                ]
            ]);
        });
    }

    public function returnAsset(Request $request)
    {
        $request->validate([
            'submission_token' => 'required',
            'asset_code'       => 'required|exists:assets,code',
            'student_npm'      => 'required|string', // KUNCI PENGAMAN BARU!
        ]);
        
        if (!Cache::has('submission_session_' . $request->submission_token)) {
            return response()->json(['status' => 'error', 'message' => 'Sesi berakhir.'], 403);
        }

        return DB::transaction(function () use ($request) {
            $asset = Asset::where('code', $request->asset_code)->lockForUpdate()->first();

            if ($asset->status !== 'borrowed') {
                return response()->json(['status' => 'error', 'message' => 'Alat ini sudah dikembalikan atau belum dipinjam.'], 422);
            }

            // Cari data peminjaman yang sedang aktif
            $transaction = Transaction::where('asset_id', $asset->id)
                ->whereNull('returned_at')
                ->latest()
                ->first();

            // LOGIKA PENCEGAHAN CELAH (MIND-BLOWING SECURITY)
            if ($transaction && $transaction->student_npm !== $request->student_npm) {
                // Sengaja kita sensor sedikit NPM aslinya biar privasi terjaga
                $hintNpm = substr($transaction->student_npm, 0, 4) . '***'; 
                return response()->json([
                    'status' => 'error', 
                    'message' => "Gagal! Hanya peminjam asli (NPM: {$hintNpm}) yang berhak mengembalikan alat ini."
                ], 403);
            }

            if ($transaction) {
                $transaction->update([
                    'returned_at' => \Carbon\Carbon::now()->format('Y-m-d H:i:s')
                ]);
            }

            $asset->update(['status' => 'available']);
            
            Cache::forget('submission_session_' . $request->submission_token);

            return response()->json([
                'status' => 'success',
                'message' => 'Alat berhasil dikembalikan. Terima kasih!'
            ]);
        });
    }
}