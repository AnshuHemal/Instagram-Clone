export interface AppThemeColors {
  primary: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  likeActive: string;
  link: string;
  storyRing: string[];
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  divider: string;
}

export const Colors: Record<'light' | 'dark', AppThemeColors> = {
  light: {
    primary: '#0095F6',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#DBDBDB',
    text: '#262626',
    textSecondary: '#737373',
    likeActive: '#FF3040',
    link: '#00376B',
    storyRing: ['#FCAF45', '#F56040', '#E1306C', '#C13584', '#833AB4'],
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#000000',
    tabBarInactive: '#8E8E8F',
    divider: '#EFEFEF',
  },
  dark: {
    primary: '#0095F6',
    background: '#000000',
    surface: '#121212',
    card: '#121212',
    border: '#262626',
    text: '#F5F5F5',
    textSecondary: '#A8A8A8',
    likeActive: '#FF3040',
    link: '#E0F1FF',
    storyRing: ['#FCAF45', '#F56040', '#E1306C', '#C13584', '#833AB4'],
    tabBarBackground: '#000000',
    tabBarActive: '#FFFFFF',
    tabBarInactive: '#8E8E8F',
    divider: '#262626',
  },
};
