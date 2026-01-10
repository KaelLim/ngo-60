-- =============================================
-- 慈濟60週年活動網站 - 資料庫 Schema
-- =============================================

-- 類別表 (主題 Topics)
-- 用於【看主題】tab 的三個主題卡片
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    subtitle VARCHAR(100),
    description TEXT,
    icon VARCHAR(10) NOT NULL,
    background_image TEXT,
    sort_order INT DEFAULT 0
);

-- 活動表 (Events)
-- 用於【看時程】tab 和 topic-page 的活動列表
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    date_start DATE NOT NULL,
    date_end DATE,
    participation_type VARCHAR(20) DEFAULT 'onsite' CHECK (participation_type IN ('online', 'onsite')),
    participation_fee VARCHAR(50),
    image_url TEXT,
    topic_id INT REFERENCES topics(id),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL DEFAULT 2026,
    sort_order INT DEFAULT 0
);

-- 影響力區塊表 (Impact Sections)
-- 用於【看影響】tab 的三角形三個節點
CREATE TABLE impact_sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    stat_value VARCHAR(20),
    stat_label VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- 祝福語表 (Blessings)
-- 用於【看影響】tab 的 bless-card 和 blessing-page
CREATE TABLE blessings (
    id SERIAL PRIMARY KEY,
    author VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    full_content TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0
);

-- Gallery 圖片表
CREATE TABLE gallery (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
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

-- =============================================
-- 種子資料 (Seed Data)
-- =============================================

-- 主題類別
INSERT INTO topics (name, subtitle, description, icon, background_image, sort_order) VALUES
('合作', '當行動成為力量', '透過跨界合作，結合各方資源與專業，共同為社會帶來正向改變。我們相信，當每一份力量匯聚在一起，就能創造更大的影響力。', '🤝', '/images/topics/cooperation.jpg', 1),
('人文', '當文化成為傳承', '深耕人文教育，傳承慈濟精神與價值。透過藝術、文學、音樂等多元形式，讓美善的種子在每個人心中萌芽。', '📚', '/images/topics/culture.jpg', 2),
('祈福', '當祝福成為希望', '以虔誠的心念，為天下蒼生祈福。在動盪的時代中，傳遞安定的力量，讓愛與希望成為人們前進的動力。', '🙏', '/images/topics/blessing.jpg', 3);

-- 活動 (依月份與主題分類)
INSERT INTO events (title, description, date_start, date_end, participation_type, participation_fee, image_url, topic_id, month, year, sort_order) VALUES
-- 合作主題活動
('友善蔬食旅店推動計畫', '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電。', '2026-08-28', '2026-09-05', 'onsite', '以店家費用為準', '/images/events/vegan-hotel.jpg', 1, 8, 2026, 1),
('亞太永續博覽會', '結合亞太地區各國力量，共同推動永續發展目標。展現慈濟在環保、教育、人道援助等領域的成果。', '2026-08-15', '2026-08-20', 'onsite', '需購票', '/images/events/expo.jpg', 1, 8, 2026, 2),
('企業夥伴交流會', '與在地企業建立長期合作關係，共同探討如何透過企業資源回饋社會，創造共好價值。', '2026-09-10', '2026-09-10', 'onsite', '免費', '/images/events/business.jpg', 1, 9, 2026, 3),

-- 人文主題活動
('傳統文化節', '重現在地傳統技藝與習俗，讓年輕一代認識並傳承珍貴的文化資產。', '2026-08-01', '2026-08-03', 'onsite', '免費', '/images/events/culture-fest.jpg', 2, 8, 2026, 1),
('藝文展覽', '集結30位在地藝術家的創作，展現社區豐富的藝術能量，以藝術傳遞人文關懷。', '2026-09-15', '2026-09-30', 'onsite', '免費', '/images/events/art-exhibition.jpg', 2, 9, 2026, 2),
('人文講座系列', '邀請各領域專家學者，分享人文思想與生命故事，啟發聽眾對生命的深層思考。', '2026-10-01', '2026-10-31', 'online', '免費', '/images/events/lecture.jpg', 2, 10, 2026, 3),

-- 祈福主題活動
('線上浴佛', '透過線上平台，讓全球各地的民眾都能參與浴佛典禮，以虔誠的心洗滌心靈。', '2026-05-08', '2026-05-15', 'online', '免費', '/images/events/buddha-bathing.jpg', 3, 5, 2026, 1),
('精舍過新年', '在靜思精舍迎接新年，體驗清淨簡樸的生活，以感恩的心迎接新的開始。', '2026-01-28', '2026-02-02', 'onsite', '免費', '/images/events/new-year.jpg', 3, 1, 2026, 2),
('歲末祝福感恩會', '歲末年終之際，齊聚一堂表達感恩，並為來年祈福，傳遞溫暖與祝福。', '2026-12-20', '2026-12-25', 'onsite', '免費', '/images/events/year-end.jpg', 3, 12, 2026, 3);

-- 影響力區塊
INSERT INTO impact_sections (name, icon, stat_value, stat_label, sort_order) VALUES
('永續', '🌱', '7,000+', '台志工', 1),
('深耕', '🌳', '50+', '個國家', 2),
('向光', '☀️', '60', '年傳承', 3);

-- 祝福語
INSERT INTO blessings (author, message, full_content, image_url, is_featured, sort_order) VALUES
('證嚴上人', '心寬念純，知足常樂。', '人生在世，最重要的是心寬念純。當我們的心胸開闊，不計較得失，自然能夠知足常樂。每一天都是新的開始，讓我們以感恩的心迎接每一個當下，用愛與善念創造美好的人生。

慈濟走過六十年，感恩全球志工的付出與奉獻。讓我們繼續攜手同行，為這個世界帶來更多的愛與希望。', '/images/blessings/master.jpg', true, 1),
('靜思語', '做好事不能少我一人，做壞事不能多我一人。', '每一個人的力量看似微小，但當我們願意付出、願意行動，就能匯聚成改變世界的力量。做好事，從自己開始；拒絕壞事，也從自己做起。這就是最簡單卻最有力量的生活態度。', '/images/blessings/jingsi.jpg', true, 2),
('靜思語', '生氣是拿別人的過錯來懲罰自己。', '當我們生氣時，傷害最深的往往是自己。與其讓負面情緒困擾自己，不如學習放下，以智慧化解衝突，以慈悲包容他人。這樣，我們的心才能真正自在。', '/images/blessings/jingsi2.jpg', true, 3),
('志工分享', '在付出中，我找到了生命的意義。', '加入慈濟志工行列，是我人生最重要的決定之一。每一次的付出，每一次的服務，都讓我更加體會到生命的價值。原來，幸福不是擁有多少，而是付出多少。', '/images/blessings/volunteer.jpg', false, 4);

-- 首頁內容
INSERT INTO homepage (slogan, title, content) VALUES
('慈悲六十 大愛恆傳', '感恩有您 攜手同行', '慈濟基金會成立六十週年，感恩全球志工與善心人士的支持與付出。六十年來，我們走遍世界各個角落，為苦難眾生送上關懷與希望。

讓我們一起回顧這六十年的足跡，展望未來的願景，繼續以大愛精神，為這個世界帶來更多的美善與光明。');
