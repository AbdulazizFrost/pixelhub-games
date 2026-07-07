'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ru';

type TranslationKeys = 
  | 'logo' | 'store' | 'categories' | 'faq' | 'developerHub' | 'adminPanel' 
  | 'signOut' | 'logIn' | 'signUp' | 'myProfile' | 'searchPlaceholder' 
  | 'allGames' | 'playNow' | 'free' | 'plays' | 'likes' | 'rating' 
  | 'description' | 'categoryGenre' | 'releaseVersion' | 'fileSize' | 'ageRating' 
  | 'developer' | 'achievements' | 'leaderboard' | 'reviews' | 'comments' 
  | 'noAchievements' | 'unlocked' | 'locked' | 'noScores' | 'submitScore' 
  | 'unlockedAchievements' | 'recentActivity' | 'playedTime' | 'hours' | 'minutes' | 'seconds' 
  | 'level' | 'nextLevel' | 'createAccount' | 'alreadyHaveAccount' | 'newToPixelHub'
  | 'publishBuild' | 'uploadSuccess' | 'uploadFailed'
  | 'sortBy' | 'newReleases' | 'popularity' | 'topRated' | 'genres' | 'allGenres' | 'communityNews'
  | 'emailAddress' | 'passwordLabel' | 'loggingIn'
  | 'welcomeBack' | 'loginSubtitle'
  | 'joinEcosystem' | 'accountType' | 'player' | 'usernameLabel' | 'creatingAccount' | 'logInHere'
  | 'viewDetails' | 'uploadYourGame' | 'exploreStore'
  | 'discover' | 'browse' | 'news' | 'community' | 'main' | 'library' | 'favorites' | 'recent'
  | 'playAnywhere' | 'playAnywhereSub' | 'viewAll' | 'uploadGame' | 'popularGames' | 'topDevelopers'
  | 'follow' | 'following' | 'newsAndUpdates' | 'topPlayed' | 'communityActivity'
  | 'noGamesUploaded' | 'noCreatorsYet' | 'noPlayStats' | 'noCommunityUpdates'
  | 'playsCountText' | 'gamesCountText' | 'popularTab' | 'topRatedTab' | 'newTab' | 'searchGames';

