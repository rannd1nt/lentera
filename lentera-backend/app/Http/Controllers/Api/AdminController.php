<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // 1. API Sudo Mode (Verifikasi Password Admin)
    public function verifySudo(Request $request)
    {
        $request->validate(['password' => 'required']);

        // Cek password admin yang sedang login (harus pakai token Sanctum)
        if (!Hash::check($request->password, $request->user()->password)) {
            return response()->json(['status' => 'error', 'message' => 'Password salah!'], 403);
        }

        // Bikin sudo token, umur 10 menit
        $sudoToken = Str::uuid()->toString();
        Cache::put('sudo_' . $request->user()->id, $sudoToken, now()->addMinutes(10));

        return response()->json([
            'status' => 'success',
            'message' => 'Sudo mode diaktifkan selama 10 menit.',
            'sudo_token' => $sudoToken
        ]);
    }

    // 2. API Update Interval Settings (QR dan Form)
    public function updateSettings(Request $request)
    {
        $request->validate([
            'qr_interval' => 'required|numeric|min:1',
            'form_interval' => 'required|numeric|min:1',
        ]);

        // Coba kita pakai logic Sudo untuk memastikan ini aman
        $sudoToken = $request->header('X-Sudo-Token'); // Ambil token dari header
        if (!$sudoToken || Cache::get('sudo_' . $request->user()->id) !== $sudoToken) {
            return response()->json(['status' => 'error', 'message' => 'Sudo Token tidak valid atau expired. Masukkan password lagi.'], 403);
        }

        DB::table('settings')->where('key', 'qr_interval')->update(['value' => $request->qr_interval]);
        DB::table('settings')->where('key', 'form_interval')->update(['value' => $request->form_interval]);

        return response()->json(['status' => 'success', 'message' => 'Interval berhasil diperbarui!']);
    }
}