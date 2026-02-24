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
    published boolean DEFAULT true,
    privacy integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
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
    stat_label character varying(50),
    stat_value character varying(20),
    stat_unit character varying(50),
    sort_order integer DEFAULT 0
);


ALTER TABLE public.impact_sections OWNER TO postgres;

--
-- Name: impact_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.impact_config (
    id integer NOT NULL,
    main_title character varying(200),
    subtitle character varying(200),
    published integer DEFAULT 1,
    blessing_title character varying(200) DEFAULT '傳送祝福 灌溉希望',
    blessing_published integer DEFAULT 1,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.impact_config OWNER TO postgres;

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
1	證嚴上人	一甲子是一段路，也是一分承擔。慈濟人走過風雨，跨越國界，始終不變的是那分守護生命、愛護世界的決心；期	一甲子是一段路，也是一分承擔。慈濟人走過風雨，跨越國界，始終不變的是那分守護生命、愛護世界的決心；期待慈濟人用更謙卑的愛，更堅定的願，繼續陪伴苦難，照亮世界黑暗的角落，讓善念更長流、慈悲綻放。	/uploads/gallery/87d68e25-1782-4080-8ad3-6619a1bfc3e8.webp	t	1
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order, published, privacy, created_at, updated_at) FROM stdin;
1	友善蔬食旅店推廣	花蓮友善蔬食旅店選擇豐富，已有超過60家旅宿通過慈濟與花蓮縣政府認證，提供客製化素食餐點及綠色低碳住宿體驗。\n邀您帶著友善環境、愛護地球的心，感受花蓮的好山好水，感受心與大地的親密對話。	2026-01-01	2026-12-31		/uploads/gallery/ce91eddc-25e9-49ba-960f-bbf63262a7e8.webp	https://vegan.tzuchi-org.tw/?_gl=1*151erq7*_ga*R1MyLjEuczE3Njk1OTE3NTAkbzMyJGcxJHQxNzY5NTkxODA0JGo2JGwwJGgxMTc4OTM5MzUx*_ga_CYJJ36SS8M*czE3NzAwMTA1NDgkbzMzJGcxJHQxNzcwMDEwNTQ4JGo2MCRsMCRoMjA3MDQ3NzU1MA..	1	1	2026	0	t	0	2026-01-05 08:30:00	2026-02-23 00:00:00
10	《回家聽故事》靜態展	這是一個以文字為主、需要靜心閱讀的展覽。\n\n期盼透過展覽，喚醒你我深藏在內心的感動。最精彩的故事，其實不是在牆上，而是在每一位菩薩的生命裡。我們只是搭了一個舞台，備好了題目，等待各位回來，將您親身歷練的感動，化作滋養他人的法水。\n \n誠摯邀請所有家人，元旦開始，回家聽故事，更回家「講」故事。	2026-01-01	2026-12-31	淨斯自立更生園區｜免費	/uploads/gallery/ab203c2c-5725-47d5-bb48-8ce72b455858.webp	https://info.tzuchi.org/article/4602?_gl=1*x5vf2y*_ga*R1MyLjEuczE3Njk1ODg4MjkkbzExJGcxJHQxNzY5NTg4ODYwJGoyOSRsMCRoMTQ5MTkwMDIwMg..*_ga_CYJJ36SS8M*czE3Njk2Njg0NzYkbzQkZzEkdDE3Njk2Njg0NzkkajU3JGwwJGgxMDY1MjU0NTgz	2	1	2026	0	t	0	2026-01-10 09:00:00	2026-02-23 00:00:00
8	精舍過心年	邀您回到靜思精舍，和全球慈濟人共度春節假期，體驗清淨簡樸的濃濃年味，以感恩的心迎接新的一年。	2026-02-16	2026-02-20	靜思精舍｜免費	/uploads/gallery/c3e7fc17-a8e7-4f95-bcbd-f69c7308a605.webp	https://cny.tzuchi.org.tw/2026	2	2	2026	0	t	0	2026-01-13 10:20:00	2026-02-23 00:00:00
26	美哉！靜思堂  寫生比賽	2026「美哉！靜思堂」寫生比賽，將於 115 年 3 月 21 日（星期六）上午 9:00–12:00 在風景優美的花蓮慈濟文化園區盛大登場。	2026-03-21	2026-03-21	花蓮慈濟文化園區｜免費	/uploads/gallery/24d87974-ca21-467e-9407-62eaf10663e0.webp	https://info.tzuchi.org/article/4791	\N	3	2026	0	t	0	2026-02-23 00:00:00	\N
13	精舍朝山	體會「朝山」不是形式，而是「回心向法」的朝聖之旅，透過行願與感恩的步伐，回歸到靜思法脈；感受自然環境與法脈的融合，在莊嚴寧靜中生起祝福與感恩。\n	2026-04-10	2026-04-26	靜思精舍｜免費	/uploads/gallery/008112ca-1651-42b7-ac57-40c69c411518.webp	\N	3	4	2026	0	f	0	2026-01-18 14:20:00	2026-02-23 00:00:00
7	線上浴佛	佛在靈山不遠求，靈山只在汝心頭。不論您身在何地，都可以透過線上平臺，靜心浴佛，感受佛恩、親恩、眾生恩，升起感恩心，滌淨蒙塵的心。	2026-05-01	2026-05-31	線上參與｜免費	/uploads/gallery/f4f1a2fc-b80d-4fb2-9ab1-871f35dfca12.webp	\N	3	5	2026	1	f	0	2026-01-15 09:30:00	2026-02-23 00:00:00
21	《明心》慈濟六十沉浸式展覽（前導展）	哈佛大學認知美學媒體實驗室以佛教遺址八大聖地，透過嚴謹的歷史考古、建築與佛教史研究，及現代媒體藝術；以影音沉浸式展覽方式，展現慈濟精神與千年佛教文化遺產的對話，並將此作品稱為《明心之路》。\n\n邀您一同透過探古溯今的歷程，穿越時空領受「靜思法脈  慈濟宗門」的當代重要意義。	2026-05-01	2026-05-31	花蓮靜思堂	/uploads/gallery/a5a77462-8998-4701-ae9a-f38ae443868e.webp	\N	1	5	2026	0	f	0	2026-01-29 09:00:00	2026-02-23 00:00:00
16	慈濟六十圖文展	慈濟從花蓮發祥擴及全球一百三十九個國家，而每一個慈善的腳印，都因眾生苦難不同而衍生出不同的感動，更啟發出不同的人生智慧，值此慈濟六十週年之際，邀您走進各慈濟會所，感受慈濟初心恆持的慈悲願行。	2026-05-01	2026-12-31	各地會所	/uploads/gallery/03bfbce4-fb64-41a6-a4f9-7e5a7b02f199.webp	\N	2	5	2026	0	f	0	2026-01-21 13:30:00	2026-02-23 00:00:00
14	一甲子紀念套書	透過一甲子紀念套書的出版，與您分享慈濟點滴，窺見慈濟在歷史長河中，行入人間勤行菩薩道的慈悲善行，以及在行經中展開的人生篇章。	2026-05-09	\N		/uploads/gallery/7d2acf0d-cab6-49e4-a6e4-67c0b1d646b8.webp	\N	2	5	2026	0	f	0	2026-01-19 08:00:00	2026-02-23 00:00:00
15	三節合一浴佛典禮	五月第二個星期日，是佛誕節、母親節、慈濟日三節合一的殊勝日子，慈濟浴佛大典從花蓮展開，緊接著在全球各地也會陸續舉辦，邀會眾同沐佛恩、親恩、眾生恩。	2026-05-10	2026-05-10	全球各社區	/uploads/gallery/961cb724-2584-4fd7-9a86-21154b0af576.webp	\N	3	5	2026	0	f	0	2026-01-20 10:15:00	2026-02-23 00:00:00
18	慈濟人文講座	邀請您與我們一同拓寬心靈的疆界，在浩瀚的人文觀照中，遇見更好的自己。\n這不僅是一場知識的匯聚，更是一場心靈的壯遊。我們將透過分享者的生命智慧，帶領大家跨越個己的局限，用更宏觀的格局觀看世界：	2026-06-01	2026-12-31	現場｜花蓮/線上｜直播	/uploads/gallery/9cd5f7da-b3dd-4533-90c3-2df457835ed4.webp	\N	2	6	2026	0	f	0	2026-01-25 10:45:00	2026-02-23 00:00:00
25	印證佛學研討會	證嚴上人從「為佛教・為眾生」的一念心起，帶領慈濟人行入人間落實佛陀悲懷，「慈濟論述」由哈佛、臺大等國際七大名校學者來印證，透過研討會探究慈濟價值。	2026-07-31	\N		/uploads/gallery/43bcafb7-c8e8-4ae0-ba8c-6d2bcf7e8b4e.webp	\N	2	7	2026	0	f	0	2026-02-23 00:00:00	\N
17	《明心》慈濟六十沉浸式展覽	哈佛大學認知美學媒體實驗室以佛教遺址八大聖地，透過嚴謹的歷史考古、建築與佛教史研究，及現代媒體藝術；以影音沉浸式展覽方式，展現慈濟精神與千年佛教文化遺產的對話，並將此作品稱為《明心之路》。\n\n邀您一同透過探古溯今的歷程，穿越時空領受「靜思法脈  慈濟宗門」的當代重要意義。	2026-08-01	2026-10-31	高雄科工館	/uploads/gallery/a5a77462-8998-4701-ae9a-f38ae443868e.webp	\N	2	8	2026	0	f	0	2026-01-23 09:15:00	2026-02-23 00:00:00
24	七月吉祥月	七月，不是「鬼月」，而是吉祥月，這是一段把恐懼轉化為善念，把思念化為祝福。\n\n無論你在哪裡，都能透過一場線上祈福會靜下心來，為自己、家人與世界送上一份平安。\n\n吉祥月祈福會不只是祈願，更是與世界眾生心念交會，凝聚成一股力量，為自己與身邊人帶來安定與安心。	2026-08-13	2026-09-29	各地會所	/uploads/gallery/806cf556-ed8b-4fa1-a919-181120bded1f.webp	\N	3	8	2026	0	f	0	2026-01-28 11:00:00	2026-02-23 00:00:00
2	亞太永續博覽會	呼應2026第五屆亞太永續博覽會【共築我們的未來】主題，展出六十年來，慈濟如何實踐慈悲願行，發揮智慧為地球及人類永續鋪一條可行的道路。	2026-08-27	2026-08-29	臺北世貿｜免費	/uploads/gallery/4d8deaf2-3683-45f0-b16e-fce0adc2a96e.webp	\N	1	8	2026	0	t	0	2026-01-06 13:00:00	2026-02-23 00:00:00
5	慈濟論壇：蔬食推廣	與哈佛大學公衛學院合作，論述從餐桌上的修行，建構蔬食生態系，探討從飲食改變，實踐慈悲護生，進而創造地球永續的方法。	2026-10-03	2026-10-04	現場 + 線上參與·免費	/uploads/gallery/8218af52-41fa-4812-9ce3-09243825b1d0.webp	\N	1	10	2026	2	f	0	2026-01-09 11:30:00	2026-02-23 00:00:00
23	第三屆「齊柏林飛閱臺灣」攝影展	從高空的視角，帶你重新認識臺灣。\n\n「齊柏林飛閱臺灣攝影獎」作品，從峻峭山脈到城市肌理，每一幅都是對土地的凝視與告白。\n\n不論是河川的曲線、海岸的光影⋯⋯都讓人體會著城鄉的呼吸，也映照著環境的變化與復甦。\n\n這不只是一場影像的呈現，更是一場良知的行動。邀請你一起，走進山海之間的鏡頭視角，看見影像背後的故事。	2026-11-01	\N	現場參與｜免費	/uploads/gallery/861b0160-eb9b-4561-9945-2714c37befbe.webp	\N	1	11	2026	0	f	0	2026-01-27 14:30:00	2026-02-23 00:00:00
4	《無量義・法髓頌》經藏演繹	慈濟行願一甲子，每一個菩薩足跡都是《無量義經》的真實之路；慈濟人透過《無量義・法髓頌》的經藏演繹，邀您感受佛法真實在人間，而且在你我身邊。	2026-11-01	\N		/uploads/gallery/2429aae5-987a-48b2-a3cc-567c1451275e.webp	\N	2	11	2026	1	f	0	2026-01-08 16:00:00	2026-02-23 00:00:00
19	蔬食600 盤	蔬食，不僅僅是健康的飲食習慣，更是愛護地球的一種快速有效的行動，蔬食的好，很難言說，我們透過蔬食600盤，邀您親身體驗。	2026-11-01	\N		/uploads/gallery/2e5c63d8-9c39-4742-8fed-17890fc41c6b.webp	\N	1	11	2026	0	f	0	2026-01-24 16:45:00	2026-02-23 00:00:00
20	小善經濟平臺	行善是有心人的權利，慈濟為您打造小善經濟平臺，讓您在每一個善念升起的瞬間，及時化善心為善行。	2026-11-01	\N		/uploads/gallery/6dfd0f5a-bc49-4f78-9db0-2a35379b0b59.webp	\N	1	11	2026	0	f	0	2026-01-22 10:00:00	2026-02-23 00:00:00
22	慈濟一甲子電影	濃縮慈濟一甲子的記錄片，帶您走進時光隧道，感受慈濟一路走來的心路歷程，同頻慈濟濟世的悲心。	2026-12-01	\N		/uploads/gallery/dfa9b15b-82e8-433c-962f-eb1740ca4a82.webp	\N	2	12	2026	0	f	0	2026-01-26 08:30:00	2026-02-23 00:00:00
9	歲末祝福感恩會	歲末年終之際，齊聚一堂表達感恩，並為來年祈福，傳遞溫暖與祝福。	2026-12-01	\N		/uploads/gallery/578d6a90-1d53-4438-9f9f-40fc7f69ab80.webp	\N	3	12	2026	0	f	0	2026-01-14 14:00:00	2026-02-23 00:00:00
\.


