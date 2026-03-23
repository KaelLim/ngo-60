export interface ReportPage {
  id: string;
  title: string;
  file: string; // path relative to content/
}

export interface ReportChapter {
  id: string;
  title: string;
  pages: ReportPage[];
}

export const chapters: ReportChapter[] = [
  {
    id: 'about',
    title: '關於本報告書',
    pages: [
      { id: 'about', title: '關於本報告書', file: '1-about/README.md' },
      { id: 'about-methodology', title: '報告書記錄方法', file: '1-about/methodology.md' },
      { id: 'about-scope', title: '報告書揭露範疇', file: '1-about/scope.md' },
    ]
  },
  {
    id: 'framework',
    title: '影響力主軸',
    pages: [
      { id: 'framework', title: '影響力主軸', file: '2-impact-framework/README.md' },
      { id: 'framework-methodology', title: '影響力評估方法論', file: '2-impact-framework/methodology.md' },
      { id: 'framework-pillars', title: '三大影響力主軸', file: '2-impact-framework/three-pillars.md' },
      { id: 'framework-selection', title: '專案篩選原則', file: '2-impact-framework/project-selection.md' },
    ]
  },
  {
    id: 'environment',
    title: '永續環境',
    pages: [
      { id: 'environment', title: '身心同行的永續環境', file: '3-sustainable-environment/README.md' },
      { id: 'environment-model', title: '影響力模式', file: '3-sustainable-environment/impact-model.md' },
      { id: 'environment-recycling', title: '環保回收站', file: '3-sustainable-environment/recycling-stations.md' },
      { id: 'environment-mobile', title: '行動環保教育車', file: '3-sustainable-environment/mobile-education.md' },
      { id: 'environment-pagamo', title: 'PaGamO 環保防災勇士 PK 賽', file: '3-sustainable-environment/pagamo.md' },
    ]
  },
  {
    id: 'community',
    title: '社區網絡',
    pages: [
      { id: 'community', title: '社區網絡的深耕共伴', file: '4-community-network/README.md' },
      { id: 'community-model', title: '影響力模式', file: '4-community-network/impact-model.md' },
      { id: 'community-anmei', title: '安美專案', file: '4-community-network/anmei-home-safety.md' },
      { id: 'community-youth', title: '多元青年培力', file: '4-community-network/youth-empowerment.md' },
      { id: 'community-disaster', title: '防災士培訓', file: '4-community-network/disaster-preparedness.md' },
    ]
  },
  {
    id: 'humanitarian',
    title: '人道救援',
    pages: [
      { id: 'humanitarian', title: '人道救援到翻轉生命希望', file: '5-humanitarian-aid/README.md' },
      { id: 'humanitarian-model', title: '影響力模式', file: '5-humanitarian-aid/impact-model.md' },
      { id: 'humanitarian-covid', title: 'COVID-19 疫情行動', file: '5-humanitarian-aid/covid-19.md' },
      { id: 'humanitarian-youth', title: '國際青年伴學計畫', file: '5-humanitarian-aid/youth-companion.md' },
      { id: 'humanitarian-ukraine', title: '波蘭烏克蘭人道救援', file: '5-humanitarian-aid/ukraine-poland.md' },
    ]
  }
];
