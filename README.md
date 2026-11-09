# TryMail - Disposable Temporary Email Web Client

> **Projek Besar Mata Kuliah Pola Desain Perangkat Lunak (Design Patterns)**  
> **Program Studi D4 Teknik Informatika — Politeknik Elektronika Negeri Surabaya (PENS)**  
> Semester 7 / Gasal 2026

TryMail adalah aplikasi web *disposable temporary email* (email sekali pakai) modern berbasis **React.js + TypeScript** yang dirancang dengan implementasi murni 3 (tiga) pola desain standar **Gang of Four (GoF)**: **Adapter Pattern**, **Facade Pattern**, dan **Observer Pattern**.

---

## Arsitektur Pola Desain (Gang of Four)

TryMail memisahkan logika bisnis pola desain (*pure TypeScript classes*) di dalam `src/services/` sehingga **100% independen dari framework UI/React DOM**, mudah diuji secara modular, dan memenuhi standar akademik *Separation of Concerns*.

```mermaid
flowchart TD
    subgraph UI["React Presentation Layer (Hooks & Components)"]
        App["App.tsx"]
        useTempMail["useTempMail Hook"]
        useObserver["useMailObserver Hook"]
        Header["MailboxHeader & ActionToolbar"]
        Inbox["InboxList & EmailCard"]
        Modal["EmailDetailModal"]
    end

    subgraph FacadeLayer["Facade Pattern Layer"]
        Facade["TempMailFacade (Central Orchestrator)"]
    end

    subgraph AdapterLayer["Adapter Pattern Layer"]
        Target["<<interface>>\nITempMailProvider"]
        MockAdp["MockMailAdapter\n(Offline Simulation)"]
        MailTmAdp["MailTmAdapter\n(Mail.tm REST API)"]
        OneSecAdp["OneSecMailAdapter\n(1secmail API)"]
    end

    subgraph ObserverLayer["Observer Pattern Layer"]
        Subject["MailEventManager\n(Event Publisher)"]
        AudioList["AudioAlertListener\n(Web Audio Synth)"]
        BadgeList["TabTitleBadgeListener\n(Document Title Badge)"]
        ToastList["ToastNotificationListener\n(UI Toast Stack)"]
    end

    App --> useTempMail
    App --> useObserver
    useTempMail --> Facade
    useObserver --> Subject

    Facade --> Target
    Facade --> Subject
    Facade -->|"Session Cache"| Storage["sessionStorage"]

    Target <|.. MockAdp
    Target <|.. MailTmAdp
    Target <|.. OneSecAdp

    Subject -->|"EMAIL_RECEIVED"| AudioList
    Subject -->|"EMAIL_RECEIVED"| BadgeList
    Subject -->|"EMAIL_RECEIVED"| ToastList
```

---

### 1. Adapter Pattern (Structural Pattern)
* **Tujuan**: Menyeragamkan antarmuka berbagai penyedia email sementara publik (Mail.tm, 1secmail) dan simulasi luring (*offline mock*) yang memiliki format data dan skema API heterogen ke dalam satu kontrak standar.
* **Target Interface**: `ITempMailProvider` ([`src/services/adapter/ITempMailProvider.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/services/adapter/ITempMailProvider.ts))
* **Concrete Adapters**:
  1. `MockMailAdapter`: Mesin simulasi email offline deterministik untuk presentasi dan pengujian tanpa internet.
  2. `MailTmAdapter`: Mengadaptasi REST API Mail.tm (skema Hydra JSON dengan autentikasi JWT token).
  3. `OneSecMailAdapter`: Mengadaptasi API query-string 1secmail dengan konversi otomatis nama lampiran dan endpoint download.
* **Manfaat**: Sistem dapat berganti provider (*hot-swappable*) saat runtime tanpa mengubah kode komponen antarmuka pengguna.

---

### 2. Facade Pattern (Structural Pattern)
* **Tujuan**: Menyederhanakan kompleksitas orkestrasi alur kerja email sementara (kueri domain $\rightarrow$ pembuatan akun $\rightarrow$ login & token retrieval $\rightarrow$ sinkronisasi berkala $\rightarrow$ diffing email baru $\rightarrow$ sanitasi HTML $\rightarrow$ persistensi sesi).
* **Facade Class**: `TempMailFacade` ([`src/services/facade/TempMailFacade.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/services/facade/TempMailFacade.ts))
* **Metode Utama**:
  * `createNewMailbox(providerId?)`: Menginisialisasi mailbox baru pada adapter yang dipilih dan menyimpannya ke `sessionStorage`.
  * `syncInbox()`: Mengambil daftar pesan, mendeteksi pesan baru, memicu notifikasi Observer, dan memperbarui cache.
  * `openEmail(messageId)`: Mengambil isi lengkap email, menjalankan pembersihan keamanan DOMPurify, dan menandai status `isRead: true`.
  * `disposeCurrentMailbox()`: Menghapus sesi lokal dan membersihkan akun pada server penyedia.
  * `switchProvider(targetProviderId)`: Berpindah adapter saat runtime.