--
-- Data for Name: gallery; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gallery (id, filename, original_name, mime_type, category, uploaded_at, is_active) FROM stdin;
20	aa397a6d-26de-40e6-be0a-79a9834209dc.webp	aa397a6d-26de-40e6-be0a-79a9834209dc.webp	image/webp	homepage	2026-01-23 06:21:24.179991	f
19	92cf295e-db98-492b-9aa1-2fea4b4eecf4.webp	92cf295e-db98-492b-9aa1-2fea4b4eecf4.webp	image/webp	homepage	2026-01-23 06:21:24.179553	f
18	2cd1a34d-0a9b-407c-8c68-226f034b7b3d.webp	2cd1a34d-0a9b-407c-8c68-226f034b7b3d.webp	image/webp	homepage	2026-01-23 06:21:24.179077	f
17	gallery_17.webp	gallery_17.webp	image/webp	homepage	2026-01-23 06:21:24.178681	f
16	gallery_16.webp	gallery_16.webp	image/webp	homepage	2026-01-23 06:21:24.178249	f
15	gallery_15.webp	gallery_15.webp	image/webp	homepage	2026-01-23 06:21:24.177807	f
9	gallery_09.webp	gallery_09.webp	image/webp	homepage	2026-01-23 06:21:24.174843	f
10	gallery_10.webp	gallery_10.webp	image/webp	homepage	2026-01-23 06:21:24.175318	f
11	gallery_11.webp	gallery_11.webp	image/webp	homepage	2026-01-23 06:21:24.175901	f
12	gallery_12.webp	gallery_12.webp	image/webp	homepage	2026-01-23 06:21:24.176403	f
13	gallery_13.webp	gallery_13.webp	image/webp	homepage	2026-01-23 06:21:24.176853	f
14	gallery_14.webp	gallery_14.webp	image/webp	homepage	2026-01-23 06:21:24.177363	f
8	gallery_08.webp	gallery_08.webp	image/webp	homepage	2026-01-23 06:21:24.174382	f
7	gallery_07.webp	gallery_07.webp	image/webp	homepage	2026-01-23 06:21:24.173954	f
6	gallery_06.webp	gallery_06.webp	image/webp	homepage	2026-01-23 06:21:24.173515	f
5	gallery_05.webp	gallery_05.webp	image/webp	homepage	2026-01-23 06:21:24.173041	f
1	gallery_01.webp	gallery_01.webp	image/webp	homepage	2026-01-23 06:21:24.170583	f
2	gallery_02.webp	gallery_02.webp	image/webp	homepage	2026-01-23 06:21:24.171518	f
3	gallery_03.webp	gallery_03.webp	image/webp	homepage	2026-01-23 06:21:24.172071	f
4	gallery_04.webp	gallery_04.webp	image/webp	homepage	2026-01-23 06:21:24.172506	f
65	66183f49-9df1-464c-b11c-dea9b7e43eae.webp	01.jpg	image/webp	homepage	2026-01-30 03:47:20.226436	t
64	c2d15108-f55c-4ef3-989c-5b59b4a5ea77.webp	02.jpg	image/webp	homepage	2026-01-30 03:47:20.161744	t
63	8db5aae7-0b9a-4a5d-a47f-879d99bb14b9.webp	03.jpg	image/webp	homepage	2026-01-30 03:47:20.103065	t
62	b80bf043-9524-4bbf-bc70-7a8cd0e38636.webp	04.jpg	image/webp	homepage	2026-01-30 03:47:20.037332	t
61	3b4ba791-acef-486e-b543-0924c0e07d78.webp	05.jpg	image/webp	homepage	2026-01-30 03:47:19.968596	t
60	29117d6e-24ba-4b61-9211-c2547c0c7e40.webp	06.jpg	image/webp	homepage	2026-01-30 03:47:19.906107	t
59	28980660-dbd9-456c-a7e7-6f813ebaac73.webp	07.jpg	image/webp	homepage	2026-01-30 03:47:19.855991	t
58	0340a722-6678-4dba-a305-264ef3774049.webp	08.jpg	image/webp	homepage	2026-01-30 03:47:19.804806	t
57	88d68f04-5170-4cd6-911f-bd3a339510ee.webp	09.jpg	image/webp	homepage	2026-01-30 03:47:19.745826	t
56	9d233cbd-4a28-452d-9593-1bfb656fa038.webp	10.jpg	image/webp	homepage	2026-01-30 03:47:19.66338	t
46	37bb1928-c1e7-45c9-840d-a1641f8e9370.webp	20.jpg	image/webp	homepage	2026-01-30 03:47:18.845184	t
47	6d770d16-39bb-41aa-96d6-d9ddb7922708.webp	19.jpg	image/webp	homepage	2026-01-30 03:47:18.958725	t
48	4f618db4-5900-4019-8008-3a627e4e769e.webp	18.jpg	image/webp	homepage	2026-01-30 03:47:19.076835	t
49	21b378c9-1d95-4b01-b8e1-dff52c0733b6.webp	17.jpg	image/webp	homepage	2026-01-30 03:47:19.16292	t
50	616c412c-75f8-4e8b-ba22-f15fdae6b8aa.webp	16.jpg	image/webp	homepage	2026-01-30 03:47:19.234407	t
51	f592ef1a-df1e-45ed-a25e-0faceb090ace.webp	15.jpg	image/webp	homepage	2026-01-30 03:47:19.298943	t
52	7e230d24-3752-4bb7-86e7-5fde7a94cf25.webp	14.jpg	image/webp	homepage	2026-01-30 03:47:19.368276	t
53	fc115529-606d-445c-81a1-e3b949207e39.webp	13.jpg	image/webp	homepage	2026-01-30 03:47:19.452018	t
54	08701e95-5a85-4adc-bc90-ac26ad52eeba.webp	12.jpg	image/webp	homepage	2026-01-30 03:47:19.518613	t
55	11807694-f3f8-49fc-8136-494075e7e4ea.webp	11.jpg	image/webp	homepage	2026-01-30 03:47:19.58648	t
45	7004ba03-d4ba-4217-986b-2af34ad69850.webp	21.jpg	image/webp	homepage	2026-01-30 03:47:18.762437	t
44	f897a07b-1244-46b6-9b5a-45648e605e88.webp	22.jpg	image/webp	homepage	2026-01-30 03:47:18.703049	t
43	33f19b32-86c1-42c1-a63f-557fc8425019.webp	23.jpg	image/webp	homepage	2026-01-30 03:47:18.658046	t
42	3b8661fa-768c-4832-983e-4e9f45e6ee5c.webp	24.jpg	image/webp	homepage	2026-01-30 03:47:18.594094	t
41	4f7335eb-28e9-433b-b6ae-a9e4d6093581.webp	25.jpg	image/webp	homepage	2026-01-30 03:47:18.524282	t
40	b3f48cde-cffc-4364-9806-bfb4afd8aa97.webp	26.jpg	image/webp	homepage	2026-01-30 03:47:18.454143	t
39	ca8fff16-c402-4b66-9060-48d1a6b01766.webp	27.jpg	image/webp	homepage	2026-01-30 03:47:18.388173	t
38	eb844005-6fb2-49eb-86b3-4c2f67572514.webp	28.jpg	image/webp	homepage	2026-01-30 03:47:18.305319	t
37	5281ad59-8865-4193-8e48-582304f03b8f.webp	29.jpg	image/webp	homepage	2026-01-30 03:47:18.237816	t
36	006e52ce-9437-4f62-bd17-857c3111dc13.webp	30.jpg	image/webp	homepage	2026-01-30 03:47:18.184926	t
26	2f9ea312-25eb-4577-934c-44ed14bf94f6.webp	40.jpg	image/webp	homepage	2026-01-30 03:47:17.531843	t
27	8268f9b6-3e84-4349-b1f7-394d8756ea15.webp	39.jpg	image/webp	homepage	2026-01-30 03:47:17.597331	t
28	084d7ca2-2c0f-40f6-86d9-31ebf5f7480b.webp	38.jpg	image/webp	homepage	2026-01-30 03:47:17.666075	t
29	05af96fe-3f3c-48a7-94cc-9ec0fba09c47.webp	37.jpg	image/webp	homepage	2026-01-30 03:47:17.732087	t
30	da751c50-4907-4599-bd97-ce4f1b971c4e.webp	36.jpg	image/webp	homepage	2026-01-30 03:47:17.814248	t
31	7e9267ce-559c-4dbb-aebb-4e46bfe76dc9.webp	35.jpg	image/webp	homepage	2026-01-30 03:47:17.873424	t
32	b72d77d4-9d0c-41f2-a27d-604996ac70a3.webp	34.jpg	image/webp	homepage	2026-01-30 03:47:17.946167	t
33	542dd75d-b06e-41f9-968d-8b8d3bcbf6a6.webp	33.jpg	image/webp	homepage	2026-01-30 03:47:18.002617	t
34	66220522-6b8b-466a-888d-77961225cff4.webp	32.jpg	image/webp	homepage	2026-01-30 03:47:18.04889	t
35	5b5beab0-5158-442d-a91a-ac7dd1a9f810.webp	31.jpg	image/webp	homepage	2026-01-30 03:47:18.134641	t
25	4a6903d5-5b26-4c3e-8c81-fde2f01b95b5.webp	41.jpg	image/webp	homepage	2026-01-30 03:47:17.441149	t
24	59948cf8-48ac-4184-a33a-152b4cf19953.webp	42.jpg	image/webp	homepage	2026-01-30 03:47:17.37035	t
23	9d7ff952-df6e-4275-851b-b80fb5ed85d9.webp	43.jpg	image/webp	homepage	2026-01-30 03:47:17.299368	t
22	587f8fae-028e-45bb-8966-15b847ac91c8.webp	44.jpg	image/webp	homepage	2026-01-30 03:47:17.216936	t
21	0e98a81f-cf2f-4884-99bd-3ff92658e30c.webp	45.jpg	image/webp	homepage	2026-01-30 03:47:17.13877	t
68	a51ffffa-0a6f-4b01-bd77-25948365816f.webp	20250926-095900543-4458.JPG	image/webp	topics	2026-01-30 03:51:49.718495	t
67	010056c3-4b56-4689-9aa0-c99b3e70ecf7.webp	20240508-101219010-2058.JPG	image/webp	topics	2026-01-30 03:51:43.015829	t
66	994911e0-d68f-427e-b79e-827e9b7967e1.webp	20240527-184208492-7680 2.png	image/webp	topics	2026-01-30 03:51:35.351742	t
69	7d2acf0d-cab6-49e4-a6e4-67c0b1d646b8.webp	套書 示意圖.jpg	image/webp	events	2026-01-30 06:14:20.245086	t
70	8218af52-41fa-4812-9ce3-09243825b1d0.webp	sharon-pittaway-KUZnfk-2DSQ-unsplash.jpg	image/webp	events	2026-01-30 06:20:23.91351	t
71	861b0160-eb9b-4561-9945-2714c37befbe.webp	872.jpg	image/webp	events	2026-01-30 06:20:31.298474	t
72	a5a77462-8998-4701-ae9a-f38ae443868e.webp	998.png	image/webp	events	2026-01-30 06:20:39.586122	t
73	4206c6a4-e5c0-414e-9744-c8c56e2f2c57.webp	A2156197_m.jpeg	image/webp	events	2026-01-30 06:20:49.268631	t
74	6dfd0f5a-bc49-4f78-9db0-2a35379b0b59.webp	micheile-henderson-lZ_4nPFKcV8-unsplash.jpg	image/webp	events	2026-01-30 06:20:57.48281	t
75	92f47506-4369-4806-b737-0b00e970b0c5.webp	krakenimages-Y5bvRlcCx8k-unsplash.jpg	image/webp	events	2026-01-30 06:27:42.673081	t
76	9cd5f7da-b3dd-4533-90c3-2df457835ed4.webp	sincerely-media-dGxOgeXAXm8-unsplash.jpg	image/webp	events	2026-01-30 06:27:51.493244	t
77	4d8deaf2-3683-45f0-b16e-fce0adc2a96e.webp	20160610082356_cf802789-c4c4-4508-89ea-28331f97c6ae_A1144784.jpg	image/webp	events	2026-01-30 06:27:58.666524	t
78	2e5c63d8-9c39-4742-8fed-17890fc41c6b.webp	SIU09899-­õ­×_A2355921.jpg	image/webp	events	2026-01-30 06:28:05.9535	t
79	03bfbce4-fb64-41a6-a4f9-7e5a7b02f199.webp	3-1.jpg	image/webp	events	2026-01-30 06:28:12.493886	t
80	961cb724-2584-4fd7-9a86-21154b0af576.webp	12-3.jpg	image/webp	events	2026-01-30 06:30:04.869508	t
81	008112ca-1651-42b7-ac57-40c69c411518.webp	7C4C0520A87C11EBB89C0FB93DEBE0D2_0.jpg	image/webp	events	2026-01-30 06:30:12.038281	t
83	ab203c2c-5725-47d5-bb48-8ce72b455858.webp	20250116回家聽故事.jpg	image/webp	events	2026-01-30 06:36:05.610482	t
85	578d6a90-1d53-4438-9f9f-40fc7f69ab80.webp	20191207_DSC_9985_%b3%af%abH%a6w_A2182508.jpg	image/webp	events	2026-01-30 06:36:22.166593	t
86	7e72de6c-3dd1-406b-a7db-271f7bcb8a7e.webp	S__184598532.jpg	image/webp	events	2026-01-30 06:36:28.515541	t
87	f4f1a2fc-b80d-4fb2-9ab1-871f35dfca12.webp	修iDSCF2118_A2259815.jpg	image/webp	events	2026-01-30 06:36:45.154728	t
88	2429aae5-987a-48b2-a3cc-567c1451275e.webp	20231101-041638268-8831拷貝.JPG	image/webp	events	2026-01-30 06:36:52.731526	t
89	74e72dc6-6412-4f6e-ae63-4b3c60057035.webp	2019-02-03%aa%c5%b4%ba06_%b6%c0%b0%b6%ae%a6DSC_0062_A1785916拷貝.jpg	image/webp	events	2026-01-30 06:36:58.371288	t
90	dfa9b15b-82e8-433c-962f-eb1740ca4a82.webp	20251022 YT封面尺寸-綠色蔬食旅店主標準字配搭 5.jpg	image/webp	events	2026-01-30 06:42:50.245565	t
91	806cf556-ed8b-4fa1-a919-181120bded1f.webp	20250710-吉祥月九宮格視覺 3.jpg	image/webp	events	2026-01-30 06:42:57.194221	t
92	95cd68b3-7f95-43bc-9175-d45d5d1a6cfa.webp	102.jpeg	image/webp	blessings	2026-01-30 08:32:25.54626	f
84	1b5dcadc-fd22-427e-971a-79d93c8cc896.webp	綠色蔬食旅店封面.jpg	image/webp	events	2026-01-30 06:36:13.699107	f
82	381a00bd-78a9-4ff3-9b80-78c827da7d60.webp	賀卡-1-1.jpg	image/webp	events	2026-01-30 06:35:56.151242	f
93	0167d577-01ab-43b7-9d91-dad482a59581.webp	賀卡-1-1.jpg	image/webp	events	2026-01-30 09:17:45.273438	t
94	0ea94259-9d52-4d1c-9552-778f621560c1.webp	綠色蔬食旅店封面.jpg	image/webp	events	2026-01-30 09:17:51.925825	f
95	cbf5fe9f-dd88-4697-92c2-2f403700799f.webp	綠色蔬食旅店封面.jpg	image/webp	events	2026-01-30 09:20:02.307391	f
96	ce91eddc-25e9-49ba-960f-bbf63262a7e8.webp	綠色蔬食旅店封面.jpg	image/webp	events	2026-01-30 09:21:32.088117	t
97	87d68e25-1782-4080-8ad3-6619a1bfc3e8.webp	102.jpeg	image/webp	blessings	2026-02-02 06:47:15.571	t
98	43bcafb7-c8e8-4ae0-ba8c-6d2bcf7e8b4e.webp	A2479007_m.jpeg	image/webp	events	2026-02-09 08:31:55.771	t
101	c3e7fc17-a8e7-4f95-bcbd-f69c7308a605.webp	精舍過年Banner_六十周年網站.jpg	image/webp	events	2026-02-12 01:56:21.018	t
102	24d87974-ca21-467e-9407-62eaf10663e0.webp	靜思堂寫生.jpg	image/webp	events	2026-02-12 07:04:03.621	t
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

