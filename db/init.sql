-- 類別表 (主題/影響)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('topic', 'impact')),
    sort_order INT DEFAULT 0
);

-- 活動表 (時程)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE,
    tag VARCHAR(50),
    icon VARCHAR(10),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    image_url TEXT
);

-- 新聞表
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    excerpt TEXT,
    content TEXT,
    icon VARCHAR(10),
    category_id INT REFERENCES categories(id),
    published_at DATE DEFAULT CURRENT_DATE,
    image_url TEXT
);

-- 月份活動表
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    date_label VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12)
);

-- 初始資料: 類別
INSERT INTO categories (name, icon, type, sort_order) VALUES
('合作', '🤝', 'topic', 1),
('人文', '📚', 'topic', 2),
('幸福', '🌟', 'topic', 3),
('社區', '🏘️', 'impact', 1),
('教育', '🎓', 'impact', 2),
('環境', '🌿', 'impact', 3);

-- 初始資料: 活動
INSERT INTO events (title, date_start, date_end, tag, icon, month, year) VALUES
('線上浴佛', '2026-08-28', '2026-09-05', '線上參與·免費', '🙏', 8, 2026),
('亞太永續博覽會', '2026-08-28', '2026-09-05', '現場參與·需購票', '🌏', 8, 2026),
('精舍過新年', '2026-08-28', '2026-09-05', '現場參與·免費', '🏮', 8, 2026),
('社區環保日', '2026-09-01', '2026-09-03', '線上參與·免費', '♻️', 9, 2026),
('青年志工營', '2026-09-10', '2026-09-15', '現場參與·需報名', '🤝', 9, 2026);

-- 初始資料: 新聞
INSERT INTO news (title, excerpt, content, icon, category_id, published_at) VALUES
('社區合作計畫啟動', '聯合多個社區共同推動環保行動...', '今年度最大規模的社區合作計畫正式啟動，我們聯合了周邊10個社區，共同推動環保、教育、文化等多項合作行動。', '🤝', 1, '2025-03-15'),
('企業夥伴交流會', '與在地企業建立長期合作關係...', '本次交流會邀請了20家在地企業參與，共同探討如何透過企業資源回饋社會。', '💼', 1, '2025-03-10'),
('跨校合作專案發表', '三校聯合成果展現...', '由三所學校共同合作的專案今日正式發表，學生們展現了優秀的團隊合作精神與創意。', '🎓', 1, '2025-03-05'),
('傳統文化節', '重現在地傳統技藝與習俗...', '為期三天的傳統文化節，吸引超過5000人次參與，成功讓年輕一代認識在地文化。', '🎭', 2, '2025-02-20'),
('藝文展覽開幕', '在地藝術家聯合展出...', '集結30位在地藝術家的創作，展現社區豐富的藝術能量。', '🎨', 2, '2025-02-15'),
('社區幸福指數調查', '了解居民的生活滿意度...', '透過問卷調查與深度訪談，我們完成了首次社區幸福指數調查報告。', '📊', 3, '2025-01-25'),
('銀髮族關懷活動', '為長者帶來溫暖與陪伴...', '每月定期舉辦的銀髮族關懷活動，已經持續服務超過200位長者。', '💝', 3, '2025-01-20'),
('社區改造成果發表', '三年努力的成果展現...', '社區改造計畫歷時三年，成功打造多處公共空間。', '🏘️', 4, '2025-03-01'),
('課後輔導計畫', '為弱勢學童提供學習資源...', '課後輔導計畫已服務超過100位學童，學業成績平均提升15%。', '📖', 5, '2025-02-28'),
('淨灘活動紀錄', '守護海岸線的行動...', '今年度已舉辦8場淨灘活動，清理超過500公斤海洋垃圾。', '🏖️', 6, '2025-03-05');

-- 初始資料: 月份活動
INSERT INTO activities (title, date_label, location, month) VALUES
('新年團拜活動', '1月5日', '社區活動中心', 1),
('元宵燈會', '2月10日', '中央公園', 2),
('植樹節活動', '3月12日', '河濱公園', 3),
('兒童節園遊會', '4月4日', '國小操場', 4),
('母親節感恩活動', '5月11日', '社區活動中心', 5),
('端午包粽活動', '6月7日', '社區廚房', 6),
('暑期夏令營', '7月1日-5日', '社區活動中心', 7),
('父親節活動', '8月8日', '社區活動中心', 8),
('中秋賞月晚會', '9月14日', '中央公園', 9),
('重陽敬老活動', '10月11日', '活動中心', 10),
('社區運動會', '11月15日', '國中操場', 11),
('聖誕晚會', '12月24日', '社區廣場', 12);

-- Gallery 圖片表
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 首頁內容表
CREATE TABLE homepage (
    id SERIAL PRIMARY KEY,
    slogan VARCHAR(100),
    title VARCHAR(200),
    content TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 初始資料: 首頁內容
INSERT INTO homepage (slogan, title, content) VALUES
('NGO 20 SLOGAN', '標題標題標題', '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的已是至要和寫孽岩中慚和，些言纏。真陳要意種哈役在得的，卸緊矢十梨告棉蹲啤些。');
