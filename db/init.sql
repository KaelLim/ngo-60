--
-- PostgreSQL database dump
--

\restrict kYyuLV9fF0UcsSzBPIdElSjCE6cZdgwyQfXYVCm1lwbwcrHS5kV3r3kZwKgxVYd

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_sessions (
    id integer NOT NULL,
    client_session_id character varying(255) NOT NULL,
    sdk_session_id character varying(255) NOT NULL,
    title character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.agent_sessions OWNER TO postgres;

--
-- Name: agent_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_sessions_id_seq OWNER TO postgres;

--
-- Name: agent_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_sessions_id_seq OWNED BY public.agent_sessions.id;


--
-- Name: blessing_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blessing_tags (
    id integer NOT NULL,
    message text NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.blessing_tags OWNER TO postgres;

--
-- Name: blessing_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blessing_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blessing_tags_id_seq OWNER TO postgres;

--
-- Name: blessing_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blessing_tags_id_seq OWNED BY public.blessing_tags.id;


--
-- Name: blessings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blessings (
    id integer NOT NULL,
    author character varying(100) NOT NULL,
    message text NOT NULL,
    full_content text,
    image_url text,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.blessings OWNER TO postgres;

--
-- Name: blessings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blessings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blessings_id_seq OWNER TO postgres;

--
-- Name: blessings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blessings_id_seq OWNED BY public.blessings.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    date_start date NOT NULL,
    date_end date,
    participation_type character varying(50),
    image_url text,
    link_url text,
    topic_id integer,
    month integer NOT NULL,
    year integer DEFAULT 2026 NOT NULL,
    sort_order integer DEFAULT 0,
    CONSTRAINT events_month_check CHECK (((month >= 1) AND (month <= 12)))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: gallery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gallery (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255),
    mime_type character varying(50),
    category character varying(50) DEFAULT 'general'::character varying,
    uploaded_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.gallery OWNER TO postgres;

--
-- Name: gallery_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gallery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gallery_id_seq OWNER TO postgres;

--
-- Name: gallery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gallery_id_seq OWNED BY public.gallery.id;


--
-- Name: homepage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.homepage (
    id integer NOT NULL,
    slogan character varying(100),
    title character varying(200),
    content text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.homepage OWNER TO postgres;

--
-- Name: homepage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.homepage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.homepage_id_seq OWNER TO postgres;

--
-- Name: homepage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.homepage_id_seq OWNED BY public.homepage.id;


--
-- Name: impact_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.impact_sections (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    icon character varying(10) NOT NULL,
    stat_value character varying(20),
    stat_label character varying(50),
    sort_order integer DEFAULT 0
);


ALTER TABLE public.impact_sections OWNER TO postgres;

--
-- Name: impact_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.impact_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.impact_sections_id_seq OWNER TO postgres;

--
-- Name: impact_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.impact_sections_id_seq OWNED BY public.impact_sections.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    subtitle character varying(100),
    description text,
    icon character varying(10) NOT NULL,
    background_image text,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO postgres;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: agent_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_sessions ALTER COLUMN id SET DEFAULT nextval('public.agent_sessions_id_seq'::regclass);


--
-- Name: blessing_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blessing_tags ALTER COLUMN id SET DEFAULT nextval('public.blessing_tags_id_seq'::regclass);


--
-- Name: blessings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blessings ALTER COLUMN id SET DEFAULT nextval('public.blessings_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: gallery id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gallery ALTER COLUMN id SET DEFAULT nextval('public.gallery_id_seq'::regclass);


--
-- Name: homepage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homepage ALTER COLUMN id SET DEFAULT nextval('public.homepage_id_seq'::regclass);


--
-- Name: impact_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.impact_sections ALTER COLUMN id SET DEFAULT nextval('public.impact_sections_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Data for Name: agent_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_sessions (id, client_session_id, sdk_session_id, title, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blessing_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blessing_tags (id, message, is_active) FROM stdin;
1	謝謝陪伴需要幫助的人	t
2	陪災民找回希望	t
3	願醫護人員健康平安	t
4	志工力量連結社會	t
5	持續守護台灣與世界	t
6	讓善心善款都能化為溫暖	t
7	攜手為地球環境盡一份力量	t
8	帶領大家做應該做但沒人做的	t
9	Just Do It!	t
\.


--
-- Data for Name: blessings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blessings (id, author, message, full_content, image_url, is_featured, sort_order) FROM stdin;
2	靜思語	做好事不能少我一人，做壞事不能多我一人。	每一個人的力量看似微小，但當我們願意付出、願意行動，就能匯聚成改變世界的力量。做好事，從自己開始；拒絕壞事，也從自己做起。這就是最簡單卻最有力量的生活態度。	/uploads/gallery/gallery_14.webp	t	2
3	靜思語	生氣是拿別人的過錯來懲罰自己。	當我們生氣時，傷害最深的往往是自己。與其讓負面情緒困擾自己，不如學習放下，以智慧化解衝突，以慈悲包容他人。這樣，我們的心才能真正自在。	/uploads/gallery/gallery_15.webp	t	3
4	志工分享	在付出中，我找到了生命的意義。	加入慈濟志工行列，是我人生最重要的決定之一。每一次的付出，每一次的服務，都讓我更加體會到生命的價值。原來，幸福不是擁有多少，而是付出多少。	/uploads/gallery/gallery_16.webp	f	4
1	證嚴上人	一甲子是一段路，也是一分承擔。慈濟人走過風雨，跨越國界，始終不變的是那分守護生命、愛護世界的決心；期	一甲子是一段路，也是一分承擔。慈濟人走過風雨，跨越國界，始終不變的是那分守護生命、愛護世界的決心；期待慈濟人用更謙卑的愛，更堅定的願，繼續陪伴苦難，照亮世界黑暗的角落，讓善念更長流、慈悲綻放。	/uploads/gallery/gallery_13.webp	t	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order) FROM stdin;
15	三節合一浴佛大典	五月第二個星期日，是佛誕節、母親節、慈濟日三節合一的殊勝日子，慈濟浴佛大典從花蓮展開，緊接著在全球各地也會陸續舉辦，邀會眾同沐佛恩、親恩、眾生恩。	2026-05-10	2026-05-10	現場｜各地靜思堂・免費		\N	3	5	2026	0
12	「慈悲利他」心靈關懷研討會	與哈佛大學宗教學院合作舉辦研討會探討跨文化如何共同倡導慈悲利他，落實心靈關懷，共創祥和人間。	2026-03-01	2026-03-31	現場｜哈佛大學/線上｜同步直播・視情況而定		\N	1	3	2026	0
1	友善蔬食旅店推廣	花蓮友善蔬食旅店選擇豐富，已有超過60家旅宿通過慈濟與花蓮縣政府認證，提供客製化素食餐點及綠色低碳住宿體驗。\n邀您帶著友善環境、愛護地球的心，感受花蓮的好山好水，感受心與大地的親密對話。	2026-02-01	2027-12-31	現場｜花蓮·以店家費用為準	/uploads/gallery/gallery_04.webp	\N	1	2	2026	0
8	精舍過心年	邀您回到靜思精舍，和全球慈濟人共度春節假期，體驗清淨簡樸的濃濃年味，以感恩的心迎接新的一年。	2026-02-16	2026-02-20	現場｜靜思精舍-免費	/uploads/gallery/gallery_11.webp	\N	2	2	2026	0
18	慈濟人文講座	邀請您與我們一同拓寬心靈的疆界，在浩瀚的人文觀照中，遇見更好的自己。\n這不僅是一場知識的匯聚，更是一場心靈的壯遊。我們將透過分享者的生命智慧，帶領大家跨越個己的局限，用更宏觀的格局觀看世界：	2026-06-01	2026-12-31	現場｜花蓮/線上｜直播	\N	\N	2	6	2026	0
20	小善經濟平臺	行善是有心人的權利，慈濟為您打造小善經濟平臺，讓您在每一個善念升起的瞬間，及時化善心為善行。	2026-07-01	2026-12-31	線上｜善行平臺・隨喜	\N	\N	1	7	2026	0
13	靜思精舍朝山	體會「朝山」不是形式，而是「回心向法」的朝聖之旅，透過行願與感恩的步伐，回歸到靜思法脈；感受自然環境與法脈的融合，在莊嚴寧靜中生起祝福與感恩。\n	2026-04-01	2026-04-26	現場｜靜思精舍・免費		\N	3	4	2026	0
14	一甲子紀念套書	透過一甲子紀念套書的出版，與您分享慈濟點滴，窺見慈濟在歷史長河中，行入人間勤行菩薩道的慈悲善行，以及在行經中展開的人生篇章。	2026-04-01	2026-12-31	書籍請購	\N	\N	2	4	2026	0
7	線上浴佛	佛在靈山不遠求，靈山只在汝心頭。不論您身在何地，都可以透過線上平臺，靜心浴佛，感受佛恩、親恩、眾生恩，升起感恩心，滌淨蒙塵的心。	2026-05-01	2026-05-31	線上｜浴佛網站·免費	/uploads/gallery/gallery_10.webp	\N	3	5	2026	1
11	慈濟列車	喜迎慈濟六十，「慈濟列車」再啟，邀請您回到心靈故鄉——靜思精舍，體現「回歸初心、安住本願、感恩祝福、續法傳心」，讓法脈與慈悲，在新的一甲子繼續流轉、發光。\n\n早期，慈濟人邀請會眾回到花蓮參訪慈濟，參觀剛蓋好的慈濟醫院，也看看自己捐的善款用在哪裡？慈濟人天未亮就去排隊買火車票，鐵路局被慈濟人感動，從一個車廂到一整列車，載著會眾回到心靈故鄉，「慈濟列車」於焉開始⋯⋯\n\n\n	2026-01-01	2026-12-31	現場｜花蓮・視情況而定		\N	2	1	2026	0
9	歲末祝福感恩會	歲末年終之際，齊聚一堂表達感恩，並為來年祈福，傳遞溫暖與祝福。	2026-12-20	2026-12-31	現場｜各地慈濟會所・免費	/uploads/gallery/gallery_12.webp	\N	3	12	2026	\N
10	《回家聽故事》靜態展	這是一個以文字為主、需要靜心閱讀的展覽。\n\n期盼透過展覽，喚醒你我深藏在內心的感動。最精彩的故事，其實不是在牆上，而是在每一位菩薩的生命裡。我們只是搭了一個舞台，備好了題目，等待各位回來，將您親身歷練的感動，化作滋養他人的法水。\n \n誠摯邀請所有家人，元旦開始，回家聽故事，更回家「講」故事。	2026-01-01	2026-12-31	現場｜靜思精舍・免費		https://info.tzuchi.org/article/4602?_gl=1*x5vf2y*_ga*R1MyLjEuczE3Njk1ODg4MjkkbzExJGcxJHQxNzY5NTg4ODYwJGoyOSRsMCRoMTQ5MTkwMDIwMg..*_ga_CYJJ36SS8M*czE3Njk2Njg0NzYkbzQkZzEkdDE3Njk2Njg0NzkkajU3JGwwJGgxMDY1MjU0NTgz	2	1	2026	0
16	各地靜思堂六十週年靜態展	慈濟從花蓮發祥擴及全球一百三十九個國家，而每一個慈善的腳印，都因眾生苦難不同而衍生出不同的感動，更啟發出不同的人生智慧，值此慈濟六十週年之際，邀您走進各慈濟會所，感受慈濟初心恆持的慈悲願行。	2026-05-10	2026-12-31	現場｜各地靜思堂・免費		\N	2	1	2026	0
19	蔬食600 盤	蔬食，不僅僅是健康的飲食習慣，更是愛護地球的一種快速有效的行動，蔬食的好，很難言說，我們透過蔬食600盤，邀您親身體驗。	2026-07-01	2026-07-31	線上｜慈濟社群平臺·免費		\N	1	7	2026	0
4	《無量義・法髓頌》經藏演繹	慈濟行願一甲子，每一個菩薩足跡都是《無量義經》的真實之路；慈濟人透過《無量義・法髓頌》的經藏演繹，邀您感受佛法真實在人間，而且在你我身邊。	2026-08-01	2026-08-31	現場｜台北小巨蛋·免費	/uploads/gallery/gallery_07.webp	\N	2	8	2026	1
17	《明心》慈濟六十沉浸式展覽	哈佛大學認知美學媒體實驗室以佛教遺址八大聖地，透過嚴謹的歷史考古、建築與佛教史研究，及現代媒體藝術；以影音沉浸式展覽方式，展現慈濟精神與千年佛教文化遺產的對話，並將此作品稱為《明心之路》。\n\n邀您一同透過探古溯今的歷程，穿越時空領受「靜思法脈  慈濟宗門」的當代重要意義。	2026-05-01	2026-05-31	現場｜哈佛大學・免費		\N	2	1	2026	0
3	企業夥伴交流會	與在地企業建立長期合作關係，共同探討如何透過企業資源回饋社會，創造共好價值。	2026-09-10	2026-09-10	現場｜花蓮·免費	/uploads/gallery/gallery_06.webp	\N	1	9	2026	3
5	慈濟論壇：蔬食推廣	與哈佛大學公衛學院合作，論述從餐桌上的修行，建構蔬食生態系，探討從飲食改變，實踐慈悲護生，進而創造地球永續的方法。	2026-10-03	2026-10-04	現場參與·免費	/uploads/gallery/gallery_08.webp	\N	1	10	2026	2
2	亞太永續博覽會	呼應2026第五屆亞太永續博覽會【共築我們的未來】主題，展出六十年來，慈濟如何實踐慈悲願行，發揮智慧為地球及人類永續鋪一條可行的道路。	2026-08-27	2026-08-29	現場｜臺北世貿·購票	/uploads/gallery/gallery_05.webp	\N	1	8	2026	0
21	《明心》慈濟六十沉浸式展覽	哈佛大學認知美學媒體實驗室以佛教遺址八大聖地，透過嚴謹的歷史考古、建築與佛教史研究，及現代媒體藝術；以影音沉浸式展覽方式，展現慈濟精神與千年佛教文化遺產的對話，並將此作品稱為《明心之路》。\n\n邀您一同透過探古溯今的歷程，穿越時空領受「靜思法脈  慈濟宗門」的當代重要意義。	2026-08-01	2026-08-31	現場｜高雄科工館・免費		\N	1	8	2026	0
22	慈濟一甲子電影	濃縮慈濟一甲子的記錄片，帶您走進時光隧道，感受慈濟一路走來的心路歷程，同頻慈濟濟世的悲心。	2026-08-30	2026-12-31	線上｜觀看電影・購票	\N	\N	2	8	2026	0
23	第三屆「齊柏林飛閱臺灣」攝影展	從高空的視角，帶你重新認識臺灣。\n\n「齊柏林飛閱臺灣攝影獎」作品，從峻峭山脈到城市肌理，每一幅都是對土地的凝視與告白。\n\n不論是河川的曲線、海岸的光影⋯⋯都讓人體會著城鄉的呼吸，也映照著環境的變化與復甦。\n\n這不只是一場影像的呈現，更是一場良知的行動。邀請你一起，走進山海之間的鏡頭視角，看見影像背後的故事。	2026-11-01	2026-11-30	現場｜臺灣・免費		\N	1	11	2026	0
24	七月吉祥祈福會	七月，不是「鬼月」，而是吉祥月，這是一段把恐懼轉化為善念，把思念化為祝福。\n\n無論你在哪裡，都能透過一場線上祈福會靜下心來，為自己、家人與世界送上一份平安。\n\n吉祥月祈福會不只是祈願，更是與世界眾生心念交會，凝聚成一股力量，為自己與身邊人帶來安定與安心。	2026-08-13	2026-09-10	現場｜慈濟各地會所・免費		\N	3	8	2026	0
\.


--
-- Data for Name: gallery; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gallery (id, filename, original_name, mime_type, category, uploaded_at, is_active) FROM stdin;
1	gallery_01.webp	gallery_01.webp	image/webp	homepage	2026-01-23 06:21:24.170583	t
2	gallery_02.webp	gallery_02.webp	image/webp	homepage	2026-01-23 06:21:24.171518	t
3	gallery_03.webp	gallery_03.webp	image/webp	homepage	2026-01-23 06:21:24.172071	t
4	gallery_04.webp	gallery_04.webp	image/webp	homepage	2026-01-23 06:21:24.172506	t
5	gallery_05.webp	gallery_05.webp	image/webp	homepage	2026-01-23 06:21:24.173041	t
6	gallery_06.webp	gallery_06.webp	image/webp	homepage	2026-01-23 06:21:24.173515	t
7	gallery_07.webp	gallery_07.webp	image/webp	homepage	2026-01-23 06:21:24.173954	t
8	gallery_08.webp	gallery_08.webp	image/webp	homepage	2026-01-23 06:21:24.174382	t
9	gallery_09.webp	gallery_09.webp	image/webp	homepage	2026-01-23 06:21:24.174843	t
10	gallery_10.webp	gallery_10.webp	image/webp	homepage	2026-01-23 06:21:24.175318	t
11	gallery_11.webp	gallery_11.webp	image/webp	homepage	2026-01-23 06:21:24.175901	t
12	gallery_12.webp	gallery_12.webp	image/webp	homepage	2026-01-23 06:21:24.176403	t
13	gallery_13.webp	gallery_13.webp	image/webp	homepage	2026-01-23 06:21:24.176853	t
14	gallery_14.webp	gallery_14.webp	image/webp	homepage	2026-01-23 06:21:24.177363	t
15	gallery_15.webp	gallery_15.webp	image/webp	homepage	2026-01-23 06:21:24.177807	t
16	gallery_16.webp	gallery_16.webp	image/webp	homepage	2026-01-23 06:21:24.178249	t
17	gallery_17.webp	gallery_17.webp	image/webp	homepage	2026-01-23 06:21:24.178681	t
18	2cd1a34d-0a9b-407c-8c68-226f034b7b3d.webp	2cd1a34d-0a9b-407c-8c68-226f034b7b3d.webp	image/webp	homepage	2026-01-23 06:21:24.179077	t
19	92cf295e-db98-492b-9aa1-2fea4b4eecf4.webp	92cf295e-db98-492b-9aa1-2fea4b4eecf4.webp	image/webp	homepage	2026-01-23 06:21:24.179553	t
20	aa397a6d-26de-40e6-be0a-79a9834209dc.webp	aa397a6d-26de-40e6-be0a-79a9834209dc.webp	image/webp	homepage	2026-01-23 06:21:24.179991	t
\.


--
-- Data for Name: homepage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.homepage (id, slogan, title, content, updated_at) FROM stdin;
1	跨越六十    願行恆常	六十年的願行長河    感恩有您一路隨行	回首過去，瞻望未來，內心只有滿滿的感動和感恩。\n感恩社會賢達、僧俗二眾弟子和長期捐款護持的會員大德，認同慈濟陸續展開的「慈善」、「醫療」、「教育」、「人文」志業，帶動社會往和平、正向光明的方向前進。\n——證嚴上人	2026-01-29 09:31:07.398738
\.


--
-- Data for Name: impact_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.impact_sections (id, name, icon, stat_value, stat_label, sort_order) FROM stdin;
1	永續	🌱	7,000+	台志工	1
2	深耕	🌳	50+	個國家	2
3	向光	☀️	60	年傳承	3
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, name, subtitle, description, icon, background_image, sort_order) FROM stdin;
2	人文	當人文成為傳承	深耕人文，傳承慈濟精神與價值。透過藝術、文學、音樂等多元形式，讓美善的種子在每個人心中萌芽。	📚	/uploads/gallery/gallery_02.webp	2
1	合作	當行動成為力量	透過跨界合作，結合各方資源與專業，共同為社會帶來正向改變。我們相信，當每一分力量匯聚在一起，就能創造更大的影響力。	🤝	/uploads/gallery/gallery_01.webp	1
3	祈福	當祝福成為希望	以虔誠的心念，為天下蒼生祈福。在動盪的時代中，傳遞安定的力量，讓愛與希望成為人們前進的動力。	🙏	/uploads/gallery/gallery_03.webp	3
\.


--
-- Name: agent_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_sessions_id_seq', 1, false);


--
-- Name: blessing_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blessing_tags_id_seq', 9, true);


--
-- Name: blessings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blessings_id_seq', 4, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 24, true);


--
-- Name: gallery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gallery_id_seq', 20, true);


--
-- Name: homepage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.homepage_id_seq', 1, true);


--
-- Name: impact_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.impact_sections_id_seq', 3, true);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 3, true);


--
-- Name: agent_sessions agent_sessions_client_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_client_session_id_key UNIQUE (client_session_id);


--
-- Name: agent_sessions agent_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_pkey PRIMARY KEY (id);


--
-- Name: blessing_tags blessing_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blessing_tags
    ADD CONSTRAINT blessing_tags_pkey PRIMARY KEY (id);


--
-- Name: blessings blessings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blessings
    ADD CONSTRAINT blessings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: gallery gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gallery
    ADD CONSTRAINT gallery_pkey PRIMARY KEY (id);


--
-- Name: homepage homepage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.homepage
    ADD CONSTRAINT homepage_pkey PRIMARY KEY (id);


--
-- Name: impact_sections impact_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.impact_sections
    ADD CONSTRAINT impact_sections_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: events events_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id);


--
-- PostgreSQL database dump complete
--

\unrestrict kYyuLV9fF0UcsSzBPIdElSjCE6cZdgwyQfXYVCm1lwbwcrHS5kV3r3kZwKgxVYd