COPY public.impact_sections (id, name, icon, stat_label, stat_value, stat_unit, sort_order) FROM stdin;
1	永續環境	🌱	降低	348,039	噸碳排放	1
2	深耕共伴	🌳	培訓	7,509	名防災士	2
3	向光家園	☀️	驅動	80%	災民利他意願	3
\.


--
-- Data for Name: impact_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.impact_config (id, main_title, subtitle, published, blessing_title, blessing_published) FROM stdin;
1	慈濟 60 年帶來哪些影響？	慈濟用三大主軸回應臺灣社會脈絡	1	傳送祝福 灌溉希望	1
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, name, subtitle, description, icon, background_image, sort_order) FROM stdin;
1	合作	當行動成為力量	透過跨界合作，結合各方資源與專業，共同為社會帶來正向改變。我們相信，當每一分力量匯聚在一起，就能創造更大的影響力。	🤝	/uploads/gallery/a51ffffa-0a6f-4b01-bd77-25948365816f.webp	1
2	人文	讓文化再傳承	深耕人文，傳承慈濟精神與價值。透過藝術、文學、音樂等多元形式，讓美善的種子在每個人心中萌芽。	📚	/uploads/gallery/010056c3-4b56-4689-9aa0-c99b3e70ecf7.webp	2
3	祈福	讓善念被積累	以虔誠的心念，為天下蒼生祈福。在動盪的時代中，傳遞安定的力量，讓愛與希望成為人們前進的動力。	🙏	/uploads/gallery/994911e0-d68f-427e-b79e-827e9b7967e1.webp	3
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

SELECT pg_catalog.setval('public.events_id_seq', 26, true);


--
-- Name: gallery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gallery_id_seq', 102, true);


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
-- Name: impact_config impact_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.impact_config
    ADD CONSTRAINT impact_config_pkey PRIMARY KEY (id);


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

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
-- Default admin user: admin / changeme
--

INSERT INTO public.users (username, password_hash, role) VALUES
('admin', '$2b$10$fUW15z5RyUH9xdh7ZYCSRO5Fp4sGrA.NsGIgHDVThSgP.N2ZIirAm', 'admin');


\unrestrict kYyuLV9fF0UcsSzBPIdElSjCE6cZdgwyQfXYVCm1lwbwcrHS5kV3r3kZwKgxVYd

