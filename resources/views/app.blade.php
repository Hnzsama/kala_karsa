<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Global SEO Metadata --}}
        <meta name="description" content="Kala Karsa Bakery menyajikan aneka roti manis, croissant renyah, cake ulang tahun cantik, dan kue kering premium tradisional khas Indonesia. Dipanggang segar setiap hari menggunakan bahan-bahan organik berkualitas tinggi.">
        <meta name="keywords" content="toko roti, toko kue, cake premium, bakery jakarta, croissant, kue ulang tahun, Kala Karsa Bakery, roti sehat, roti manis, kue basah, jajanan pasar">
        <meta name="author" content="Kala Karsa Bakery Premium Bakery">
        <meta property="og:title" content="Kala Karsa Bakery — Toko Roti & Kue Premium">
        <meta property="og:description" content="Sajian kelezatan roti manis lembut, croissant renyah, dan cake ulang tahun premium khas Kala Karsa Bakery. Dipanggang segar harian dengan cita rasa berkelas.">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:image" content="{{ asset('apple-touch-icon.png') }}">
        <meta property="og:image:type" content="image/png">
        <meta property="og:image:width" content="512">
        <meta property="og:image:height" content="512">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
