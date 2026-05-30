# Panduan Pengguna — Dashboard Home Anywhere

Panduan ni untuk **pemilik homestay** yang nak urus tempahan guna dashboard.
Tak perlu tahu apa-apa pasal coding — semua boleh buat dengan klik je. 🙂

> Kalau anda yang nak _pasang_ sistem ni (bukan guna sahaja), tengok
> [SETUP.md](SETUP.md) dan [DEPLOY.md](DEPLOY.md) — itu bahagian teknikal yang
> biasanya orang yang setup untuk anda akan uruskan.

---

## Cara masuk dashboard

1. Buka pelayar web (Chrome, Safari, dll).
2. Pergi ke alamat dashboard anda — contohnya `https://namatapak.com/admin`
   (orang yang setup akan beri alamat sebenar).
3. Masukkan **username** dan **password** yang diberikan.

Selepas masuk, anda akan nampak **5 tab** di bahagian atas:

| Tab               | Untuk apa                                              |
| ----------------- | ----------------------------------------------------- |
| 🏠 Homestays      | Senarai homestay anda — tambah, ubah, buang           |
| 📅 Blocked dates  | Tutup tarikh supaya tetamu tak boleh tempah           |
| 📋 Bookings       | Lihat & batalkan tempahan tetamu                      |
| 🎨 Site content   | Ubah ayat & gambar di laman utama                     |
| 🧾 Pricing        | Tetapan cukai (SST), caj hujung minggu, deposit       |

Di bahagian atas sekali ada **4 kotak ringkasan**: bilangan homestay, tarikh
ditutup, jumlah tempahan, dan tempahan yang disahkan.

---

## 🏠 Tab "Homestays" — urus homestay anda

Ini tempat anda senaraikan homestay untuk tetamu tempah.

### Tambah homestay baru

Di kotak sebelah kiri ("Add new homestay"), isi:

- **Name** — nama homestay (contoh: _Villa Langkawi Tepi Laut_)
- **Description** — penerangan ringkas (1–2 ayat). Boleh kosongkan.
- **Minimum nights** — bilangan malam paling minimum tetamu kena tempah
  (contoh: `2` bermaksud tetamu kena tempah sekurang-kurangnya 2 malam)
- **Price per night** — harga semalam dalam Ringgit (contoh: `400.00`)
- **Deposit %** — berapa peratus deposit perlu dibayar dahulu (lalai: 30%).
  Baki dibayar masa daftar masuk.

Klik **"Add homestay"**. Siap! Homestay akan muncul dalam senarai di sebelah
kanan.

### Tambah gambar homestay

Gambar buat tetamu lebih tertarik. Caranya:

1. **Simpan homestay dahulu** (langkah di atas).
2. Dalam senarai sebelah kanan, klik butang **pensel (✏️)** pada homestay tu.
3. Bahagian **"Photos"** akan muncul — muat naik gambar di situ.
4. Anda boleh tetapkan satu gambar sebagai **gambar utama** (yang tetamu nampak
   dulu).

### Ubah atau buang homestay

Dalam senarai sebelah kanan:

- **Pensel (✏️)** — ubah maklumat homestay
- **Tong sampah (🗑️)** — buang homestay

> ⚠️ Buang homestay akan **padam terus** homestay tu dan tarikh-tarikh
> berkaitan. Tempahan sedia ada mungkin terjejas. Buat dengan berhati-hati.

---

## 📅 Tab "Blocked dates" — tutup tarikh

Guna ni bila anda **tak nak terima tempahan** untuk tarikh tertentu — contoh:
homestay sedang dibaiki, anda guna sendiri, atau dah ditempah melalui platform
lain.

### Cara tutup tarikh

Di kotak sebelah kiri:

1. **Homestay** — pilih homestay mana
2. **Block from** — tarikh & masa mula tutup
3. **Block until** — tarikh & masa tamat tutup
4. Klik **"Block dates"**