const translations: Record<Language, Record<TranslationKeys, string>> = {
  en: {
    logo: "PixelHub",
    store: "Store",
    categories: "Categories",
    faq: "FAQ",
    developerHub: "Developer Hub",
    adminPanel: "Admin Panel",
    signOut: "Sign Out",
    logIn: "Log In",
    signUp: "Sign Up",
    myProfile: "My Profile",
    searchPlaceholder: "Search games, tags, genres...",
    allGames: "All Games",
    playNow: "PLAY NOW",
    free: "FREE",
    plays: "plays",
    likes: "likes",
    rating: "rating",
    description: "Description",
    categoryGenre: "Category Genre",
    releaseVersion: "Release Version",
    fileSize: "File Size",
    ageRating: "Age Rating",
    developer: "Developer",
    achievements: "Achievements",
    leaderboard: "Leaderboard",
    reviews: "Reviews",
    comments: "Discussion",
    noAchievements: "No achievements available for this game.",
    unlocked: "Unlocked",
    locked: "Locked",
    noScores: "No leaderboard entries yet. Be the first to score!",
    submitScore: "Submit Score",
    unlockedAchievements: "Unlocked Achievements",
    recentActivity: "Recent Activity",
    playedTime: "played time",
    hours: "hrs",
    minutes: "mins",
    seconds: "secs",
    level: "Level",
    nextLevel: "Next Level",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    newToPixelHub: "New to PixelHub?",
    publishBuild: "PUBLISH BUILD",
    uploadSuccess: "Upload completed successfully!",
    uploadFailed: "Failed to publish game.",
    sortBy: "Sort By:",
    newReleases: "New Releases",
    popularity: "Popularity (Plays)",
    topRated: "Top Rated",
    genres: "Genres",
    allGenres: "All Genres",
    communityNews: "Community News",
    emailAddress: "Email Address",
    passwordLabel: "Password",
    loggingIn: "LOGGING IN...",
    welcomeBack: "Welcome Back",
    loginSubtitle: "Log in to sync your level, achievements, and play stats.",
    joinEcosystem: "Join a secure ecosystem of browser game developers & players.",
    accountType: "Account Type",
    player: "Player",
    usernameLabel: "Username",
    creatingAccount: "CREATING...",
    logInHere: "Log in here",
    viewDetails: "VIEW DETAILS",
    uploadYourGame: "UPLOAD YOUR GAME",
    exploreStore: "EXPLORE STORE",
    discover: "Discover",
    browse: "Browse",
    news: "News",
    community: "Community",
    main: "Main",
    library: "Library",
    favorites: "Favorites",
    recent: "Recent",
    playAnywhere: "Play Anywhere",
    playAnywhereSub: "All games run directly in your browser. No downloads. No limits.",
    viewAll: "View All",
    uploadGame: "Upload Game",
    popularGames: "Popular Games",
    topDevelopers: "Top Developers",
    follow: "Follow",
    following: "Following",
    newsAndUpdates: "News & Updates",
    topPlayed: "Top Played",
    communityActivity: "Community Activity",
    noGamesUploaded: "No games uploaded yet.",
    noCreatorsYet: "No active creators yet.",
    noPlayStats: "No play stats logged yet.",
    noCommunityUpdates: "No community updates.",
    playsCountText: "plays",
    gamesCountText: "games published",
    popularTab: "Popular",
    topRatedTab: "Top Rated",
    newTab: "New",
    searchGames: "Search games, developers..."
  },
  ru: {
    logo: "PixelHub",
    store: "Магазин",
    categories: "Категории",
    faq: "FAQ",
    developerHub: "Панель разработчика",
    adminPanel: "Админка",
    signOut: "Выйти",
    logIn: "Войти",
    signUp: "Регистрация",
    myProfile: "Мой профиль",
    searchPlaceholder: "Поиск игр, тегов, жанров...",
    allGames: "Все игры",
    playNow: "ИГРАТЬ",
    free: "БЕСПЛАТНО",
    plays: "запусков",
    likes: "лайков",
    rating: "рейтинг",
    description: "Описание",
    categoryGenre: "Жанр/Категория",
    releaseVersion: "Версия релиза",
    fileSize: "Размер файла",
    ageRating: "Возрастной ценз",
    developer: "Разработчик",
    achievements: "Достижения",
    leaderboard: "Таблица рекордов",
    reviews: "Отзывы",
    comments: "Обсуждение",
    noAchievements: "У этой игры пока нет достижений.",
    unlocked: "Разблокировано",
    locked: "Заблокировано",
    noScores: "Рекордов пока нет. Будьте первым!",
    submitScore: "Отправить рекорд",
    unlockedAchievements: "Открытые достижения",
    recentActivity: "Недавняя активность",
    playedTime: "время в игре",
    hours: "ч",
    minutes: "мин",
    seconds: "сек",
    level: "Уровень",
    nextLevel: "Следующий уровень",
    createAccount: "Создать аккаунт",
    alreadyHaveAccount: "Уже есть аккаунт?",
    newToPixelHub: "Впервые в PixelHub?",
    publishBuild: "ОПУБЛИКОВАТЬ ИГРУ",
    uploadSuccess: "Игра успешно опубликована!",
    uploadFailed: "Не удалось опубликовать игру.",
    sortBy: "Сортировка:",
    newReleases: "Новинки",
    popularity: "Популярность (Запуски)",
    topRated: "Лучшие оценки",
    genres: "Жанры",
    allGenres: "Все жанры",
    communityNews: "Новости сообщества",
    emailAddress: "Электронная почта",
    passwordLabel: "Пароль",
    loggingIn: "ВХОД...",
    welcomeBack: "С возвращением",
    loginSubtitle: "Войдите, чтобы синхронизировать ваш уровень, достижения и статистику.",
    joinEcosystem: "Присоединяйтесь к безопасной экосистеме игроков и разработчиков.",
    accountType: "Тип аккаунта",
    player: "Игрок",
    usernameLabel: "Имя пользователя",
    creatingAccount: "СОЗДАНИЕ...",
    logInHere: "Войти здесь",
    viewDetails: "ПОДРОБНЕЕ",
    uploadYourGame: "ОПУБЛИКОВАТЬ ИГРУ",
    exploreStore: "ОБЗОР МАГАЗИНА",
    discover: "Обзор",
    browse: "Просмотр",
    news: "Новости",
    community: "Сообщество",
    main: "Главное",
    library: "Библиотека",
    favorites: "Избранное",
    recent: "Недавнее",
    playAnywhere: "Играй везде",
    playAnywhereSub: "Все игры работают прямо в браузере. Без скачиваний. Без ограничений.",
    viewAll: "Показать все",
    uploadGame: "Загрузить игру",
    popularGames: "Популярные игры",
    topDevelopers: "Лучшие разработчики",
    follow: "Подписаться",
    following: "Вы подписаны",
    newsAndUpdates: "Новости и обновления",
    topPlayed: "Популярные запуски",
    communityActivity: "Активность сообщества",
    noGamesUploaded: "Игры еще не загружены.",
    noCreatorsYet: "Нет активных создателей.",
    noPlayStats: "Статистика запусков отсутствует.",
    noCommunityUpdates: "Нет обновлений сообщества.",
    playsCountText: "запусков",
    gamesCountText: "игр опубликовано",
    popularTab: "Популярное",
    topRatedTab: "Лучшие",
    newTab: "Новые",
    searchGames: "Поиск игр, разработчиков..."
  }
};

interface LocaleContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ru'); // default to Russian as requested

  useEffect(() => {
    const storedLang = localStorage.getItem('pixelhub_lang') as Language;
    if (storedLang === 'ru' || storedLang === 'en') {
      setLangState(storedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    localStorage.setItem('pixelhub_lang', newLang);
    setLangState(newLang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
