# TR Dizin MCP Server 🎓

TÜBİTAK **TR Dizin** akademik veritabanına Model Context Protocol (MCP) üzerinden entegre erişim sağlayan sunucu aracı.

- 🇹🇷 Resmî TR Dizin API altyapısını kullanır
- 🔑 API Key gerektirmez (Halka açık uçlar kullanılır)
- 🤖 Claude Desktop, Cursor ve tüm MCP uyumlu istemcilerle tam uyumlu çalışır

---

## 🌟 Özellikler

- **Geniş Çaplı Arama:** Yayınlar, dergiler, yazarlar ve kurumlar arasında hızlı sorgulama.
- **Doğrudan Erişim:** DOI, ORCID veya ISSN üzerinden nokta atışı akademik kayıt çekimi.
- **Trend Analizi:** Yıllara veya kategorilere göre güncel trend konuları listeleme özelliği.
- **Akademik Karşılaştırma:** İki farklı yazarın verilerini veya performanslarını karşılaştırma yeteneği.
- **Modern Yanıt Uyumluluğu:** TR Dizin’in en güncel `hits.hits` JSON formatıyla tam uyumlu çalışan güçlü bir veri çözümleyici (parser).

---

## 🚀 Kurulum

Projeyi yerel ortamınıza klonladıktan sonra gerekli paketleri yükleyin ve derleyin:

```bash
npm install
npm run build
```

Geliştirme modunda (watch) çalıştırmak için:

```bash
npm run dev
```

Doğrudan çalıştırmak için:

```bash
npm start
# veya
node dist/index.js
```

---

## 🔌 Claude Desktop Entegrasyonu

Masaüstü Claude uygulamanıza bu sunucuyu tanıtmak için `claude_desktop_config.json` dosyasını düzenleyin ve aşağıdaki nesneyi ekleyin:

```json
{
  "mcpServers": {
    "trdizin": {
      "command": "node",
      "args": ["/TAM/YOL/trdizin-mcp/dist/index.js"]
    }
  }
}
```

**Yapılandırma Dosyası Konumları:**
- 🍏 **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- 🪟 **Windows:** `%APPDATA%\\Claude\\claude_desktop_config.json`

---

## 🛠️ Tool (Araç) Listesi

1. `search_publications` — Yayın/makale arama
2. `search_journals` — Dergi arama
3. `search_authors` — Akademik yazar arama
4. `search_institutions` — Kurum arama
5. `get_publication_by_doi` — DOI numarası ile doğrudan yayın verisi çekme
6. `get_author_by_orcid` — ORCID ID ile yazar eşleştirme ve getirme
7. `get_journal_by_issn` — ISSN/e-ISSN numarası ile dergi detayı çekme
8. `get_trending_topics` — Yıla ve kategoriye göre trend konu analizi
9. `compare_authors` — İki farklı yazarın profilini ve yayın geçmişini karşılaştırma

---

## 💬 Örnek Promptlar (AI İçin)

Claude veya Başka bir modelinize verebileceğiniz bazı doğal dil örnekleri:

- *"TR Dizin’de yapay zeka konusunda son 5 yılın yayınlarını getir."*
- *"ORCID numarası `0000-0002-1825-0097` olan yazarın geçmişini ve makalelerini bul."*
- *"ISSN numarası `1300-0632` olan derginin etki faktörünü ve genel bilgisini getir."*
- *"2024 yılı SCIENCE (Fen Bilimleri) veritabanında yükselen trend konuları çıkar."*
- *"Ali Yıldız ve Sunay Çelik’i akademik olarak karşılaştır."*

---

## ✅ Test ve Doğrulama (Smoke Check)

Uygulamanın düzgün çalışıp çalışmadığını doğrudan MCP JSON-RPC üzerinden test edebilirsiniz:

```bash
npm run build
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}\\n' | node dist/index.js
```

**Beklenen Çıktı:** Geçerli bir JSON-RPC `initialize` cevabı.

---

## 📡 Veri Kaynağı & API Bilgisi

Bu proje, açık kaynak kültürü dahilinde TR Dizin'in herkese açık (public) genel arama uçlarını kullanır.

**Kuvvetle Kullanılan Ana Endpointler:**
- `https://search.trdizin.gov.tr/api/defaultSearch/publication/`
- `https://search.trdizin.gov.tr/api/defaultSearch/journal/`
- `https://search.trdizin.gov.tr/api/defaultSearch/author/`
- `https://search.trdizin.gov.tr/api/defaultSearch/institution/`
- `https://search.trdizin.gov.tr/api/public/yayin/doi/`
- `https://search.trdizin.gov.tr/api/public/yazar/orcid/`
- `https://search.trdizin.gov.tr/api/public/dergi/issn/`

> **Not:** Bu projede resmi TR Dizin kurumu tarafından yayınlanmış ve doğrulanmamış bir özel "geliştirici dokümantasyonu" bağlantısı kasten kullanılmamıştır.

---

## 📌 Önemli Notlar

- **Yanıt Formatları:** Arama sonuçları TR Dizin altyapısında dahi nadiren değişebilir; bu sunucudaki `parser` sistemi doğrudan TR'nin güncel JSON yapısındaki `hits.hits` mantığını temel alarak ayakta kalır.
- **Boş Sorgular:** Boş bir arama listesiyle karşılaştığınızda (özellikle teknik konuları araştırırken), modelinizden öncelikle **sorguyu genişletmesini** isteyin. (Örneğin; doğrudan `adamw` aratmak yerine, Türkçe `yapay zeka algoritmaları optimizasyon` aranması tavsiye edilir.)

---

## 📄 Lisans

Özgür Kullanım **MIT Lisansı**
(Tüm kaynak kodunu inceleyebilir veya kendi projelerinizde kullanabilirsiniz.)