# Barbarians Portfolio

Profesyonel portföy yönetim uygulaması. TEFAS fonları, ABD hisseleri, kripto ve nakit pozisyonlarını tek bir yerden takip edin.

## Özellikler

- 🔐 Google OAuth ile güvenli giriş
- 📊 Gerçek zamanlı fiyat takibi (15 dk cache)
- 💰 TRY bazlı toplam değer hesaplama
- 📈 Kar/Zarar analizi
- 🎨 Koyu tema, profesyonel tasarım
- 📱 Mobil uyumlu

## Desteklenen Varlık Türleri

- **TEFAS Fonları**: TI2, TMG, IPB ve diğerleri
- **ABD Hisseleri**: Yahoo Finance API üzerinden
- **Kripto**: BTC, ETH (CoinGecko API)
- **Nakit**: USD pozisyonları

## Kurulum

### 1. Repository'yi Klonla

```bash
git clone https://github.com/yourusername/barbarians-portfolio.git
cd barbarians-portfolio
```

### 2. Bağımlılıkları Yükle

```bash
npm install
```

### 3. Environment Variables

`.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Supabase Kurulumu

1. [supabase.com](https://supabase.com) üzerinden proje oluştur
2. Authentication > Providers > Google'ı aktive et
3. Google Cloud Console'da OAuth credentials oluştur
4. Redirect URL'i Supabase'e ekle: `https://your-project.supabase.co/auth/v1/callback`

### 5. Development Server

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## Vercel'e Deploy

1. GitHub'a push et
2. Vercel'de "Import Project" yap
3. Environment variables ekle
4. Deploy!

## API Endpoints

### GET /api/prices

Önbelleklenmiş fiyatları döner. Cache 15 dakika geçerli.

### POST /api/prices

Cache'i zorla yeniler.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth (Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## Lisans

MIT © Barbarians Trading
