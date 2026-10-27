# 🖧 Lab Virtual Perakitan Kabel UTP — Informatika SMA

Media Pembelajaran Interaktif & Laboratorium Virtual untuk materi **Jaringan Komputer dan Internet (JKI)** tingkat SMA (Fase E / F) yang berfokus pada terminasi konektor **RJ-45 (8P8C)** standar **EIA/TIA-568A & T568B**, perakitan kabel **Straight-Through & Crossover**, serta diagnostik **LAN Cable Tester**.

## 👨‍🏫 Pengembang
* **Nama:** Andi Wahidin Burhanuddin
* **Mata Pelajaran:** Informatika
* **Instansi:** UPT SMA Negeri 12 Wajo, Sulawesi Selatan

## ✨ Fitur Utama
1. **Splash Screen Interaktif:** Simulasi langsung aliran sinyal Pin 1–8 pada standar T568B, T568A, dan Crossover.
2. **Materi & Standar Warna:** Visualisasi kontras tinggi 8 inti kawat UTP (belang & polos) dan tabel perbandingan T568A vs T568B.
3. **Meja Kerja Simulasi RJ-45 & LAN Tester:** Pengupasan jaket kabel, penyusunan pin Ujung A & B, fitur Tukar Pin, Tang Crimping dengan efek suara mekanis, dan LAN Tester Master-Remote.
4. **LKPD Digital + Ekspor PDF:** Lembar Kerja Peserta Didik 10 soal dilengkapi pemeriksaan otomatis dan fitur unduh langsung ke format **PDF** (`jsPDF`).

## 📁 Struktur Berkas
* `index.html` — Kerangka utama antarmuka pengguna dan grafik SVG.
* `style.css` — Aturan tata letak responsif, tema warna, dan animasi CSS.
* `script.js` — Logika simulasi, sintesis suara Web Audio API, sistem *debugging*, dan konversi PDF.