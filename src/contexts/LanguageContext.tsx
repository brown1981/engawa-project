import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ja' | 'en' | 'fr' | 'es' | 'ko' | 'zh' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ja: {
    dashboard_title: "縁側コア | 統合司令塔",
    tagline: "自律型企業統治システム v1.1",
    agent_team: "アクティブ・エージェント・チーム",
    decision_log: "意思決定インテリジェンス・フィード",
    queue: "タスク・キュー",
    kpi_dscr: "DSCR (財務安全性)",
    kpi_revenue: "月次収益合計",
    kpi_efficiency: "システム資源効率",
    settings: "システム設定",
    last_active: "最終稼働",
    processing: "実行中",
    online: "オンライン",
    offline: "オフライン",
    syncing: "同期中...",
    save: "設定を保存",
    passcode_label: "パスコードを入力してください"
  },
  en: {
    dashboard_title: "Engawa Core | Command Center",
    tagline: "Autonomous Enterprise Governance v1.1",
    agent_team: "Active Agent Team (Target Orchestration)",
    decision_log: "Decision Intelligence Feed",
    queue: "Task Queue",
    kpi_dscr: "DSCR (Financial Safety)",
    kpi_revenue: "Total Monthly Revenue",
    kpi_efficiency: "System Efficiency",
    settings: "Settings",
    last_active: "Last Active",
    processing: "Processing",
    online: "Online",
    offline: "Offline",
    syncing: "Syncing...",
    save: "Save Execution",
    passcode_label: "Enter Security Passcode"
  },
  zh: {
    dashboard_title: "缘侧核心 | 综合指挥中心",
    tagline: "自治企业治理系统 v1.1",
    agent_team: "活跃代理人执行团队",
    decision_log: "决策智能信息流",
    queue: "任务队列",
    kpi_dscr: "DSCR (财务安全线)",
    kpi_revenue: "月度总收益",
    kpi_efficiency: "系统资源效率",
    settings: "系统设置",
    last_active: "最后活动",
    processing: "处理中",
    online: "在线",
    offline: "离线",
    syncing: "同步中...",
    save: "保存执行",
    passcode_label: "请输入安全密码"
  },
  ru: {
    dashboard_title: "Engawa Core | Центр управления",
    tagline: "Система автономного управления v1.1",
    agent_team: "Активная группа агентов",
    decision_log: "Лента принятия решений",
    queue: "Очередь задач",
    kpi_dscr: "DSCR (Финансовая безопасность)",
    kpi_revenue: "Общий месячный доход",
    kpi_efficiency: "Эффективность системы",
    settings: "Настройки",
    last_active: "Активность",
    processing: "В процессе",
    online: "В сети",
    offline: "Не в сети",
    syncing: "Синхронизация...",
    save: "Сохранить",
    passcode_label: "Введите код доступа"
  },
  es: {
    dashboard_title: "Core Engawa | Centro de Mando",
    tagline: "Gobernanza Empresarial Autónoma v1.1",
    agent_team: "Equipo de Agentes Activos",
    decision_log: "Flujo de Inteligencia de Decisiones",
    queue: "Cola de Tareas",
    kpi_dscr: "DSCR (Seguridad Financiera)",
    kpi_revenue: "Ingresos Mensuales Totales",
    kpi_efficiency: "Eficiencia del Sistema",
    settings: "Configuración",
    last_active: "Activo",
    processing: "Procesando",
    online: "En línea",
    offline: "Desconectado",
    syncing: "Sincronizando...",
    save: "Guardar Ejecución",
    passcode_label: "Ingrese código de seguridad"
  },
  ko: {
    dashboard_title: "엔가와 코어 | 통합 지휘 센터",
    tagline: "자율 기업 거버넌스 시스템 v1.1",
    agent_team: "액티브 에이전트 팀",
    decision_log: "의사 결정 인テリジェンス 피드",
    queue: "작업 대기열",
    kpi_dscr: "DSCR (재무 안전성)",
    kpi_revenue: "월간 총 수익",
    kpi_efficiency: "시스템 자원 효율성",
    settings: "시스템 설정",
    last_active: "최종 활동",
    processing: "실행 중",
    online: "온라인",
    offline: "오프라인",
    syncing: "동기화 중...",
    save: "설정 저장",
    passcode_label: "보안 암호를 입력하십시오"
  },
  fr: {
    dashboard_title: "Cœur Engawa | Centre de Commande",
    tagline: "Gouvernance d'Entreprise Autonome v1.1",
    agent_team: "Équipe d'Agents Actifs",
    decision_log: "Flux d'Intelligence Décisionnelle",
    queue: "File d'Attente",
    kpi_dscr: "DSCR (Sécurité Financière)",
    kpi_revenue: "Revenu Mensuel Total",
    kpi_efficiency: "Efficacité du Système",
    settings: "Paramètres",
    last_active: "Actif",
    processing: "Traitement",
    online: "En ligne",
    offline: "Hors ligne",
    syncing: "Synchronisation...",
    save: "Sauvegarder",
    passcode_label: "Entrez le code de sécurité"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
