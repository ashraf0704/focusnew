$ErrorActionPreference = 'Stop'

$rootEnv = Join-Path $PSScriptRoot '..\.env'
if (Test-Path $rootEnv) {
  Get-Content $rootEnv | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2]

      switch ($name) {
        'SUPABASE_URL' { $env:EXPO_PUBLIC_SUPABASE_URL = $value }
        'SUPABASE_ANON_KEY' { $env:EXPO_PUBLIC_SUPABASE_ANON_KEY = $value }
        'RAZORPAY_KEY_ID' { $env:EXPO_PUBLIC_RAZORPAY_KEY_ID = $value }
        'VITE_VAPID_PUBLIC_KEY' { $env:EXPO_PUBLIC_VAPID_PUBLIC_KEY = $value }
        'EXPO_PUBLIC_VAPID_PUBLIC_KEY' {
          if (-not $env:EXPO_PUBLIC_VAPID_PUBLIC_KEY) {
            $env:EXPO_PUBLIC_VAPID_PUBLIC_KEY = $value
          }
        }
      }
    }
  }
}

$env:EXPO_PUBLIC_API_URL = 'http://localhost:4000'
Set-Location (Join-Path $PSScriptRoot '..\focus-buddy-native')
npm.cmd run start -- --host localhost
