import { ITour } from '../db/models/Tour';

export const defaultTours: Partial<ITour>[] = [
  {
    id: 'dashboard-intro',
    name: 'Dashboard Overview',
    description: 'A quick tour of the Removation dashboard.',
    pages: ['/dashboard'],
    isActive: true,
    isDismissible: true,
    priority: 100,
    steps: [
      {
        target: 'body',
        title: 'Welcome to Removation!',
        content: 'Let\'s take a quick look around your dashboard so you can get the most out of our platform.',
        placement: 'center',
      },
      {
        target: '[data-tour="sidebar-ai-studio"]',
        title: 'AI Design Studio',
        content: 'Access all our powerful AI interior design tools from here.',
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard-credits"]',
        title: 'Your Credits',
        content: 'Keep track of your available credits here. You can easily upgrade if you need more.',
        placement: 'right',
      }
    ]
  },
  {
    id: 'dream-room-intro',
    name: 'Dream Room Intro',
    description: 'Learn how to generate your dream room.',
    pages: ['/dream-room'],
    isActive: true,
    isDismissible: true,
    priority: 90,
    steps: [
      {
        target: '[data-tour="dream-room-theme"]',
        title: 'Choose a Style',
        content: 'Start by picking the design style you want — Modern, Vintage, Industrial, and more.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dream-room-room"]',
        title: 'Select a Room Type',
        content: 'Tell the AI which room to design — living room, bedroom, office, and more.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dream-room-upload"]',
        title: 'Upload Your Photo',
        content: 'Upload a clear photo of your room. The AI will use it as the base for the redesign.',
        placement: 'top',
      },
      {
        target: '[data-tour="dream-room-generate"]',
        title: 'Generate!',
        content: 'Click here when you\'re ready to see your dream room come to life.',
        placement: 'top',
      }
    ]
  },
  {
    id: 'room-changer-intro',
    name: 'Room Changer Intro',
    description: 'Learn how to repaint walls with AI.',
    pages: ['/room-changer'],
    isActive: true,
    isDismissible: true,
    priority: 90,
    steps: [
      {
        target: '[data-tour="rc-uploader"]',
        title: 'Upload a Photo',
        content: 'Upload a clear photo of the room you want to repaint.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="rc-color-picker"]',
        title: 'Choose a Color',
        content: 'Pick your preferred paint color from our curated presets, or use the custom color picker.',
        placement: 'top',
      },
      {
        target: '[data-tour="rc-generate-btn"]',
        title: 'Repaint with AI',
        content: 'Click here to start the AI repaint. The AI will analyze the walls and apply the new color seamlessly.',
        placement: 'top',
      }
    ]
  }
];

