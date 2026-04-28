<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GatewayController extends Controller
{
    public function generateToken()
    {
        $setting = DB::table('settings')->where('key', 'qr_interval')->first();
        $intervalMinutes = $setting ? (int) $setting->value : 1;

        $token = Str::uuid()->toString();

        Cache::put('gateway_token_' . $token, true, now()->addMinutes($intervalMinutes));

        return response()->json([
            'status' => 'success',
            'data' => [
                'qr_token' => $token,
                'interval_minutes' => $intervalMinutes,
                'expires_at' => now()->addMinutes($intervalMinutes)->format('Y-m-d H:i:s')
            ],
            'message' => 'Token generated successfully for monitor'
        ]);
    }

    public function validateToken(Request $request)
    {
        $qrToken = $request->query('token');

        if (!$qrToken || !Cache::has('gateway_token_' . $qrToken)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Barcode kadaluarsa. Silakan scan ulang di monitor ruangan.'
            ], 403);
        }

        $setting = DB::table('settings')->where('key', 'form_interval')->first();
        $formIntervalMinutes = $setting ? (int) $setting->value : 15;
        $expiresAt = now()->addMinutes($formIntervalMinutes);
        
        $submissionToken = Str::uuid()->toString();
        
        Cache::put('submission_session_' . $submissionToken, true, now()->addMinutes($formIntervalMinutes));

        return response()->json([
            'status' => 'success',
            'data' => [
                'submission_token' => $submissionToken,
                'expires_in_minutes' => $formIntervalMinutes,
                'expires_at' => $expiresAt->format('Y-m-d H:i:s')
            ],
            'message' => "Akses diterima. Sesi anda berlaku selama {$formIntervalMinutes} menit."
        ]);
    }
}