Tetamu tak akan boleh tempah tarikh yang bertindih dengan julat ni.

### Senarai tarikh ditutup

Sebelah kanan menunjukkan semua julat tarikh. Ada dua jenis:

- **Admin blocked** (kelabu) — yang anda tutup sendiri
- **Guest booking** (hijau) — tarikh yang dah ditempah oleh tetamu

Klik **tong sampah (🗑️)** untuk buka semula tarikh yang anda tutup.

> ⚠️ Untuk **batalkan tempahan tetamu**, JANGAN buang dari sini — guna tab
> **Bookings** supaya tetamu dapat refund & emel pembatalan dengan betul.

---

## 📋 Tab "Bookings" — urus tempahan tetamu

Di sini anda nampak **semua tempahan** — nama tetamu, emel, homestay, tarikh,
dan status.

### Status tempahan

| Status        | Maksud                                        |
| ------------- | --------------------------------------------- |
| 🟡 Pending    | Tetamu belum selesai bayar deposit            |
| 🟢 Confirmed  | Deposit dah dibayar — tempahan disahkan       |
| 🔴 Cancelled  | Tempahan dibatalkan                           |

### Batalkan tempahan

Klik butang **"Cancel"** di sebelah tempahan. Bila dibatalkan, sistem akan:

- Tandakan tempahan sebagai dibatalkan
- Buang acara dari kalendar (jika Google Calendar disambung)
- Proses **refund** automatik (jika bayaran telah dibuat melalui Stripe)

---

## 🎨 Tab "Site content" — ubah laman utama

Tab ni biarkan anda ubah **ayat dan gambar di laman utama** tanpa perlu
panggil sesiapa. Contoh yang boleh diubah:

- **Hero** — tajuk besar & ayat di bahagian atas laman
- **Trust stats** — angka-angka (contoh: "500+ homestay", "4.9★ rating")
- **Testimonials** — ulasan tetamu
- **CTA banner** — kotak ajakan tempah di bawah laman

Ubah ayat yang anda mahu, kemudian **simpan**. Perubahan akan terus kelihatan
di laman utama awam.

---

## 🧾 Tab "Pricing" — tetapan harga & cukai

Tab ni untuk tetapan harga yang dikenakan **kepada semua homestay**:

- **SST** — cukai perkhidmatan (contoh: 6%). Boleh hidup/matikan.
- **Weekend surcharge** — caj tambahan hujung minggu (contoh: +20% pada
  Sabtu/Ahad)
- **Cleaning fee** — yuran pembersihan tetap setiap tempahan
- **Default deposit %** — peratus deposit lalai (jika homestay tak set sendiri)

Hidupkan yang anda mahu, masukkan nilai, kemudian **simpan**. Harga yang tetamu
nampak masa tempah akan ikut tetapan ni secara automatik.

---

## Soalan lazim

**S: Saya tersilap buang homestay. Boleh undo?**
Tak boleh — buang adalah kekal. Anda kena tambah semula. Sebab tu sistem
sentiasa minta pengesahan dahulu.

**S: Kenapa tetamu tak boleh tempah tarikh tertentu?**
Mungkin tarikh tu dah ditempah orang lain, atau anda ada tutup di tab
**Blocked dates**.

**S: Deposit tak ditolak dari kad tetamu?**
Kalau sistem dalam **mod demo** (belum sambung Stripe), tempahan akan terus
disahkan tanpa caj sebenar. Untuk terima bayaran betul, orang yang setup perlu
sambungkan Stripe — lihat [DEPLOY.md](DEPLOY.md).

**S: Saya lupa password dashboard.**
Hubungi orang yang setup sistem untuk anda — mereka boleh tetapkan semula.

---

Ada masalah lain? Hubungi orang yang uruskan pemasangan sistem anda, atau
buka isu di [GitHub](https://github.com/AmiQT/home-anywhere/issues).
