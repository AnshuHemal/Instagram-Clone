export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  user: {
    username: string;
    name: string;
    avatar: string;
  };
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  comments: Comment[];
  timestamp: string;
  isLiked: boolean;
  isBookmarked: boolean;
  location?: string;
}

export interface Story {
  id: string;
  username: string;
  avatar: string;
  isSeen: boolean;
  imageUrl: string;
}

export interface Reel {
  id: string;
  username: string;
  avatar: string;
  imageUrl: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  musicName: string;
  views: string;
  hlsUrl?: string;
  durationSeconds?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  user: {
    username: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  unreadCount: number;
  lastMessageTime: string;
  messages: Message[];
}

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    username: 'alex_explorer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isSeen: false,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  },
  {
    id: 's2',
    username: 'julia_designs',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isSeen: false,
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
  },
  {
    id: 's3',
    username: 'chef_marco',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isSeen: true,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  },
  {
    id: 's4',
    username: 'travel_bug',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    isSeen: false,
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
  },
  {
    id: 's5',
    username: 'urban_fit',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    isSeen: true,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    user: {
      username: 'alex_explorer',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    caption: 'Lost in the majesty of the deep green woods. There is a quiet music here that heals the soul. 🌲✨ #nature #adventure #silence',
    likesCount: 1420,
    commentsCount: 34,
    comments: [
      { id: 'c1_1', username: 'julia_designs', text: 'Stunning capture! Colors are incredible.', timestamp: '1h' },
      { id: 'c1_2', username: 'travel_bug', text: 'Where exactly was this taken?', timestamp: '30m' },
    ],
    timestamp: '2 hours ago',
    isLiked: false,
    isBookmarked: false,
    location: 'Yosemite Valley, CA',
  },
  {
    id: 'p2',
    user: {
      username: 'julia_designs',
      name: 'Julia Bennett',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
    caption: 'Cozy corners and morning light. Staging the new living room project. 🛋️☀️ #interiordesign #nordic #cozyhome',
    likesCount: 890,
    commentsCount: 18,
    comments: [
      { id: 'c2_1', username: 'alex_explorer', text: 'Love the minimalist styling.', timestamp: '3h' },
      { id: 'c2_2', username: 'chef_marco', text: 'Need that coffee table!', timestamp: '2h' },
    ],
    timestamp: '5 hours ago',
    isLiked: true,
    isBookmarked: true,
    location: 'Copenhagen, Denmark',
  },
  {
    id: 'p3',
    user: {
      username: 'chef_marco',
      name: 'Marco Rossi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    caption: 'Freshly baked sourdough neapolitan pizza. Crispy crust, soft crumb, fresh basil. Simple perfection. 🍕🇮🇹 #pizza #naples #foodie',
    likesCount: 2310,
    commentsCount: 89,
    comments: [
      { id: 'c3_1', username: 'urban_fit', text: 'Oh my god, cheating my diet tonight for sure.', timestamp: '4h' },
      { id: 'c3_2', username: 'julia_designs', text: 'Looks delicious Marco!', timestamp: '3h' },
    ],
    timestamp: '1 day ago',
    isLiked: false,
    isBookmarked: false,
    location: 'Naples, Italy',
  },
];

export const MOCK_REELS: Reel[] = [
  {
    id: 'r1',
    username: 'travel_bug',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
    description: 'Chasing sunsets in the Greek Islands. Add this to your bucket list immediately! 🌅✈️ #santorini #travel #sunset',
    likesCount: 15400,
    commentsCount: 322,
    isLiked: false,
    musicName: 'Original Audio - travel_bug',
    views: '124K',
  },
  {
    id: 'r2',
    username: 'urban_fit',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
    description: 'Morning mobility routine. 5 exercises to unlock your hips and lower back before work. Do these daily! 🏋️‍♂️💪 #fitness #mobility #health',
    likesCount: 9812,
    commentsCount: 145,
    isLiked: true,
    musicName: 'Sunrise Beats - LoFi Horizon',
    views: '89K',
  },
  {
    id: 'r3',
    username: 'alex_explorer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1486916856992-e4db22c8df33?w=800',
    description: 'Drone shot flying over the mist in the Swiss Alps. Felt like a movie set. 🇨🇭🏔️ #switzerland #drone #alps',
    likesCount: 34200,
    commentsCount: 512,
    isLiked: false,
    musicName: 'Cinematic Ambient Soundscape',
    views: '450K',
  },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'ch1',
    user: {
      username: 'julia_designs',
      name: 'Julia Bennett',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isOnline: true,
    },
    lastMessage: 'Hey! Did you see the layout designs I sent over?',
    unreadCount: 2,
    lastMessageTime: '9:41 AM',
    messages: [
      { id: 'm1_1', senderId: 'julia_designs', text: 'Hey there! How is the project coming along?', timestamp: 'Yesterday, 4:30 PM' },
      { id: 'm1_2', senderId: 'current_user_1', text: 'Hey Julia! Going great. Just polishing up the screens now.', timestamp: 'Yesterday, 4:32 PM' },
      { id: 'm1_3', senderId: 'julia_designs', text: 'Awesome. I finished the living room mocks.', timestamp: '9:40 AM' },
      { id: 'm1_4', senderId: 'julia_designs', text: 'Hey! Did you see the layout designs I sent over?', timestamp: '9:41 AM' },
    ],
  },
  {
    id: 'ch2',
    user: {
      username: 'alex_explorer',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isOnline: false,
    },
    lastMessage: 'Let’s go hiking next Sunday!',
    unreadCount: 0,
    lastMessageTime: 'Yesterday',
    messages: [
      { id: 'm2_1', senderId: 'current_user_1', text: 'Great photo you posted!', timestamp: 'Yesterday, 1:15 PM' },
      { id: 'm2_2', senderId: 'alex_explorer', text: 'Thanks man! Really appreciate it.', timestamp: 'Yesterday, 1:20 PM' },
      { id: 'm2_3', senderId: 'alex_explorer', text: 'Let’s go hiking next Sunday!', timestamp: 'Yesterday, 1:22 PM' },
    ],
  },
  {
    id: 'ch3',
    user: {
      username: 'chef_marco',
      name: 'Marco Rossi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isOnline: true,
    },
    lastMessage: 'Perfect! I’ll save a table for you guys.',
    unreadCount: 0,
    lastMessageTime: 'Jun 6',
    messages: [
      { id: 'm3_1', senderId: 'current_user_1', text: 'Can we book a table for 4 this Saturday?', timestamp: 'Jun 6, 2:10 PM' },
      { id: 'm3_2', senderId: 'chef_marco', text: 'Perfect! I’ll save a table for you guys.', timestamp: 'Jun 6, 2:15 PM' },
    ],
  },
];