---

### 3. Observer Pattern (Behavioral Pattern)
* **Tujuan**: Memungkinkan beberapa modul yang independen bereaksi secara otomatis terhadap event email baru (`EMAIL_RECEIVED`) tanpa *tight coupling* dengan loop sinkronisasi atau komponen UI lainnya.
* **Subject / Publisher**: `MailEventManager` ([`src/services/observer/MailEventManager.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/services/observer/MailEventManager.ts))
* **Subscriber Contract**: `IMailListener<T>` ([`src/types/observer.types.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/types/observer.types.ts))
* **Concrete Observers**:
  1. `AudioAlertListener`: Menghasilkan nada lonceng (*chime*) menggunakan Web Audio API tanpa file audio eksternal.
  2. `TabTitleBadgeListener`: Memperbarui judul tab peramban secara real-time (misal: `(1) New Email | TryMail`).
  3. `ToastNotificationListener`: Menampilkan popup notifikasi toast di sudut layar lengkap dengan subjek dan pengirim.

---

## Kepatuhan React Development Best Practices & Desain Neubrutalism

Aplikasi ini menerapkan standar pengembangan React modern serta desain visual **Neubrutalism**:
1. **Desain Neubrutalism**: Mengadopsi estetika neubrutalism modern dengan garis batas hitam tegas (`border-2 border-black`), bayangan offset keras tanpa blur (`shadow-[4px_4px_0px_0px_#000]`), latar belakang kanvas terang solid (`#fffdf7`), palet warna pastel pekat, dan efek interaktif *press-in* pada tombol.
2. **Tata Letak Bersih & Bebas Emoticon**: Seluruh antarmuka 100% bebas dari emoji dekoratif, menggunakan ikon semantik Lucide React. Tombol "Change Address" diposisikan berdampingan dengan "Copy Address" pada header, menyederhanakan toolbar bawah menjadi Refresh dan Delete.
3. **Separation of Concerns**: Logika bisnis murni diisolasi di `src/services/`, state server dikelola oleh **TanStack Query**, dan komponen UI hanya menangani presentasi.
4. **Penyimpanan Konstanta Terpusat**: Seluruh endpoint API, durasi polling, storage key, dan konfigurasi default berada di [`src/library/constants.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/library/constants.ts). *Zero magic numbers*.
5. **Dumb Components**: Komponen seperti `CopyButton`, `EmailCard`, `ActionToolbar`, dan `ProviderSelector` berorientasi *presentational* tanpa *margin* luar (layout-agnostik), menerima callback props.
6. **URL sebagai Source of Truth**: State pembukaan detail email disinkronisasikan ke query parameter URL (`?mailId=...`) dan mendukung tombol Back/Forward browser (*popstate*).
7. **Keamanan XSS Berlapis**: Seluruh konten HTML disanitasi menggunakan **DOMPurify** ([`src/utils/sanitizer.ts`](file:///D:/Kuliah%20Informatika%20PENS/Semester%207/MW-Pola%20Desain%20Perangkat%20Lunak/Projek%20Besar/trymail/src/utils/sanitizer.ts)) dengan penegakan otomatis `target="_blank" rel="noopener noreferrer"` pada semua tautan.

---

## Struktur Direktori

```text
trymail/
├── specs/                         # Spesifikasi fitur SpecKit & Constitution
│   └── 001-temp-mail-service/     # spec.md, plan.md, tasks.md, research.md
├── src/
│   ├── components/                # Presentational Dumb Components
│   │   ├── ActionToolbar.tsx      # Kontrol Refresh, Change Address, Delete
│   │   ├── CopyButton.tsx         # Tombol salin alamat interaktif
│   │   ├── EmailCard.tsx          # Item daftar email
│   │   ├── EmailDetailModal.tsx   # Modal inspeksi email tersanitasi
│   │   ├── InboxList.tsx          # Kontainer daftar pesan masuk
│   │   ├── MailboxHeader.tsx      # Header alamat dan status mailbox
│   │   ├── ProviderSelector.tsx   # Dropdown pemilihan adapter
│   │   └── ToastContainer.tsx     # Tampilan tumpukan toast Observer
│   ├── hooks/                     # Custom React Hooks
│   │   ├── useMailObserver.ts     # Integrasi Observer Pattern ke React
│   │   └── useTempMail.ts         # Integrasi Facade Pattern ke React
│   ├── library/
│   │   └── constants.ts           # Konstanta konfigurasi terpusat
│   ├── services/                  # Implementasi Murni Pola Desain (GoF)
│   │   ├── adapter/               # [ADAPTER PATTERN]
│   │   │   ├── ITempMailProvider.ts
│   │   │   ├── MockMailAdapter.ts
│   │   │   ├── MailTmAdapter.ts
│   │   │   └── OneSecMailAdapter.ts
│   │   ├── facade/                # [FACADE PATTERN]
│   │   │   └── TempMailFacade.ts
│   │   └── observer/              # [OBSERVER PATTERN]
│   │       ├── MailEventManager.ts
│   │       └── listeners/
│   │           ├── AudioAlertListener.ts
│   │           ├── TabTitleBadgeListener.ts
│   │           └── ToastNotificationListener.ts
│   ├── types/                     # Definisi tipe domain & kontrak TypeScript
│   ├── utils/                     # Formatters & DOMPurify sanitizer
│   ├── App.tsx                    # Root Application Shell
│   └── main.tsx                   # React DOM Entrypoint & QueryClientProvider
└── tests/
    └── unit/                      # Automated Vitest Suite (16/16 Pass)
        ├── sanitizer.test.ts      # Pengujian keamanan sanitasi XSS
        └── services.test.ts       # Pengujian unit Adapter, Facade, Observer
```

---

## Panduan Menjalankan Proyek

### 1. Prasyarat
- **Node.js**: $\ge 18.0.0$
- **npm**: $\ge 9.x$

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Pengembangan Lokal
```bash
npm run dev
```
Buka peramban pada `http://localhost:5173`.

### 4. Menjalankan Pengujian Otomatis (Unit & Contract Tests)
```bash
npm test
```
*Hasil: 16 dari 16 unit tests lolos (100% Pass) memvalidasi Adapter, Facade, Observer, dan XSS defense.*

### 5. Pemeriksaan Tipe Data TypeScript
```bash
npm run typecheck
```
*Hasil: Zero error TypeScript dalam mode `tsc --noEmit` yang ketat.*

### 6. Build Produksi
```bash
npm run build
```
Menghasilkan aset teroptimasi (*minified & gzipped*) di folder `dist/`.

---

## Pengembang & Informasi Akademik
* **Mata Kuliah**: Pola Desain Perangkat Lunak
* **Institusi**: Politeknik Elektronika Negeri Surabaya (PENS)
* **Tahun Akademik**: 2026

